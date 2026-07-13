import { getAllActions } from '@seesby/actions';
import { UNIFIED_ISSUE_TAXONOMY, getPageIssues } from '../../services/UnifiedIssueTaxonomy';

export const SEO_ISSUES_TAXONOMY = UNIFIED_ISSUE_TAXONOMY;
export { getPageIssues };

/**
 * Issue taxonomy rewritten to be a thin map over the new action catalog.
 * Categorizes actions for UI display in the issue list.
 */
export const ISSUE_TAXONOMY = Object.fromEntries(
	getAllActions().map((a) => [a.code, {
		title: a.title,
		category: a.code.startsWith('C') ? 'Content' :
		          a.code.startsWith('T') ? 'Technical' :
		          a.code.startsWith('L') ? 'Links' :
		          a.code.startsWith('S') ? 'Structured Data' :
		          a.code.startsWith('A') ? 'AI' :
		          a.code.startsWith('P') ? 'Performance' :
		          a.code.startsWith('U') ? 'UX' :
		          a.code.startsWith('SO') ? 'Social' :
		          a.code.startsWith('E') ? 'Commerce' : 'Local',
		severity: a.severity,
		effort: a.effortMinutes,
	}])
);
