import React from 'react';
import { ViewCanvas } from '../_shared/ViewCanvas';
import { useViewMode } from '../_hooks/useViewMode';
import SocialOverviewView   from './views/SocialOverviewView';
import SocialProfilesView   from './views/SocialProfilesView';
import SocialPostsView      from './views/SocialPostsView';
import SocialMentionsView   from './views/SocialMentionsView';
import SocialEngagementView from './views/SocialEngagementView';
import SocialTrafficView    from './views/SocialTrafficView';
import SocialMetaView       from './views/SocialMetaView';

export default function SocialViewRouter() {
  const [view] = useViewMode('socialBrand');
  return (
    <ViewCanvas>
      {view === 'posts'      ? <SocialPostsView /> :
       view === 'mentions'   ? <SocialMentionsView /> :
       view === 'engagement' ? <SocialEngagementView /> :
       view === 'traffic'    ? <SocialTrafficView /> :
       view === 'metaAudit'  ? <SocialMetaView /> :
       view === 'profiles'   ? <SocialProfilesView /> :
                                <SocialOverviewView />}
    </ViewCanvas>
  );
}
