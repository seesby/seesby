import React, { useState } from 'react';
import { useProject } from '../../services/ProjectContext';
import { useAuth } from '../../services/AuthContext';
import { Globe, Search, Tag, CheckCircle2, ChevronRight, PlayCircle, Loader2 } from 'lucide-react';
import { IndustryType } from '../../services/app-types';
import { upsertProjectCrawlerIntegration } from '../../services/CrawlerIntegrationsService';
import { addKeywords } from '../../services/DashboardDataService';
import { exchangeGoogleCode, openGoogleOAuthPopup } from '../../services/GoogleOAuthHelper';
import { useNavigate } from 'react-router-dom';

type Step = 1 | 2 | 3;

export const OnboardingWizard = ({ onComplete }: { onComplete?: () => void }) => {
    const { addProject, refreshProjects, projects } = useProject();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Project Details
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [industry, setIndustry] = useState<IndustryType>('ecommerce');
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Step 2: Keywords
    const [keywords, setKeywords] = useState<string[]>(['', '', '']);

    // Step 3: Google Search Console
    const [gscUrl, setGscUrl] = useState('');
    const [gscConnected, setGscConnected] = useState(false);

    const handleCreateProject = async () => {
        if (!name.trim() || !url.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const newProject = await addProject(name, url, industry);
            if (newProject) {
                setCreatedProjectId(newProject.id);
                setStep(2);
            } else {
                setError('Failed to create project. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKeywords = async () => {
        if (!createdProjectId) return;
        setLoading(true);
        const validKeywords = keywords.filter(k => k.trim() !== '');
        if (validKeywords.length > 0) {
            await addKeywords(createdProjectId, validKeywords.map((kw) => kw.trim()));
        }
        setStep(3);
        setLoading(false);
    };

    const handleConnectGSC = async () => {
        if (!gscUrl.trim()) {
            alert('Please enter your GSC Property URL first.');
            return;
        }
        if (!createdProjectId) return;

        try {
            const result = await openGoogleOAuthPopup();
            if (!result) return;

            // New metadata-only exchange: returns { email, expiryDate }
            const meta = await exchangeGoogleCode(result.code, result.redirectUri);
            if (!meta || !meta.email) {
                alert('Failed to verify Google account metadata.');
                return;
            }

            // CRITICAL: We no longer store tokens in the client-side vault or credentials object.
            // Server handles it via Turso.

            await upsertProjectCrawlerIntegration(createdProjectId, {
                provider: 'google',
                label: 'Google Search & Analytics',
                status: 'connected',
                authType: 'oauth',
                ownership: 'project',
                connectedAt: Date.now(),
                accountLabel: meta.email,
                scopes: ['webmasters.readonly', 'analytics.readonly', 'userinfo.email'],
                credentials: {}, // Empty - tokens are on server
                selection: {
                    siteUrl: gscUrl
                },
                metadata: {
                    siteUrl: gscUrl,
                    email: meta.email
                },
                sync: {
                    status: 'idle',
                    lastAttemptedAt: Date.now(),
                    expiryDate: meta.expiryDate
                }
            });
            setGscConnected(true);
            setTimeout(() => finishOnboarding(), 1500);
        } catch (error) {
            console.error('Failed to save onboarding integration', error);
        }
    };

    const finishOnboarding = async () => {
        await refreshProjects();
        // Determine where to land: use the created projectId if available, otherwise fallback to first project
        const targetId = createdProjectId || (projects.length > 0 ? projects[0].id : null);
        if (targetId) {
            navigate(`/project/${targetId}/dashboard`);
        }
        if (onComplete) onComplete();
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-[var(--brand-surface-1)]] rounded-3xl border border-[var(--brand-border-1)] p-10 max-w-xl w-full relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-surface-3)]">
                    <div className="h-full bg-brand-amber transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                <div className="text-center mb-10 mt-4">
                    <div className="w-12 h-12 bg-[var(--brand-surface-3)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--brand-border-2)]">
                        {step === 1 && <Globe className="text-brand-amber" size={24} />}
                        {step === 2 && <Search className="text-brand-amber" size={24} />}
                        {step === 3 && <PlayCircle className="text-brand-amber" size={24} />}
                    </div>
                    <h2 className="text-2xl font-bold font-heading text-white">
                        {step === 1 && "Create Your Project"}
                        {step === 2 && "Add Target Keywords"}
                        {step === 3 && "Connect Search Console"}
                    </h2>
                    <p className="text-sm text-[var(--brand-text-faint)] mt-2">
                        {step === 1 && "Let's set up your first website to track and optimize."}
                        {step === 2 && "What searches do you want to rank for on Google?"}
                        {step === 3 && "Optional: Connect Google to sync real clicks and impressions."}
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-[var(--brand-text-mid)] block mb-2">Project Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Acme Corp"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-amber/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--brand-text-mid)] block mb-2">Website URL</label>
                            <input
                                type="text"
                                placeholder="https://example.com"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-amber/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--brand-text-mid)] block mb-2">Industry</label>
                            <select
                                value={industry}
                                onChange={e => setIndustry(e.target.value as any)}
                                className="w-full bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-amber/50 transition-colors appearance-none"
                            >
                                <option value="ecommerce">E-Commerce</option>
                                <option value="local">Local Service / Home Service</option>
                                <option value="saas">B2B Software (SaaS)</option>
                                <option value="elearning">E-Learning / Publisher</option>
                            </select>
                        </div>
                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        <button
                            onClick={handleCreateProject}
                            disabled={!name.trim() || !url.trim() || loading}
                            className="w-full bg-brand-amber text-white font-bold py-3 rounded-xl hover:bg-brand-amberHover transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : "Next Step"}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        {keywords.map((kw, idx) => (
                            <div key={idx} className="relative">
                                <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-text-faint)]" />
                                <input
                                    type="text"
                                    placeholder={`Keyword ${idx + 1}`}
                                    value={kw}
                                    onChange={e => {
                                        const newKw = [...keywords];
                                        newKw[idx] = e.target.value;
                                        setKeywords(newKw);
                                    }}
                                    className="w-full bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-amber/50 transition-colors"
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => setKeywords([...keywords, ''])}
                            className="text-xs font-bold text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)] transition-colors"
                        >
                            + Add another keyword
                        </button>

                        <div className="pt-4 flex items-center justify-between">
                            <button onClick={() => setStep(3)} className="text-xs text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)]">Skip for now</button>
                            <button
                                onClick={handleSaveKeywords}
                                disabled={loading}
                                className="bg-[var(--brand-surface-3)] text-black font-bold py-2.5 px-6 rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Keywords"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-[var(--brand-surface-2)]] p-5 rounded-xl border border-[var(--brand-border-1)]">
                            <label className="text-xs font-bold text-[var(--brand-text-mid)] block mb-2">GSC Property URL (Exact Match)</label>
                            <input
                                type="text"
                                placeholder="e.g. sc-domain:example.com or https://example.com/"
                                value={gscUrl}
                                onChange={e => setGscUrl(e.target.value)}
                                className="w-full bg-[var(--brand-surface-1)]] border border-[var(--brand-border-2)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-amber font-mono mb-4"
                            />

                            {gscConnected ? (
                                <div className="w-full bg-brand-green/10 text-brand-green border border-brand-green/20 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} /> Connected Successfully
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGSC}
                                    disabled={!gscUrl.trim() || loading}
                                    className="w-full bg-[var(--brand-surface-3)] text-black font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    Login with Google
                                </button>
                            )}
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <button onClick={finishOnboarding} className="text-xs text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)]">Skip for now</button>
                            <button
                                onClick={finishOnboarding}
                                className="bg-brand-amber text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-amberHover transition-colors flex justify-center items-center gap-2"
                            >
                                Finish Setup <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
