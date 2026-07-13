import { crawlDb } from './CrawlDatabase';
import type { SavedView, SavedViewSeed } from '@seesby/modes';
import type { Mode } from '@seesby/types';

const LS_FALLBACK = 'seesby.savedViews.v1';

export const SavedViewsStore = {
	async list(mode: Mode): Promise<SavedView[]> {
		try {
			return await crawlDb.savedViews.where('mode').equals(mode).sortBy('updatedAt');
		} catch {
			return readLs().filter(v => v.mode === mode);
		}
	},
	async create(input: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedView> {
		const now = Date.now();
		const view: SavedView = { ...input, id: `sv_${now}_${Math.random().toString(36).slice(2,8)}`, createdAt: now, updatedAt: now };
		try { await crawlDb.savedViews.put(view); }
		catch { writeLs([...readLs(), view]); }
		return view;
	},
	async update(id: string, patch: Partial<SavedView>): Promise<SavedView | null> {
		try {
			const current = await crawlDb.savedViews.get(id);
			if (!current) return null;
			const next = { ...current, ...patch, updatedAt: Date.now() };
			await crawlDb.savedViews.put(next);
			return next;
		} catch {
			const all = readLs();
			const i = all.findIndex(v => v.id === id);
			if (i < 0) return null;
			all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
			writeLs(all);
			return all[i];
		}
	},
	async remove(id: string): Promise<void> {
		try { await crawlDb.savedViews.delete(id); }
		catch { writeLs(readLs().filter(v => v.id !== id)); }
	},
	async seedIfEmpty(mode: Mode, seeds: ReadonlyArray<SavedViewSeed>): Promise<void> {
		const existing = await this.list(mode);
		if (existing.length > 0) return;
		for (const s of seeds) await this.create({ ...s, mode });
	},
};

function readLs(): SavedView[] { try { return JSON.parse(localStorage.getItem(LS_FALLBACK) || '[]'); } catch { return []; } }
function writeLs(xs: SavedView[]): void { try { localStorage.setItem(LS_FALLBACK, JSON.stringify(xs)); } catch {} }
