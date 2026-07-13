import React from 'react';
import {
  DataRow, MetricPill, Card, StatusBadge,
  formatNumber, formatDuration,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function getCwvStatus(metric: string, val: number): 'pass' | 'warn' | 'fail' {
  if (metric === 'lcp') return val <= 2500 ? 'pass' : val <= 4000 ? 'warn' : 'fail';
  if (metric === 'cls') return val <= 0.1 ? 'pass' : val <= 0.25 ? 'warn' : 'fail';
  if (metric === 'inp') return val <= 200 ? 'pass' : val <= 500 ? 'warn' : 'fail';
  return 'pass';
}

function getCwvColor(val: number, metric: string): string {
  const status = getCwvStatus(metric, val);
  return status === 'pass' ? 'text-green-400' : status === 'warn' ? 'text-orange-400' : 'text-red-400';
}

export default function CwvTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const lcp = page?.lcp ?? page?.cwv?.lcp ?? page?.cwvLcp;
  const cls = page?.cls ?? page?.cwv?.cls ?? page?.cwvCls;
  const inp = page?.inp ?? page?.cwv?.inp ?? page?.cwvInp;

  const mobileLcp = page?.mobileLcp ?? page?.cwvMobileLcp;
  const mobileCls = page?.mobileCls ?? page?.cwvMobileCls;
  const mobileInp = page?.mobileInp ?? page?.cwvMobileInp;
  const desktopLcp = page?.desktopLcp ?? page?.cwvDesktopLcp;
  const desktopCls = page?.desktopCls ?? page?.cwvDesktopCls;
  const desktopInp = page?.desktopInp ?? page?.cwvDesktopInp;

  const fieldData = page?.cwvFieldData || page?.fieldData;
  const labData = page?.cwvLabData || page?.labData;

  const lcpP75 = page?.lcpP75 ?? page?.cwv?.lcpP75;
  const clsP75 = page?.clsP75 ?? page?.cwv?.clsP75;
  const inpP75 = page?.inpP75 ?? page?.cwv?.inpP75;

  const allPass = Number(lcp) <= 2500 && Number(cls) <= 0.1 && Number(inp) <= 200;
  const anyPoor = Number(lcp) > 4000 || Number(cls) > 0.25 || Number(inp) > 500;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="LCP" value={formatDuration(lcp)} good={Number(lcp) <= 2500} />
        <MetricPill label="CLS" value={formatNumber(cls, { maximumFractionDigits: 3 })} good={Number(cls) <= 0.1} />
        <MetricPill label="INP" value={formatDuration(inp)} good={Number(inp) <= 200} />
        <MetricPill label="Status" value={allPass ? 'Good' : anyPoor ? 'Poor' : 'Mid'} good={allPass} />
        <MetricPill label="P75 LCP" value={lcpP75 ? formatDuration(lcpP75) : '\u2014'} />
      </div>

      {/* Trend */}
      {hasTrend && (
        <Card title="CWV Trend">
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
            <Sparkline values={page?.cwvTrend || []} tone="info" />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Desktop */}
        <Card title="Desktop">
          <DataRow label="LCP" value={formatDuration(desktopLcp)} status={getCwvStatus('lcp', Number(desktopLcp))} />
          <DataRow label="CLS" value={formatNumber(desktopCls, { maximumFractionDigits: 3 })} status={getCwvStatus('cls', Number(desktopCls))} />
          <DataRow label="INP" value={formatDuration(desktopInp)} status={getCwvStatus('inp', Number(desktopInp))} />
        </Card>

        {/* Mobile */}
        <Card title="Mobile">
          <DataRow label="LCP" value={formatDuration(mobileLcp)} status={getCwvStatus('lcp', Number(mobileLcp))} />
          <DataRow label="CLS" value={formatNumber(mobileCls, { maximumFractionDigits: 3 })} status={getCwvStatus('cls', Number(mobileCls))} />
          <DataRow label="INP" value={formatDuration(mobileInp)} status={getCwvStatus('inp', Number(mobileInp))} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Field Data */}
        <Card title="Field Data (Real Users)">
          {fieldData ? (
            <div>
              <DataRow label="LCP" value={formatDuration(fieldData.lcp)} status={getCwvStatus('lcp', Number(fieldData.lcp))} />
              <DataRow label="CLS" value={formatNumber(fieldData.cls, { maximumFractionDigits: 3 })} status={getCwvStatus('cls', Number(fieldData.cls))} />
              <DataRow label="INP" value={formatDuration(fieldData.inp)} status={getCwvStatus('inp', Number(fieldData.inp))} />
            </div>
          ) : (
            <div className="text-[12px] text-[#666]">No field data available.</div>
          )}
        </Card>

        {/* Lab Data */}
        <Card title="Lab Data (Lighthouse)">
          {labData ? (
            <div>
              <DataRow label="LCP" value={formatDuration(labData.lcp)} status={getCwvStatus('lcp', Number(labData.lcp))} />
              <DataRow label="CLS" value={formatNumber(labData.cls, { maximumFractionDigits: 3 })} status={getCwvStatus('cls', Number(labData.cls))} />
              <DataRow label="INP" value={formatDuration(labData.inp)} status={getCwvStatus('inp', Number(labData.inp))} />
            </div>
          ) : (
            <div className="text-[12px] text-[#666]">No lab data available.</div>
          )}
        </Card>
      </div>

      {/* P75 Values */}
      {(lcpP75 || clsP75 || inpP75) && (
        <Card title="P75 Values">
          <DataRow label="LCP P75" value={formatDuration(lcpP75)} status={getCwvStatus('lcp', Number(lcpP75))} />
          <DataRow label="CLS P75" value={formatNumber(clsP75, { maximumFractionDigits: 3 })} status={getCwvStatus('cls', Number(clsP75))} />
          <DataRow label="INP P75" value={formatDuration(inpP75)} status={getCwvStatus('inp', Number(inpP75))} />
        </Card>
      )}

      {/* Pass / Needs Improvement / Poor */}
      <Card title="Assessment">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-center">
            <div className="text-[20px] text-green-400 font-bold">{allPass ? '\u2713' : '\u2014'}</div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest">Pass</div>
            <div className="text-[9px] text-[#444] mt-1">LCP \u2264 2.5s, CLS \u2264 0.1, INP \u2264 200ms</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-center">
            <div className="text-[20px] text-orange-400 font-bold">{!allPass && !anyPoor ? '\u25CB' : '\u2014'}</div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest">Needs Work</div>
            <div className="text-[9px] text-[#444] mt-1">LCP \u2264 4s, CLS \u2264 0.25, INP \u2264 500ms</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-center">
            <div className="text-[20px] text-red-400 font-bold">{anyPoor ? '\u2717' : '\u2014'}</div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest">Poor</div>
            <div className="text-[9px] text-[#444] mt-1">Exceeds "Needs Work" thresholds</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
