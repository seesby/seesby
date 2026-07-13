import type { SidebarState } from '../contexts/SeoCrawlerContext';

const KEY = 'seesby.sidebarState.v1';

// Provide a default here or re-import the constant if defined there
const DEFAULT_SIDEBAR_STATE: SidebarState = {
	collapsed: false,
	query: '',
	collapsedSections: {},
	activeSavedViewId: null,
};

export function loadSidebarState(): SidebarState {
	if (typeof window === 'undefined') return DEFAULT_SIDEBAR_STATE;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return DEFAULT_SIDEBAR_STATE;
		const parsed = JSON.parse(raw);
		return { ...DEFAULT_SIDEBAR_STATE, ...parsed };
	} catch {
		return DEFAULT_SIDEBAR_STATE;
	}
}

export function saveSidebarState(state: SidebarState): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(KEY, JSON.stringify({
			collapsed: state.collapsed,
			collapsedSections: state.collapsedSections,
			// query and activeSavedViewId are session-only, not persisted
		}));
	} catch { /* quota / private mode */ }
}
