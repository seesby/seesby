import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import LinksGraphView        from './views/LinksGraphView';
import LinksBacklinksView    from './views/LinksBacklinksView';
import LinksAnchorsView      from './views/LinksAnchorsView';
import LinksOrphansDepthView from './views/LinksOrphansDepthView';

export default function LinksViewRouter() {
  const [view] = useViewMode('linksAuthority');
  return (
    <ViewCanvas>
      {view === 'backlinks'    ? <LinksBacklinksView /> :
       view === 'anchors'      ? <LinksAnchorsView /> :
       view === 'orphansDepth' ? <LinksOrphansDepthView /> :
                                 <LinksGraphView />}
    </ViewCanvas>
  );
}
