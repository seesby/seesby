import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import TechnicalPagesView from './views/TechnicalPagesView';
import CrawlMapView       from './views/CrawlMapView';
import RenderDiffView     from './views/RenderDiffView';
import SecurityA11yView   from './views/SecurityA11yView';

export default function TechnicalViewRouter() {
  const [view] = useViewMode('technical');
  return (
    <ViewCanvas>
      {view === 'crawlMap'     ? <CrawlMapView /> :
       view === 'renderDiff'   ? <RenderDiffView /> :
       view === 'securityA11y' ? <SecurityA11yView /> :
                                 <TechnicalPagesView />}
    </ViewCanvas>
  );
}
