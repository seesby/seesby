import jsPDF from 'jspdf';

export async function generatePDFReport(data: {
  siteName: string;
  crawlDate: string;
  healthScore: number;
  issueBreakdown: Array<{ type: string; label: string; count: number }>;
  recommendations: string[];
  logo?: string;
}) {
  const pdf = new jsPDF('p', 'mm', 'a4');

  if (data.logo) {
    try {
      pdf.addImage(data.logo, 'PNG', 20, 20, 40, 40);
    } catch {
      pdf.setFontSize(24).text('Seesby SEO Report', 20, 40);
    }
  } else {
    pdf.setFontSize(24).text('Seesby SEO Report', 20, 40);
  }

  pdf.setFontSize(16).text(data.siteName, 20, 60);
  pdf.setFontSize(12).text(`Crawl Date: ${data.crawlDate}`, 20, 72);
  pdf.setFontSize(48).text(String(data.healthScore), 85, 130);
  pdf.setFontSize(14).text('Health Score / 100', 75, 142);

  pdf.addPage();
  pdf.setFontSize(18).text('Issue Summary', 20, 30);
  let y = 45;
  for (const issue of data.issueBreakdown.slice(0, 20)) {
    pdf.setFontSize(10).text(`${issue.type.toUpperCase()} | ${issue.label} — ${issue.count} pages`, 20, y);
    y += 7;
  }

  pdf.addPage();
  pdf.setFontSize(18).text('Recommendations', 20, 30);
  y = 45;
  for (const recommendation of data.recommendations) {
    pdf.setFontSize(10).text(`- ${recommendation}`, 20, y);
    y += 7;
  }

  return pdf.output('blob');
}
