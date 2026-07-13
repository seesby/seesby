import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, getMetric,
} from '../../shared';

export default function A11yTab({ page }: { page: any }) {
  const totalImages = Number(page?.imageCount || page?.images?.length || 0);
  const imagesWithAlt = Number(page?.imagesWithAlt || 0);
  const imagesWithoutAlt = Number(page?.imagesWithoutAlt || page?.missingAltCount || 0);
  const altCoverage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 0;

  const totalInputs = Number(page?.formInputCount || 0);
  const inputsWithLabels = Number(page?.formInputsWithLabels || 0);
  const inputsWithoutLabels = Number(page?.formsWithoutLabels || 0);
  const labelCoverage = totalInputs > 0 ? Math.round((inputsWithLabels / totalInputs) * 100) : 0;

  const headingStructure = [
    { level: 'H1', count: Number(page?.h1Count || (page?.h1_1 ? 1 : 0)) },
    { level: 'H2', count: Number(page?.h2Count || 0) },
    { level: 'H3', count: Number(page?.h3Count || 0) },
    { level: 'H4', count: Number(page?.h4Count || 0) },
    { level: 'H5', count: Number(page?.h5Count || 0) },
    { level: 'H6', count: Number(page?.h6Count || 0) },
  ];
  const hasH1 = headingStructure[0].count >= 1;
  const multipleH1 = headingStructure[0].count > 1;
  const incorrectOrder = page?.incorrectHeadingOrder || false;

  const ariaLandmarks = Number(page?.ariaLandmarkCount || 0);
  const ariaRoles = Number(page?.ariaRoleCount || 0);
  const ariaLabels = Number(page?.ariaLabelCount || 0);

  const hasSkipLink = page?.hasSkipLink || false;
  const hasMainLandmark = page?.hasMainLandmark || false;
  const hasLang = page?.hasLangAttribute || !!page?.lang;
  const smallTapTargets = Number(page?.smallTapTargets || 0);
  const colorContrastIssues = Number(page?.colorContrastIssues || page?.contrastIssues || 0);

  const a11yScore = Number(getMetric(page, 'accessibilityScore') || 0);

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Score" value={a11yScore ? `${a11yScore}` : '—'} good={a11yScore >= 80} />
        <MetricPill label="Alt Coverage" value={`${altCoverage}%`} good={altCoverage >= 90} />
        <MetricPill label="Label Coverage" value={`${labelCoverage}%`} good={labelCoverage >= 90} />
        <MetricPill label="Contrast" value={formatNumber(colorContrastIssues)} good={colorContrastIssues === 0} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Image alt text */}
        <Card title="Image alt text">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <MetricPill label="Total" value={formatNumber(totalImages)} />
            <MetricPill label="With alt" value={formatNumber(imagesWithAlt)} good={imagesWithoutAlt === 0} />
            <MetricPill label="Missing" value={formatNumber(imagesWithoutAlt)} good={imagesWithoutAlt === 0} />
          </div>
          <DataRow label="Alt coverage" value={`${altCoverage}%`} status={altCoverage >= 90 ? 'pass' : altCoverage >= 70 ? 'warn' : 'fail'} />
          <DataRow label="Empty alt text" value={formatNumber(page?.emptyAltCount)} status={Number(page?.emptyAltCount || 0) > 0 ? 'warn' : 'pass'} />
        </Card>

        {/* Form labels */}
        <Card title="Form labels">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <MetricPill label="Inputs" value={formatNumber(totalInputs)} />
            <MetricPill label="Labeled" value={formatNumber(inputsWithLabels)} good={inputsWithoutLabels === 0} />
            <MetricPill label="Unlabeled" value={formatNumber(inputsWithoutLabels)} good={inputsWithoutLabels === 0} />
          </div>
          <DataRow label="Label coverage" value={`${labelCoverage}%`} status={labelCoverage >= 90 ? 'pass' : labelCoverage >= 70 ? 'warn' : 'fail'} />
        </Card>
      </div>

      {/* Heading hierarchy */}
      <Card title="Heading hierarchy">
        <div className="flex items-end gap-4 mb-3">
          {headingStructure.map((h) => (
            <div key={h.level} className="text-center">
              <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest mb-1">{h.level}</div>
              <div
                className="text-[18px] font-bold"
                style={{ color: h.count === 0 ? 'bg-[var(--brand-surface-4)]' : h.level === 'H1' && h.count > 1 ? '#f59e0b' : 'text-[var(--brand-text-mid)]' }}
              >
                {h.count}
              </div>
            </div>
          ))}
        </div>
        <DataRow label="H1 count" value={formatNumber(headingStructure[0].count)} status={hasH1 && !multipleH1 ? 'pass' : multipleH1 ? 'warn' : 'fail'} />
        <DataRow label="Heading order" value={incorrectOrder ? 'Incorrect' : 'Correct'} status={incorrectOrder ? 'warn' : 'pass'} />
        <DataRow label="H1 text" value={page?.h1_1 || '—'} />
        <DataRow label="Empty headings" value={formatNumber(page?.emptyHeadingCount)} status={Number(page?.emptyHeadingCount || 0) > 0 ? 'warn' : 'pass'} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {/* ARIA */}
        <Card title="ARIA & landmarks">
          <DataRow label="ARIA landmarks" value={formatNumber(ariaLandmarks)} />
          <DataRow label="ARIA roles" value={formatNumber(ariaRoles)} />
          <DataRow label="ARIA labels" value={formatNumber(ariaLabels)} />
          <DataRow label="Main landmark" value={hasMainLandmark ? 'Yes' : 'No'} status={hasMainLandmark ? 'pass' : 'warn'} />
        </Card>

        {/* Navigation */}
        <Card title="Navigation & touch">
          <DataRow label="Skip navigation" value={hasSkipLink ? 'Yes' : 'No'} status={hasSkipLink ? 'pass' : 'warn'} />
          <DataRow label="Language attribute" value={hasLang ? `Yes (${page?.lang || page?.langAttribute})` : 'No'} status={hasLang ? 'pass' : 'warn'} />
          <DataRow label="Small tap targets" value={formatNumber(smallTapTargets)} status={smallTapTargets > 0 ? 'warn' : 'pass'} />
          <DataRow label="Color contrast" value={formatNumber(colorContrastIssues)} status={colorContrastIssues > 0 ? 'fail' : 'pass'} />
        </Card>
      </div>
    </div>
  );
}
