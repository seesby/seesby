import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import PaidOverviewView         from './views/PaidOverviewView';
import PaidCampaignsView        from './views/PaidCampaignsView';
import PaidKeywordsView         from './views/PaidKeywordsView';
import PaidAdsView              from './views/PaidAdsView';
import PaidLandingPagesView     from './views/PaidLandingPagesView';
import PaidAuctionInsightsView  from './views/PaidAuctionInsightsView';

export default function PaidViewRouter() {
  const [view] = useViewMode('paid');
  return (
    <ViewCanvas>
      {view === 'campaigns'        ? <PaidCampaignsView /> :
       view === 'keywords'         ? <PaidKeywordsView /> :
       view === 'ads'              ? <PaidAdsView /> :
       view === 'landingPages'     ? <PaidLandingPagesView /> :
       view === 'auctionInsights'  ? <PaidAuctionInsightsView /> :
                                      <PaidOverviewView />}
    </ViewCanvas>
  );
}
