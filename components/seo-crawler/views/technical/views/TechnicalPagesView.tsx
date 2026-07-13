import React from 'react';
import { ModePageView } from '../../_shared/ModePageView';
import { useTechnicalPages } from '../selectors/useTechnicalPages';

export default function TechnicalPagesView() {
  return (
    <ModePageView useRows={useTechnicalPages} emptyText="No pages crawled yet." />
  );
}
