import React, { useState } from 'react';
import { Sparkles, Check, ChevronRight, BarChart2, Target, AlertCircle } from 'lucide-react';
import { generateContentPrediction } from '../../services/AppIntelligenceService';

export const ContentPredictorView = () => {
    const [topic, setTopic] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePredict = async () => {
        if (!topic) return;
        setIsPredicting(true);
        setError(null);
        setResult(null);

        try {
            const data = await generateContentPrediction(topic);
            setResult(data);
        } catch (err: any) {
            console.error("Prediction error:", err);
            setError(err.message || 'Failed to generate prediction.');
        } finally {
            setIsPredicting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto">
                {/* Header / Input Area */}
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-purple/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                        <Sparkles size={32} className="text-brand-purple" />
                    </div>
                    <h2 className="text-3xl font-bold font-heading text-white mb-4">AI Content Predictor</h2>
                    <p className="text-[var(--brand-text-mid)] text-lg mb-8 max-w-2xl mx-auto">
                        Predict the ranking potential of your content before you write it. Our model analyzes top 10 results, keyword usage, and site authority gaps.
                    </p>

                    <div className="bg-[var(--brand-surface-1)]] border border-[var(--brand-border-2)] rounded-2xl p-2 flex items-center shadow-2xl max-w-3xl mx-auto">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePredict()}
                            placeholder="Enter a topic or keyword (e.g., 'Best AI SEO Tools')"
                            className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-600"
                        />
                        <button
                            onClick={handlePredict}
                            disabled={isPredicting || !topic}
                            className="bg-brand-purple hover:bg-purple-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-50"
                        >
                            {isPredicting ? 'Predicting...' : 'Predict Success'}
                        </button>
                    </div>

                    <div className="mt-8 flex justify-center gap-8 text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Check size={14} className="text-brand-purple" /> Topic Analysis</span>
                        <span className="flex items-center gap-2"><Check size={14} className="text-brand-purple" /> Ranking Difficulty</span>
                        <span className="flex items-center gap-2"><Check size={14} className="text-brand-purple" /> User Goal Match</span>
                    </div>

                    {error && (
                        <div className="mt-6 text-red-500 text-sm bg-red-500/10 inline-block px-4 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}
                </div>

                {/* Results Area */}
                {result && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="col-span-1 bg-[var(--brand-surface-2)]] p-6 rounded-2xl border border-[var(--brand-border-1)] text-center flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple via-pink-500 to-brand-amber"></div>
                                <span className="text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-widest mb-2">Predictive Score</span>
                                <div className="text-6xl font-black text-white font-heading">{result.score}</div>
                                <span className="text-xs text-brand-purple font-bold mt-2">Highly Likely to Rank</span>
                            </div>

                            <div className="col-span-3 grid grid-cols-3 gap-4">
                                <div className="bg-[var(--brand-surface-2)]] p-5 rounded-2xl border border-[var(--brand-border-1)]">
                                    <Target size={18} className="text-[var(--brand-text-mid)] mb-3" />
                                    <span className="block text-xs font-bold text-[var(--brand-text-faint)] uppercase">Search Intent</span>
                                    <span className="block text-lg font-bold text-white mt-1">{result.intent}</span>
                                </div>
                                <div className="bg-[var(--brand-surface-2)]] p-5 rounded-2xl border border-[var(--brand-border-1)]">
                                    <BarChart2 size={18} className="text-[var(--brand-text-mid)] mb-3" />
                                    <span className="block text-xs font-bold text-[var(--brand-text-faint)] uppercase">Search Volume</span>
                                    <span className="block text-lg font-bold text-white mt-1">{result.volume.toLocaleString()} /mo</span>
                                </div>
                                <div className="bg-[var(--brand-surface-2)]] p-5 rounded-2xl border border-[var(--brand-border-1)]">
                                    <AlertCircle size={18} className="text-[var(--brand-text-mid)] mb-3" />
                                    <span className="block text-xs font-bold text-[var(--brand-text-faint)] uppercase">Difficulty</span>
                                    <span className="block text-lg font-bold text-white mt-1">{result.difficulty} / 100</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[var(--brand-surface-1)]] rounded-2xl border border-[var(--brand-border-1)] p-6 space-y-4">
                                <h3 className="text-lg font-bold text-white font-heading">AI Content Outline</h3>
                                <div className="space-y-4">
                                    {result.outline?.map((section: any, idx: number) => (
                                        <div key={idx} className="bg-[var(--brand-surface-2)]] p-4 rounded-xl border border-[var(--brand-border-1)]">
                                            <h4 className="text-sm font-bold text-brand-purple mb-2">H2: {section.h2}</h4>
                                            <ul className="space-y-1">
                                                {section.subtopics?.map((sub: string, i: number) => (
                                                    <li key={i} className="text-xs text-[var(--brand-text-mid)] flex items-center gap-2">
                                                        <ChevronRight size={12} className="text-[var(--brand-text-muted)]" /> {sub}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[var(--brand-surface-1)]] rounded-2xl border border-[var(--brand-border-1)] p-6 space-y-4 h-fit">
                                <h3 className="text-lg font-bold text-white font-heading">Strategic Recommendations</h3>
                                <ul className="space-y-3">
                                    {result.recommendations?.map((rec: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 bg-[var(--brand-surface-3)] p-3 rounded-xl border border-[var(--brand-border-1)]">
                                            <Check size={16} className="text-brand-green shrink-0 mt-0.5" />
                                            <span className="text-sm text-[var(--brand-text-mid)] leading-relaxed">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
