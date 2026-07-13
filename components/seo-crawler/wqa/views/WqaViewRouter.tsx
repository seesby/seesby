import React from 'react';
import { ViewCanvas } from '../../views/_shared/ViewCanvas';
import { useViewMode } from '../../views/_hooks/useViewMode';
import WqaPagesView       from './WqaPagesView';
import WqaStructureView   from './WqaStructureView';
import WqaPerformanceView from './WqaPerformanceView';

export default function WqaViewRouter() {
  const [view] = useViewMode('wqa');

  return (
    <ViewCanvas>
      {view === 'map'     ? <WqaStructureView /> :
       view === 'reports' ? <WqaPerformanceView /> :
                            <WqaPagesView />}
    </ViewCanvas>
  );
}
