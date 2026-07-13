import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Image as ImageIcon, Link2 } from 'lucide-react';
import { DataRow, formatNumber, MetricCard, SectionHeader, StatusBadge } from './shared';

type LinkListTab = 'inlinks' | 'outlinks' | 'images' | 'external';

export default function LinksTab({ page }: { page: any }) {
    const [linksSubTab, setLinksSubTab] = useState<LinkListTab>('inlinks');

    const activeItems = useMemo(() => {
        if (linksSubTab === 'inlinks') return Array.isArray(page?.inlinksList) ? page.inlinksList : [];
        if (linksSubTab === 'outlinks') return Array.isArray(page?.outlinksList) ? page.outlinksList : [];
        if (linksSubTab === 'external') return Array.isArray(page?.externalOutlinksList) ? page.externalOutlinksList : [];
        return Array.isArray(page?.images) ? page.images : Array.isArray(page?.imageDetails) ? page.imageDetails.map((img: any) => img?.src).filter(Boolean) : [];
    }, [linksSubTab, page]);

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MetricCard label="Link Score" value={formatNumber(page?.linkScore)} />
                <MetricCard label="Inlinks" value={formatNumber(page?.inlinks)} sub={`Unique ${formatNumber(page?.uniqueInlinks)}`} />
                <MetricCard label="Outlinks" value={formatNumber(page?.outlinks)} sub={`Unique ${formatNumber(page?.uniqueOutlinks)}`} />
                <MetricCard label="Internal PageRank" value={formatNumber(page?.internalPageRank, { maximumFractionDigits: 4 })} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Link Health" />
                    <DataRow label="External Outlinks" value={formatNumber(page?.externalOutlinks)} />
                    <DataRow label="Unique External" value={formatNumber(page?.uniqueExternalOutlinks)} />
                    <DataRow label="Broken Internal" value={formatNumber(page?.brokenInternalLinks)} status={Number(page?.brokenInternalLinks || 0) > 0 ? 'fail' : 'pass'} />
                    <DataRow label="Broken External" value={formatNumber(page?.brokenExternalLinks)} status={Number(page?.brokenExternalLinks || 0) > 0 ? 'warn' : 'pass'} />
                    <DataRow label="Redirect Hops" value={formatNumber(page?.redirectChainLength)} status={Number(page?.redirectChainLength || 0) > 1 ? 'warn' : 'pass'} />
                    <DataRow label="Nofollow Internal" value={formatNumber(page?.nofollowInternalLinks)} status={Number(page?.nofollowInternalLinks || 0) > 0 ? 'warn' : 'pass'} />
                    <DataRow label="Orphan Risk" value={Number(page?.inlinks || 0) === 0 && Number(page?.crawlDepth || 0) > 0 ? 'Likely orphan' : 'No'} status={Number(page?.inlinks || 0) === 0 && Number(page?.crawlDepth || 0) > 0 ? 'warn' : 'pass'} />
                </div>

                <div className="xl:col-span-2">
                    <SectionHeader title="Link Explorer" />
                    <div className="flex items-center gap-1 mb-3 bg-[var(--brand-surface-0)] rounded-lg p-0.5 border border-[var(--brand-border-2)] w-fit">
                        {[
                            { id: 'inlinks' as const, label: 'Inlinks', count: Number(page?.inlinks || 0), icon: <ArrowDownRight size={10} /> },
                            { id: 'outlinks' as const, label: 'Outlinks', count: Number(page?.outlinks || 0), icon: <ArrowUpRight size={10} /> },
                            { id: 'external' as const, label: 'External', count: Number(page?.externalOutlinks || 0), icon: <Link2 size={10} /> },
                            { id: 'images' as const, label: 'Images', count: Number(page?.totalImages || 0), icon: <ImageIcon size={10} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setLinksSubTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${linksSubTab === tab.id ? 'bg-[var(--brand-border-2)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)] hover:text-[var(--brand-text-mid)]'}`}
                            >
                                {tab.icon}
                                {tab.label}
                                <span className="text-[var(--brand-text-faint)] font-mono text-[10px]">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {activeItems.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-[var(--brand-text-faint)] border border-[var(--brand-border-2)] rounded bg-[var(--brand-surface-0)] text-[12px]">
                            No items found for {linksSubTab}.
                        </div>
                    ) : (
                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded">
                            <table className="w-full text-[11px] font-mono">
                                <tbody>
                                    {activeItems.map((item: any, index: number) => {
                                        const value = typeof item === 'string' ? item : (item?.url || item?.src || JSON.stringify(item));
                                        return (
                                            <tr key={`${linksSubTab}-${index}`} className="border-b border-[var(--brand-surface-3)] hover:bg-[var(--brand-surface-2)]">
                                                <td className="px-3 py-1 text-[var(--brand-text-faint)] w-[60px]">#{index + 1}</td>
                                                <td className="px-3 py-1 text-blue-400 break-all">{value}</td>
                                                {typeof item === 'object' && item?.anchorText && (
                                                    <td className="px-3 py-1 text-[var(--brand-text-mid)]">{item.anchorText}</td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={Number(page?.redirectChainLength || 0) > 1 ? 'warn' : 'pass'} label={`Redirect chain: ${formatNumber(page?.redirectChainLength)}`} />
                        <StatusBadge status={Number(page?.inlinks || 0) === 0 && Number(page?.crawlDepth || 0) > 0 ? 'warn' : 'info'} label={`Depth: ${formatNumber(page?.crawlDepth)}`} />
                        <StatusBadge status={Number(page?.linkEquity || 0) > 5 ? 'pass' : 'info'} label={`Link Equity: ${formatNumber(page?.linkEquity)}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
