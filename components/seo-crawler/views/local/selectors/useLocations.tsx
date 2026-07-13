import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';

export type LocationRow = {
  id: string;
  name: string;
  address: string;
  phone: string;
  gbpVerified: boolean;
  napConsistency: number;
  rating: number;
  reviewCount: number;
  rankAvg: number | null;
  clicks: number;
  city: string;
  state: string;
};

function statusIcon(ok: boolean) {
  return ok
    ? <span className="text-[#22c55e]">&#10003;</span>
    : <span className="text-[#ef4444]">&#10007;</span>;
}

function ratingColor(r: number) {
  if (r >= 4.5) return 'text-[#22c55e]';
  if (r >= 4.0) return 'text-[#f59e0b]';
  return 'text-[#ef4444]';
}

export function useLocations() {
  const ctx = useSeoCrawler() as any;
  const rawLocations = ctx?.locations;

  const locations = useMemo(() => {
    return rawLocations ?? [];
  }, [rawLocations]);

  const rows: LocationRow[] = useMemo(() =>
    locations.map((l: any) => ({
      id: l.id ?? l.url,
      name: l.name,
      address: l.address,
      phone: l.phone,
      gbpVerified: l.gbpVerified ?? l.gbp?.verified ?? false,
      napConsistency: l.napConsistency ?? 1,
      rating: l.rating ?? l.reviews?.rating ?? 0,
      reviewCount: l.reviewCount ?? l.reviews?.count ?? 0,
      rankAvg: l.rankAvg ?? l.rank?.avg ?? null,
      clicks: l.clicks ?? 0,
      city: l.city ?? '',
      state: l.state ?? '',
    })),
  [locations]);

  const columns: ColumnDef<LocationRow>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Location',
      cell: ({ row }) => (
        <span className="text-white font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <span className="text-[#bbb] truncate max-w-[180px] block">{row.original.address}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-[#bbb]">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'gbpVerified',
      header: 'GBP',
      cell: ({ row }) => statusIcon(row.original.gbpVerified),
    },
    {
      accessorKey: 'napConsistency',
      header: 'NAP',
      cell: ({ row }) => {
        const v = row.original.napConsistency;
        const color = v >= 0.9 ? 'text-[#22c55e]' : v >= 0.7 ? 'text-[#f59e0b]' : 'text-[#ef4444]';
        return <span className={color}>{Math.round(v * 100)}%</span>;
      },
    },
    {
      accessorKey: 'reviewCount',
      header: 'Reviews',
      cell: ({ row }) => (
        <span className="text-[#bbb] tabular-nums">{row.original.reviewCount.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <span className={`${ratingColor(row.original.rating)} tabular-nums`}>{row.original.rating.toFixed(1)}</span>
      ),
    },
    {
      accessorKey: 'rankAvg',
      header: 'Pack',
      cell: ({ row }) => {
        const v = row.original.rankAvg;
        if (v === null) return <span className="text-[#ef4444]">&#10007;</span>;
        const color = v <= 3 ? 'text-[#22c55e]' : v <= 10 ? 'text-[#f59e0b]' : 'text-[#ef4444]';
        return <span className={color}>#{v}</span>;
      },
    },
    {
      accessorKey: 'clicks',
      header: 'Clicks',
      cell: ({ row }) => (
        <span className="text-[#bbb] tabular-nums">{row.original.clicks.toLocaleString()}</span>
      ),
    },
  ], []);

  return { rows, columns };
}
