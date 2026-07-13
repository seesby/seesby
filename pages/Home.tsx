import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Check, Layers, Shield, Zap, Search, Globe, TrendingUp, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-[#F3F5F7] font-sans selection:bg-red-100 selection:text-red-900">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

                    <div className={`transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-brand-amber text-xs font-bold uppercase tracking-widest mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-amber"></span>
                            </span>
                            Start growing your traffic today
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-heading font-extrabold text-gray-900 tracking-tight leading-none mb-8">
                            Automate your SEO.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-amber to-orange-500">Outsmart your competitors.</span>
                        </h1>

                        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
                            Get simple, step-by-step AI advice on how to improve your Google rankings. We track your progress and alert you when competitors make a move.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/auth?mode=signup">
                                <Button size="lg" variant="red" className="h-14 px-10 text-sm shadow-float hover:scale-105 transition-transform flex items-center gap-2">
                                    Start Your Free Trial <span className="ml-1 opacity-70">➔</span>
                                </Button>
                            </Link>
                            <Link to="/agency">
                                <Button size="lg" variant="outline" className="h-14 px-10 text-sm border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 flex items-center gap-2">
                                    <PlayCircle size={18} /> See How It Works
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Check size={14} className="text-brand-amber" /> No credit card required</span>
                            <span className="flex items-center gap-2"><Check size={14} className="text-brand-amber" /> Cancel anytime</span>
                            <span className="flex items-center gap-2"><Check size={14} className="text-brand-amber" /> Setup in 2 minutes</span>
                        </div>
                    </div>

                    {/* Dashboard Mockup Abstract */}
                    <div className={`mt-20 relative transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 max-w-5xl mx-auto">
                            <div className="bg-[#080808] rounded-xl overflow-hidden aspect-[16/9] relative border border-gray-800">
                                {/* Fake UI */}
                                <div className="absolute inset-0 flex">
                                    {/* Sidebar */}
                                    <div className="w-64 border-r border-white/10 p-4 hidden md:block">
                                        <div className="h-8 w-8 bg-[#F59E0B] rounded-lg mb-8"></div>
                                        <div className="space-y-4">
                                            <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                                            <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                                            <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                                        </div>
                                    </div>
                                    {/* Main */}
                                    <div className="flex-1 p-8">
                                        <div className="flex justify-between mb-8">
                                            <div className="h-8 w-48 bg-white/10 rounded"></div>
                                            <div className="h-8 w-8 rounded-full border border-white/20"></div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-6 mb-8">
                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl h-24"></div>
                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl h-24"></div>
                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl h-24"></div>
                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl h-24"></div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="bg-white/5 border border-white/10 rounded-xl h-64 flex-[2]"></div>
                                            <div className="bg-white/5 border border-white/10 rounded-xl h-64 flex-1"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Demand Drivers Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-brand-amber font-bold uppercase tracking-widest text-xs mb-2">Built For You</h2>
                        <h3 className="text-3xl font-heading font-bold text-gray-900">SEO doesn't have to be complicated</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-10">
                        <InfoBlock
                            title="Understand Your Traffic"
                            stat="1."
                            desc="We connect directly to Google Search Console to show you exactly how people are finding your site."
                        />
                        <InfoBlock
                            title="Get AI Advice"
                            stat="2."
                            desc="Don't know what to do next? Our AI will tell you exactly which pages to fix and what to write next to get more visitors."
                        />
                        <InfoBlock
                            title="Watch Competitors"
                            stat="3."
                            desc="We keep an eye on your top competitors so you know exactly when they change their website or start ranking higher."
                        />
                    </div>
                </div>
            </section>

            {/* Differentiators Grid */}
            <section className="py-24 bg-[#080808] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-[#F59E0B] font-bold uppercase tracking-widest text-xs mb-2">Features</h2>
                        <h3 className="text-3xl font-heading font-bold text-white">Everything you need to grow</h3>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            title="Daily Rank Tracking"
                            desc="Wake up every day to see exactly where your website ranks on Google for the keywords you care about."
                            icon={<Zap className="text-[#F59E0B]" size={24} />}
                        />
                        <FeatureCard
                            title="Actionable AI Tips"
                            desc="No more guessing. We give you a simple checklist of what you need to do to beat the other websites."
                            icon={<Search className="text-[#F59E0B]" size={24} />}
                        />
                        <FeatureCard
                            title="Beautiful Reports"
                            desc="See your progress in simple, easy-to-read charts that make sense, without any of the confusing tech talk."
                            icon={<Layers className="text-[#F59E0B]" size={24} />}
                        />
                        <FeatureCard
                            title="Competitor Spy"
                            desc="We alert you when competing businesses start ranking higher, so you can adjust your strategy quickly."
                            icon={<Globe className="text-[#F59E0B]" size={24} />}
                        />
                        <FeatureCard
                            title="Brand Alerts"
                            desc="We'll send you an email when someone mentions your brand name out on the internet."
                            icon={<Shield className="text-[#F59E0B]" size={24} />}
                        />
                        <FeatureCard
                            title="Automated Audits"
                            desc="We automatically check your website for broken links, slow pages, and other issues that hurt your rankings."
                            icon={<TrendingUp className="text-[#F59E0B]" size={24} />}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="mb-6 flex justify-center items-center gap-2">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-gray-900">
                            <circle cx="9" cy="16" r="5" fill="currentColor" />
                            <path d="M17 11H27" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M17 16H31" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M17 21H27" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                        <span className="font-heading font-extrabold text-xl text-gray-900 tracking-wider uppercase">Seesby</span>
                    </div>

                    <div className="flex justify-center items-center gap-6 mb-6">
                        <Link to="/crawler" className="text-sm text-gray-600 hover:text-brand-amber font-semibold transition-colors">
                            Seesby Scanner
                        </Link>
                    </div>

                    <p className="text-sm text-gray-500 mb-8">© 2026 Seesby Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

const InfoBlock = ({ title, stat, desc }: any) => (
    <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
        <div className="text-4xl font-extrabold text-brand-amber mb-4">{stat}</div>
        <div className="text-lg font-bold text-gray-900 mb-3">{title}</div>
        <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
);

const FeatureCard = ({ title, desc, icon }: any) => (
    <div className="bg-[#111] p-8 rounded-2xl border border-[#222] hover:border-[#F59E0B] transition-colors group">
        <div className="w-12 h-12 bg-[#1A1A1A] rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#F59E0B]/10 transition-colors">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-3 font-heading">{title}</h3>
        <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
    </div>
);

export default Home;