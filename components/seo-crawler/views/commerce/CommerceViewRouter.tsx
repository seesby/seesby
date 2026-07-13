import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import CommerceProductsView    from './views/CommerceProductsView';
import CommerceCollectionsView from './views/CommerceCollectionsView';
import CommerceTemplatesView   from './views/CommerceTemplatesView';
import CommerceFeedView        from './views/CommerceFeedView';
import CommerceFunnelView      from './views/CommerceFunnelView';

export default function CommerceViewRouter() {
  const [view] = useViewMode('commerce');
  return (
    <ViewCanvas>
      {view === 'collections' ? <CommerceCollectionsView /> :
       view === 'templates'   ? <CommerceTemplatesView /> :
       view === 'feed'        ? <CommerceFeedView /> :
       view === 'funnel'      ? <CommerceFunnelView /> :
                                 <CommerceProductsView />}
    </ViewCanvas>
  );
}
