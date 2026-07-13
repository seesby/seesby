import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import LocalLocationsView   from './views/LocalLocationsView';
import LocalMapView         from './views/LocalMapView';
import LocalServiceAreasView from './views/LocalServiceAreasView';
import LocalReviewsView     from './views/LocalReviewsView';

export default function LocalViewRouter() {
  const [view] = useViewMode('local');
  return (
    <ViewCanvas>
      {view === 'map'          ? <LocalMapView /> :
       view === 'serviceAreas' ? <LocalServiceAreasView /> :
       view === 'reviews'      ? <LocalReviewsView /> :
                                 <LocalLocationsView />}
    </ViewCanvas>
  );
}
