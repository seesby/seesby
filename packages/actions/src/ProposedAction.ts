// packages/actions/src/ProposedAction.ts
import type { ActionCode, SeverityBand } from '@seesby/types';

export interface ProposedAction {
	code: ActionCode;
	scope: 'page' | 'site' | 'cluster';
	scopeId: string;
	severity: SeverityBand;
	trace: ReadonlyArray<{ key: string; value: unknown }>; // metrics that tripped the trigger
	impactEstimate?: number;
	effortEstimate?: number;
}

export type ActionTrigger = (data: any) => ProposedAction[];
