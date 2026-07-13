import React from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import FullAuditViewRouter   from './views/full-audit/FullAuditViewRouter';
import WqaViewRouter         from './views/wqa/WqaViewRouter';
import TechnicalViewRouter   from './views/technical/TechnicalViewRouter';
import ContentViewRouter     from './views/content/ContentViewRouter';
import LinksViewRouter       from './views/links-authority/LinksViewRouter';
import AiViewRouter          from './views/ai/AiViewRouter';
import CompetitorsViewRouter from './views/competitors/CompetitorsViewRouter';
import LocalViewRouter       from './views/local/LocalViewRouter';
import CommerceViewRouter    from './views/commerce/CommerceViewRouter';
import UxViewRouter          from './views/ux-conversion/UxViewRouter';
import PaidViewRouter        from './views/paid/PaidViewRouter';
import SocialViewRouter      from './views/social-brand/SocialViewRouter';

export default function AuditViewRouter() {
  const { mode } = useSeoCrawler() as any;
  switch (mode) {
    case 'fullAudit':      return <FullAuditViewRouter />;
    case 'wqa':            return <WqaViewRouter />;
    case 'technical':      return <TechnicalViewRouter />;
    case 'content':        return <ContentViewRouter />;
    case 'linksAuthority': return <LinksViewRouter />;
    case 'ai':             return <AiViewRouter />;
    case 'competitors':    return <CompetitorsViewRouter />;
    case 'local':          return <LocalViewRouter />;
    case 'commerce':       return <CommerceViewRouter />;
    case 'uxConversion':   return <UxViewRouter />;
    case 'paid':           return <PaidViewRouter />;
    case 'socialBrand':    return <SocialViewRouter />;
    default:               return <FullAuditViewRouter />;
  }
}
