import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import FullAuditPagesView   from './views/FullAuditPagesView';
import FullAuditChartsView  from './views/FullAuditChartsView';
import FullAuditSiteMapView from './views/FullAuditSiteMapView';
import FullAuditIssuesView  from './views/FullAuditIssuesView';

export default function FullAuditViewRouter() {
  const [view] = useViewMode('fullAudit');

  return (
    <ViewCanvas>
      {view === 'charts'  ? <FullAuditChartsView /> :
       view === 'sitemap' ? <FullAuditSiteMapView /> :
       view === 'issues'  ? <FullAuditIssuesView /> :
                            <FullAuditPagesView />}
    </ViewCanvas>
  );
}
