import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import { useVisibleViews } from '../_hooks/useViewVisibility';
import CompetitorsComparisonView  from './views/CompetitorsComparisonView';
import CompetitorsGapView         from './views/CompetitorsGapView';
import CompetitorsSerpOverlapView from './views/CompetitorsSerpOverlapView';
import CompetitorsContentDepthView from './views/CompetitorsContentDepthView';

export default function CompetitorsViewRouter() {
  const [view] = useViewMode('competitors');
  const visible = useVisibleViews('competitors');
  const allowed = new Set(visible.map(v => v.id));
  const safe = allowed.has(view) ? view : 'comparison';

  return (
    <ViewCanvas>
      {safe === 'gap'          ? <CompetitorsGapView /> :
       safe === 'serpOverlap'  ? <CompetitorsSerpOverlapView /> :
       safe === 'contentDepth' ? <CompetitorsContentDepthView /> :
                                 <CompetitorsComparisonView />}
    </ViewCanvas>
  );
}
