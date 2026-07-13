import React, { useEffect, useMemo, useState } from 'react';

type TourStep = {
  target: string;
  title: string;
  content: string;
};

const TOUR_STEPS: TourStep[] = [
  { target: '.crawler-url-input', title: 'Start Here', content: 'Enter your website URL to begin a crawl.' },
  { target: '.category-tree', title: 'Filter Categories', content: 'Use category filters to narrow to issue groups and page types.' },
  { target: '.audit-sidebar', title: 'Audit Panel', content: 'Review health score, issue counts, and AI opportunities here.' },
  { target: '.mode-selector', title: 'Audit Modes', content: 'Switch between audit modes and industry presets.' },
  { target: '.ai-tab', title: 'AI Analysis', content: 'Run AI analysis to generate page summaries and fix suggestions.' },
];

const TOUR_KEY = 'seesby:tour-completed';

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const done = window.localStorage.getItem(TOUR_KEY);
    if (!done) setOpen(true);
  }, []);

  const step = TOUR_STEPS[index];
  const rect = useMemo(() => {
    if (!open) return null;
    const target = document.querySelector(step.target) as HTMLElement | null;
    return target?.getBoundingClientRect() || null;
  }, [open, step]);

  if (!open) return null;

  const isLast = index === TOUR_STEPS.length - 1;
  const top = rect ? Math.min(window.innerHeight - 190, rect.bottom + 12) : Math.max(80, window.innerHeight / 2 - 80);
  const left = rect ? Math.min(window.innerWidth - 360, Math.max(16, rect.left)) : Math.max(16, window.innerWidth / 2 - 180);

  const finish = () => {
    window.localStorage.setItem(TOUR_KEY, '1');
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute w-[340px] rounded-xl border border-[#2f2f35] bg-[#121216] p-4 shadow-2xl" style={{ top, left }}>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#777]">Onboarding</div>
        <div className="text-[15px] font-bold text-white">{step.title}</div>
        <p className="mt-2 text-[12px] text-[#b8b8be]">{step.content}</p>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={finish} className="text-[11px] text-[#888] hover:text-white">Skip</button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#666]">{index + 1}/{TOUR_STEPS.length}</span>
            <button
              onClick={() => {
                if (isLast) {
                  finish();
                } else {
                  setIndex((prev) => prev + 1);
                }
              }}
              className="rounded bg-[#F59E0B] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#dd2e44]"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
