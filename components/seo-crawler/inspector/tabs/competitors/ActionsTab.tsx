import React from 'react';
import {
  Card, MetricPill, StatusBadge,
  formatNumber,
} from '../../shared';

export default function ActionsTab({ page }: { page: any; hasTrend?: boolean }) {
  const recommendedPlay = page?.recommendedPlay || page?.recommendedAction || page?.play || null;
  const allPlays = page?.recommendedPlays || page?.plays || (recommendedPlay ? [recommendedPlay] : []);

  // Fallback: build a play from page data
  const topic = page?.topic || page?.query || page?.keyword || '';
  const catchability = page?.catchability || page?.gapType || '';
  const forecast = page?.forecast || page?.positionForecast || null;
  const plan = page?.actionPlan || page?.plan || [];
  const effort = page?.effort || page?.estimatedEffort || '';

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Plays" value={formatNumber(allPlays.length)} />
        <MetricPill label="Catchable" value={catchability === 'catchable' ? 'Yes' : 'No'} good={catchability === 'catchable'} />
        <MetricPill label="Forecast" value={forecast || '\u2014'} />
        <MetricPill label="Effort" value={effort || '\u2014'} />
        <MetricPill label="Topic" value={topic || '\u2014'} />
      </div>

      {/* Recommended plays */}
      {allPlays.length > 0 ? (
        allPlays.map((play: any, i: number) => (
          <RecommendedPlay key={i} play={play} />
        ))
      ) : (
        /* Fallback: build from raw data */
        <Card title="Recommended play">
          {catchability && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge
                  status={catchability === 'catchable' ? 'pass' : catchability === 'aspirational' ? 'warn' : 'info'}
                  label={catchability.toUpperCase()}
                />
                {topic && <span className="text-[12px] text-[var(--brand-text-strong)] font-medium">"{topic}"</span>}
              </div>
            </div>
          )}

          {Array.isArray(plan) && plan.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-2">Plan</div>
              <div className="space-y-1.5">
                {plan.map((step: any, j: number) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="text-[11px] text-[var(--brand-text-faint)] shrink-0">{j + 1}.</span>
                    <span className="text-[11px] text-[var(--brand-text-mid)] leading-snug">
                      {typeof step === 'string' ? step : step.text || step.description || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(forecast || effort) && (
            <div className="pt-2 border-t border-[var(--brand-surface-2)] space-y-1">
              {forecast && (
                <div className="text-[11px] text-[var(--brand-text-mid)]">
                  <span className="text-[var(--brand-text-faint)]">Forecast: </span>
                  {forecast}
                </div>
              )}
              {effort && (
                <div className="text-[11px] text-[var(--brand-text-mid)]">
                  <span className="text-[var(--brand-text-faint)]">Effort: </span>
                  {effort}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function RecommendedPlay({ play }: { play: any }) {
  const playType = play.type || play.action || 'CATCH UP';
  const topic = play.topic || play.query || play.keyword || '';
  const plan = play.plan || play.steps || play.recommendations || [];
  const forecast = play.forecast || play.positionForecast || null;
  const effort = play.effort || play.estimatedEffort || '';

  return (
    <Card title="Recommended play">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-[12px] text-[var(--brand-text-strong)] font-semibold">
            {playType} {topic && `"${topic}"`}
          </span>
        </div>
      </div>

      {Array.isArray(plan) && plan.length > 0 && (
        <div className="mb-3">
          <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-2">Plan</div>
          <div className="space-y-1.5">
            {plan.map((step: any, j: number) => (
              <div key={j} className="flex items-start gap-2">
                <span className="text-[11px] text-[var(--brand-text-faint)] shrink-0">{j + 1}.</span>
                <span className="text-[11px] text-[var(--brand-text-mid)] leading-snug">
                  {typeof step === 'string' ? step : step.text || step.description || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(forecast || effort) && (
        <div className="pt-2 border-t border-[var(--brand-surface-2)] space-y-1">
          {forecast && (
            <div className="text-[11px] text-[var(--brand-text-mid)]">
              <span className="text-[var(--brand-text-faint)]">Forecast: </span>
              {forecast}
            </div>
          )}
          {effort && (
            <div className="text-[11px] text-[var(--brand-text-mid)]">
              <span className="text-[var(--brand-text-faint)]">Effort: </span>
              {effort}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
