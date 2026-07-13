import type { ActionCode, Capability, Industry, Mode } from '@seesby/types';
import type { SidebarSection } from './sidebar-types';

import { registerAiMode } from './definitions/ai';
import { registerCommerceMode } from './definitions/commerce';
import { registerCompetitorsMode } from './definitions/competitors';
import { registerContentMode } from './definitions/content';
import { registerFullAuditMode } from './definitions/full-audit';
import { registerLinksAuthorityMode } from './definitions/links-authority';
import { registerLocalMode } from './definitions/local';
import { registerPaidMode } from './definitions/paid';
import { registerSocialBrandMode } from './definitions/social-brand';
import { registerTechnicalMode } from './definitions/technical';
import { registerUxConversionMode } from './definitions/ux-conversion';
import { registerWqaMode } from './definitions/wqa';

export interface ModeView {
	id: string;
	kind: 'table' | 'dashboard' | 'graph' | 'timeline' | 'map' | 'reports';
	label: string;
	shortcut?: string;
	badge?: 'count';
	requires?: ReadonlyArray<Capability>;
	submodes?: ReadonlyArray<{ id: string; label: string }>;
}

export interface InspectorTabDef {
	id: string;
	label: string;
	icon: string; // lucide icon name
	count?: (page: any) => number | undefined;
}

export interface ModeDescriptor {
	id: Mode;
	label: string;
	accent: string;
	description: string;
	shortcut: string;
	defaultViewId: string;
	views: ReadonlyArray<ModeView>;
	lsSections: ReadonlyArray<SidebarSection>;
	rsTabs: ReadonlyArray<{ id: string; label: string }>;
	inspectorTabs: ReadonlyArray<InspectorTabDef>;
	actionCodes: ReadonlyArray<ActionCode>;
	industryOverlays?: ReadonlyArray<Industry>;
	requiresCapabilities?: ReadonlyArray<Capability>;
	visible?: ReadonlyArray<string>;
}

const DEFS = new Map<Mode, ModeDescriptor>();

export function registerMode(d: ModeDescriptor) {
  if (DEFS.has(d.id)) {
    console.log(`registerMode: Skipping "${d.id}" (already registered)`);
    return;
  }
  DEFS.set(d.id, d);
  console.log(`registerMode: Registered "${d.id}"`);
}

export function getMode(id: Mode): ModeDescriptor {
  const m = DEFS.get(id);
  if (!m) {
    console.error(`getMode: Unknown mode "${id}". Available:`, Array.from(DEFS.keys()));
    throw new Error(`Unknown mode: ${id}`);
  }
  return m;
}

export function allModes(): ReadonlyArray<ModeDescriptor> {
  return [...DEFS.values()];
}

export function registerAllModes() {
  if (DEFS.size >= 12) return; // Already registered
  
  console.log('registerAllModes: Starting registration...');
  try { registerFullAuditMode(); console.log(' - Registered fullAudit'); } catch(e) { console.error('Failed to register fullAudit', e); }
  try { registerWqaMode(); console.log(' - Registered wqa'); } catch(e) { console.error('Failed to register wqa', e); }
  try { registerTechnicalMode(); console.log(' - Registered technical'); } catch(e) { console.error('Failed to register technical', e); }
  try { registerContentMode(); console.log(' - Registered content'); } catch(e) { console.error('Failed to register content', e); }
  try { registerLinksAuthorityMode(); console.log(' - Registered linksAuthority'); } catch(e) { console.error('Failed to register linksAuthority', e); }
  try { registerUxConversionMode(); console.log(' - Registered uxConversion'); } catch(e) { console.error('Failed to register uxConversion', e); }
  try { registerPaidMode(); console.log(' - Registered paid'); } catch(e) { console.error('Failed to register paid', e); }
  try { registerCommerceMode(); console.log(' - Registered commerce'); } catch(e) { console.error('Failed to register commerce', e); }
  try { registerSocialBrandMode(); console.log(' - Registered socialBrand'); } catch(e) { console.error('Failed to register socialBrand', e); }
  try { registerAiMode(); console.log(' - Registered ai'); } catch(e) { console.error('Failed to register ai', e); }
  try { registerCompetitorsMode(); console.log(' - Registered competitors'); } catch(e) { console.error('Failed to register competitors'); }
  try { registerLocalMode(); console.log(' - Registered local'); } catch(e) { console.error('Failed to register local', e); }
  
  console.log('registerAllModes: Completed. Available:', Array.from(DEFS.keys()));
}
