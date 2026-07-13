import React from 'react';
import { ModePageView } from '../../views/_shared/ModePageView';
import { useWqaPages } from './selectors/useWqaPages';

export default function WqaPagesView() {
  return (
    <ModePageView useRows={useWqaPages} emptyText="No pages crawled yet." />
  );
}
