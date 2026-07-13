import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import AiPagesView    from './views/AiPagesView';
import AiPromptsView  from './views/AiPromptsView';
import AiEntitiesView from './views/AiEntitiesView';

export default function AiViewRouter() {
  const [view] = useViewMode('ai');
  return (
    <ViewCanvas>
      {view === 'prompts'  ? <AiPromptsView /> :
       view === 'entities' ? <AiEntitiesView /> :
                             <AiPagesView />}
    </ViewCanvas>
  );
}
