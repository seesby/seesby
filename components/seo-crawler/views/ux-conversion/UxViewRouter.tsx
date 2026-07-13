import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import UxOverviewView   from './views/UxOverviewView';
import UxPagesView      from './views/UxPagesView';
import UxFunnelsView    from './views/UxFunnelsView';
import UxHeatmapsView   from './views/UxHeatmapsView';
import UxReplaysView    from './views/UxReplaysView';
import UxExperimentsView from './views/UxExperimentsView';
import UxFormsView      from './views/UxFormsView';

export default function UxViewRouter() {
  const [view] = useViewMode('uxConversion');
  return (
    <ViewCanvas>
      {view === 'pages'       ? <UxPagesView /> :
       view === 'funnels'     ? <UxFunnelsView /> :
       view === 'heatmaps'    ? <UxHeatmapsView /> :
       view === 'replays'     ? <UxReplaysView /> :
       view === 'experiments' ? <UxExperimentsView /> :
       view === 'forms'       ? <UxFormsView /> :
                                <UxOverviewView />}
    </ViewCanvas>
  );
}
