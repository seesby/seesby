import React from 'react';
import { ModePageView } from '../../_shared/ModePageView';
import { useContentPages } from '../selectors/useContentPages';

export default function ContentPagesView() {
  return (
    <ModePageView useRows={useContentPages} emptyText="No pages crawled yet." />
  );
}
