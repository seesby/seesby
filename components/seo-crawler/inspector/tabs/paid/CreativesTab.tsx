import React, { useState } from 'react';
import { DataRow, Card, MetricPill, StatusBadge, formatNumber, formatPercent } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

type ViewMode = 'gallery' | 'table';

export default function CreativesTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const creatives = page?.paidCreatives || page?.adCreatives || page?.ads || [];
  const disapprovals = page?.disapprovedAds || page?.paidDisapprovals || [];
  const fatigued = page?.fatiguedCreatives || page?.paidFatiguedAds || [];
  const [view, setView] = useState<ViewMode>('gallery');

  const strongCount = creatives.filter((c: any) => c.strength === 'strong' || c.strength === 'excellent').length;
  const learningCount = creatives.filter((c: any) => c.status === 'learning' || c.learningPhase).length;
  const activeCount = creatives.filter((c: any) => c.status === 'active' || c.status === 'ENABLED' || !c.status).length;
  const rsaAds = creatives.filter((c: any) => c.type === 'RSA' || c.type === 'responsive_search_ad' || c.headlines);

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricPill label="Total ads" value={String(creatives.length)} />
        <MetricPill label="Active" value={String(activeCount)} good={activeCount > 0} />
        <MetricPill label="Strong" value={String(strongCount)} good={strongCount > 0} />
        <MetricPill label="Learning" value={String(learningCount)} good={learningCount === 0} />
        <MetricPill label="Fatigued" value={String(fatigued.length)} good={fatigued.length === 0} />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('gallery')}
          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
            view === 'gallery' ? 'bg-[#222] text-white' : 'text-[#555] hover:text-[#888]'
          }`}
        >
          Gallery
        </button>
        <button
          onClick={() => setView('table')}
          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
            view === 'table' ? 'bg-[#222] text-white' : 'text-[#555] hover:text-[#888]'
          }`}
        >
          Table
        </button>
        {disapprovals.length > 0 && (
          <span className="ml-auto text-[10px] text-[#ef4444]">{disapprovals.length} disapproved</span>
        )}
      </div>

      {/* Gallery view */}
      {view === 'gallery' && creatives.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {creatives.slice(0, 20).map((ad: any, i: number) => {
            const ctr = Number(ad.ctr || 0);
            const cvr = Number(ad.conversionRate || ad.cvr || 0);
            const isFatigued = ad.fatigue || fatigued.includes(ad);
            const isDisapproved = disapprovals.some((d: any) => d.id === ad.id || d.headline === ad.headline);
            return (
              <div key={i} className={`bg-[#0e0e0e] border rounded-lg p-2.5 ${
                isDisapproved ? 'border-[#ef4444]/40' : isFatigued ? 'border-[#f59e0b]/40' : 'border-[#1a1a1a]'
              }`}>
                <div className="aspect-[4/3] bg-[#1a1a1a] rounded mb-2 flex items-center justify-center text-[10px] text-[#444]">
                  {ad.type === 'video' || ad.format === 'video' ? 'VIDEO' :
                   ad.type === 'carousel' ? 'CAROUSEL' :
                   ad.type === 'image' || ad.format === 'image' ? 'IMAGE' : ad.type || 'AD'}
                </div>
                <div className="text-[10px] text-[#ccc] truncate font-medium">{ad.headline || ad.name || `Ad ${i + 1}`}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] text-[#888]">CTR {ctr ? formatPercent(ctr, 100) : '—'}</span>
                  {cvr > 0 && <span className="text-[9px] text-[#888]">CvR {formatPercent(cvr, 100)}</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isFatigued ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'}`} />
                  <span className="text-[9px] text-[#666]">{isFatigued ? 'Fatigued' : 'Healthy'}</span>
                  {isDisapproved && <StatusBadge status="fail" label="disapproved" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && creatives.length > 0 && (
        <Card title={`Ads (${creatives.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="px-2 py-1.5 text-left text-[#555] uppercase tracking-widest font-bold">Headline</th>
                  <th className="px-2 py-1.5 text-left text-[#555] uppercase tracking-widest font-bold">Type</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">Impr</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">CTR</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">Conv</th>
                  <th className="px-2 py-1.5 text-right text-[#555] uppercase tracking-widest font-bold">CPC</th>
                  <th className="px-2 py-1.5 text-center text-[#555] uppercase tracking-widest font-bold">Strength</th>
                  <th className="px-2 py-1.5 text-center text-[#555] uppercase tracking-widest font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {creatives.slice(0, 30).map((ad: any, i: number) => (
                  <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                    <td className="px-2 py-1.5 text-[#ccc] truncate max-w-[200px]">{ad.headline || ad.name || '—'}</td>
                    <td className="px-2 py-1.5 text-[#888]">{ad.type || '—'}</td>
                    <td className="px-2 py-1.5 text-right text-[#ccc]">{formatNumber(ad.impressions)}</td>
                    <td className="px-2 py-1.5 text-right text-[#ccc]">{ad.ctr ? formatPercent(ad.ctr, 100) : '—'}</td>
                    <td className="px-2 py-1.5 text-right text-[#ccc]">{formatNumber(ad.conversions)}</td>
                    <td className="px-2 py-1.5 text-right text-[#ccc]">{ad.cpc ? `$${formatNumber(ad.cpc, { maximumFractionDigits: 2 })}` : '—'}</td>
                    <td className="px-2 py-1.5 text-center">
                      <StatusBadge
                        status={ad.strength === 'excellent' || ad.strength === 'strong' ? 'pass' : ad.strength === 'good' ? 'warn' : 'fail'}
                        label={ad.strength || '—'}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <StatusBadge
                        status={ad.status === 'active' || ad.status === 'ENABLED' ? 'pass' : ad.status === 'paused' ? 'warn' : 'fail'}
                        label={ad.status || 'unknown'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* RSA rows */}
      {rsaAds.length > 0 && (
        <Card title={`Responsive search ads (${rsaAds.length})`}>
          <div className="space-y-0">
            {rsaAds.slice(0, 10).map((ad: any, i: number) => (
              <div key={i} className="py-2.5 border-b border-[#111] last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#ccc] font-medium">{ad.headline || ad.name || `RSA ${i + 1}`}</span>
                  <StatusBadge
                    status={ad.strength === 'excellent' ? 'pass' : ad.strength === 'strong' ? 'pass' : 'warn'}
                    label={ad.strength || '—'}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#666]">
                  <span>Headlines {ad.headlineCount || '—'}/{ad.maxHeadlines || 15}</span>
                  <span>Descriptions {ad.descriptionCount || '—'}/{ad.maxDescriptions || 4}</span>
                  <span>Assets {ad.assetCoverage || '—'}</span>
                  <span>Impr {formatNumber(ad.impressions)}</span>
                  <span>CTR {ad.ctr ? formatPercent(ad.ctr, 100) : '—'}</span>
                  <span>Conv {formatNumber(ad.conversions)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Disapprovals */}
      {disapprovals.length > 0 && (
        <Card title={`Disapprovals (${disapprovals.length})`}>
          <div className="space-y-0">
            {disapprovals.map((ad: any, i: number) => (
              <div key={i} className="flex items-start gap-2.5 py-2 border-b border-[#111] last:border-b-0">
                <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[#ccc] font-medium">{ad.headline || ad.name || `Ad ${i + 1}`}</div>
                  <div className="text-[10px] text-[#666] mt-0.5">{ad.reason || ad.policy || 'Policy violation'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {creatives.length === 0 && (
        <div className="text-center py-12 text-[12px] text-[#555]">
          No creative data available. Connect an ad account to see ad performance.
        </div>
      )}
    </div>
  );
}
