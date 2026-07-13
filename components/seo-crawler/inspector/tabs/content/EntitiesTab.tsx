import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric,
} from '../../shared';

export default function EntitiesTab({ page }: { page: any }) {
  const primaryEntity = page?.primaryEntity || page?.mainEntity || '';
  const entityConfidence = Number(page?.entityConfidence || page?.primaryEntityConfidence || 0);
  const primaryEntityType = page?.primaryEntityType || '—';
  const primaryEntitySameAs = page?.primaryEntitySameAs || false;
  const relatedEntities = Array.isArray(page?.relatedEntities) ? page.relatedEntities : [];
  const wordCount = Number(page?.wordCount || 0);
  const entityCount = Number(page?.entityCount || relatedEntities.length || 0);
  const entityDensity = wordCount > 0 ? ((entityCount / wordCount) * 1000).toFixed(1) : '0';
  const topicCoverage = Number(page?.topicCoverageScore || getMetric(page, 'topicCoverageScore') || 0);

  const internalMentions: string[] = Array.isArray(page?.entityInternalMentions)
    ? page.entityInternalMentions
    : Array.isArray(page?.internalEntityLinks) ? page.internalEntityLinks : [];
  const externalMentions = Number(page?.externalEntityMentions || page?.entityExternalMentions || 0);

  const peerMissingEntities: string[] = Array.isArray(page?.peerMissingEntities)
    ? page.peerMissingEntities
    : Array.isArray(page?.missingEntityGaps) ? page.missingEntityGaps : [];

  const graphNodes: Array<{ name: string; type: string; size?: number }> = Array.isArray(page?.entityGraphNodes)
    ? page.entityGraphNodes
    : Array.isArray(page?.knowledgeGraph?.nodes) ? page.knowledgeGraph.nodes : [];
  const graphEdges: Array<{ from: string; to: string; label?: string }> = Array.isArray(page?.entityGraphEdges)
    ? page.entityGraphEdges
    : Array.isArray(page?.knowledgeGraph?.edges) ? page.knowledgeGraph.edges : [];

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Primary" value={primaryEntity || '—'} good={!!primaryEntity} />
        <MetricPill label="Confidence" value={entityConfidence > 0 ? `${entityConfidence.toFixed(0)}%` : '—'} good={entityConfidence >= 80} />
        <MetricPill label="Entities" value={formatNumber(entityCount)} good={entityCount > 0} />
        <MetricPill label="Density" value={`${entityDensity}/1k`} />
        <MetricPill label="Coverage" value={topicCoverage > 0 ? `${topicCoverage.toFixed(0)}%` : '—'} good={topicCoverage >= 70} />
      </div>

      {/* Top row: Primary + Related entities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Primary entity */}
        <Card title="Primary">
          {primaryEntity ? (
            <>
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#141414]">
                <div className="text-[13px] text-white font-semibold">{primaryEntity}</div>
                <span className="text-[11px] text-[#888]">conf {entityConfidence > 0 ? `${entityConfidence.toFixed(0)}%` : '—'}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[11px] text-[#888]">{primaryEntityType}</span>
                  <StatusBadge status="pass" label="✓" />
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[11px] text-[#888]">sameAs</span>
                  <StatusBadge status={primaryEntitySameAs ? 'pass' : 'info'} label={primaryEntitySameAs ? '✓' : '✗'} />
                </div>
              </div>
            </>
          ) : (
            <div className="text-[11px] text-[#444] py-2">No primary entity detected.</div>
          )}
        </Card>

        {/* Related entities table */}
        <Card title="Related entities">
          {relatedEntities.length === 0 ? (
            <div className="text-[11px] text-[#444] py-2">No related entities found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="text-left text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Entity</th>
                    <th className="text-left text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Type</th>
                    <th className="text-right text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Mentions</th>
                    <th className="text-center text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">Schema</th>
                    <th className="text-center text-[10px] text-[#555] uppercase tracking-wider font-medium pb-1.5">sameAs</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedEntities.slice(0, 12).map((e: any, i: number) => {
                    const name = typeof e === 'string' ? e : (e?.name || e?.text || String(e));
                    const type = typeof e === 'object' ? (e?.type || e?.category || 'Thing') : 'Thing';
                    const mentions = typeof e === 'object' ? (e?.mentions || e?.count || 0) : 0;
                    const hasSchema = typeof e === 'object' ? !!e?.inSchema : false;
                    const sameAs = typeof e === 'object' ? (e?.sameAs || e?.sameAsUrl || false) : false;
                    const sameAsLabel = typeof e === 'object' && e?.sameAsSource ? `✓ (${e.sameAsSource})` : sameAs ? '✓' : '✗';
                    return (
                      <tr key={i} className="border-b border-[#111] last:border-b-0">
                        <td className="py-1.5 text-[#ccc]">{name}</td>
                        <td className="py-1.5 text-[#888]">{type}</td>
                        <td className="py-1.5 text-[#888] text-right font-mono">{mentions || '—'}</td>
                        <td className="py-1.5 text-center">
                          <StatusBadge status={hasSchema ? 'pass' : 'info'} label={hasSchema ? '✓' : '✗'} />
                        </td>
                        <td className="py-1.5 text-center">
                          <StatusBadge status={sameAs ? 'pass' : 'info'} label={sameAsLabel} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Middle row: Mentions + Knowledge graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Mentions */}
        <Card title="Mentions">
          {internalMentions.length === 0 && externalMentions === 0 ? (
            <div className="text-[11px] text-[#444] py-2">No entity mentions found.</div>
          ) : (
            <div className="space-y-2">
              {internalMentions.length > 0 && (
                <div>
                  <div className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-1">Internal</div>
                  <div className="flex flex-wrap gap-1">
                    {internalMentions.slice(0, 8).map((url: string, i: number) => (
                      <StatusBadge key={i} status="info" label={url} />
                    ))}
                    {internalMentions.length > 8 && (
                      <span className="text-[10px] text-[#555] self-center">· {internalMentions.length - 8} more</span>
                    )}
                  </div>
                </div>
              )}
              <DataRow
                label="External"
                value={formatNumber(externalMentions)}
                status={externalMentions === 0 ? 'warn' : 'pass'}
              />
            </div>
          )}
        </Card>

        {/* Knowledge graph */}
        <Card title="Knowledge graph">
          {graphNodes.length === 0 ? (
            <div className="text-[11px] text-[#444] py-2">No knowledge graph data available.</div>
          ) : (
            <div className="relative bg-[#060606] border border-[#1a1a1a] rounded p-3 min-h-[120px]">
              <svg viewBox="0 0 300 140" className="w-full h-auto">
                {/* Render edges */}
                {graphEdges.map((edge, i) => {
                  const fromNode = graphNodes.find(n => n.name === edge.from);
                  const toNode = graphNodes.find(n => n.name === edge.to);
                  if (!fromNode || !toNode) return null;
                  const fromIdx = graphNodes.indexOf(fromNode);
                  const toIdx = graphNodes.indexOf(toNode);
                  const angle1 = (Math.PI * 2 * fromIdx) / graphNodes.length;
                  const angle2 = (Math.PI * 2 * toIdx) / graphNodes.length;
                  const cx = 150, cy = 70, r = 50;
                  return (
                    <line
                      key={i}
                      x1={cx + r * Math.cos(angle1)}
                      y1={cy + r * Math.sin(angle1)}
                      x2={cx + r * Math.cos(angle2)}
                      y2={cy + r * Math.sin(angle2)}
                      stroke="#333"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* Render nodes */}
                {graphNodes.map((node, i) => {
                  const angle = (Math.PI * 2 * i) / graphNodes.length;
                  const cx = 150, cy = 70, r = 50;
                  const x = cx + r * Math.cos(angle);
                  const y = cy + r * Math.sin(angle);
                  const isPrimary = node.name === primaryEntity;
                  const nodeR = isPrimary ? 8 : 5;
                  const color = node.type === 'Person' ? '#a78bfa' : node.type === 'Org' || node.type === 'Organization' ? '#3b82f6' : '#22c55e';
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r={nodeR} fill={color} opacity={isPrimary ? 1 : 0.7} />
                      <text x={x} y={y + nodeR + 10} textAnchor="middle" className="fill-[#888]" style={{ fontSize: '8px' }}>
                        {node.name.length > 12 ? node.name.slice(0, 12) + '…' : node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </Card>
      </div>

      {/* Coverage vs peers */}
      {peerMissingEntities.length > 0 && (
        <Card title="Coverage vs peers">
          <div className="text-[11px] text-[#888] mb-2">
            Peer articles mention {peerMissingEntities.length} more entities we don't:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {peerMissingEntities.map((entity: string, i: number) => (
              <StatusBadge key={i} status="warn" label={entity} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
