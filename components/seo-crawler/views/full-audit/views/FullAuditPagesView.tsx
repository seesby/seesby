import React from 'react';
import { ModePageView } from '../../_shared/ModePageView';
import { useFullAuditPages } from '../selectors/useFullAuditPages';

export default function FullAuditPagesView() {
  return (
    <ModePageView useRows={useFullAuditPages} emptyText="No pages crawled yet." />
  );
}
