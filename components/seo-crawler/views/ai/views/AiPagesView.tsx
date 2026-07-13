'use client'

import React from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { ModePageView } from '../../_shared/ModePageView';
import { useAiPages } from '../selectors/useAiPages';
import { BotAccessMatrix } from './BotAccessMatrix';
import type { AiPageRow } from '../selectors/useAiPages';

export default function AiPagesView() {
  const { botAccess } = useSeoCrawler() as any;

  return (
    <ModePageView<AiPageRow>
      useRows={useAiPages}
      emptyText="No pages with AI signals yet."
      footerSlot={
        botAccess ? (
          <BotAccessMatrix
            robots={botAccess.robots ?? {}}
            meta={botAccess.meta ?? {}}
            headers={botAccess.headers ?? {}}
          />
        ) : undefined
      }
    />
  );
}
