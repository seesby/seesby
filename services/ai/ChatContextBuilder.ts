// services/ai/ChatContextBuilder.ts

export class ChatContextBuilder {
    static buildContext(project: any, pages: any[], currentCrawlSummary: any, userMessage: string) {
        // Budget: 8k tokens (roughly 32k characters)
        const summaryStr = `
Project: ${project?.name || 'Current Site'}
Health Score: ${currentCrawlSummary?.healthScore || 'Unknown'}
GEO Score (Avg): ${currentCrawlSummary?.avgGeoScore || 'N/A'}
Total HTML Pages: ${currentCrawlSummary?.total || pages.length}
Critical Issues: ${currentCrawlSummary?.topIssues?.join(', ') || 'None identified'}
        `.trim();

        // Top Pages with metrics
        const samplePages = pages
            .sort((a, b) => (b.gscImpressions || 0) - (a.gscImpressions || 0))
            .slice(0, 10)
            .map(p => `- [${p.url}]: Title: "${p.title}", Status: ${p.statusCode}, Impressions: ${p.gscImpressions || 0}, GEO: ${p.geoScore || 0}, Tech: ${p.techHealthScore || 0}`)
            .join('\n');

        // Distribution summaries
        const statusCodeDist = pages.reduce((acc, p) => {
            acc[p.statusCode] = (acc[p.statusCode] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const geoDist = pages.reduce((acc, p) => {
            const bucket = Math.floor((p.geoScore || 0) / 20) * 20;
            acc[`${bucket}-${bucket+20}`] = (acc[`${bucket}-${bucket+20}`] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return `
SYSTEM CONTEXT: You are Seesby AI, an elite SEO consultant. Use the crawl data below to answer the user's question with strategic, data-backed insights.

SITE SUMMARY:
${summaryStr}

STATUS CODE DISTRIBUTION:
${JSON.stringify(statusCodeDist)}

GEO SCORE DISTRIBUTION:
${JSON.stringify(geoDist)}

REPRESENTATIVE PAGES (Top by Impressions):
${samplePages}

USER QUESTION:
${userMessage}
        `.trim();
    }
}
