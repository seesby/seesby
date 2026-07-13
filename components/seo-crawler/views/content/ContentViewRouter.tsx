import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import { useVisibleViews } from '../_hooks/useViewVisibility';
import ContentPagesView      from './views/ContentPagesView';
import ContentClustersView   from './views/ContentClustersView';
import ContentDuplicatesView from './views/ContentDuplicatesView';
import ContentCalendarView   from './views/ContentCalendarView';

export default function ContentViewRouter() {
  const [view] = useViewMode('content');
  const visible = useVisibleViews('content');
  const allowed = new Set(visible.map(v => v.id));
  const safe = allowed.has(view) ? view : 'pages';

  return (
    <ViewCanvas>
      {safe === 'clusters'   ? <ContentClustersView /> :
       safe === 'duplicates' ? <ContentDuplicatesView /> :
       safe === 'calendar'   ? <ContentCalendarView /> :
                               <ContentPagesView />}
    </ViewCanvas>
  );
}
