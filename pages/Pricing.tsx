import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Check, ShoppingBag, MapPin, Building2, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { startBillingCheckout } from '../services/BillingService';

type Industry = 'ecommerce' | 'local' | 'saas' | 'elearning';

const Pricing: React.FC = () => {
    const { user, getToken } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Industry>('ecommerce');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleCheckout = async (tierName: string, priceId: string) => {
        if (!user) {
            navigate('/auth?mode=signup');
            return;
        }

        setIsProcessing(tierName);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Your session is missing a valid Clerk token. Please sign in again.');
            }
            const result = await startBillingCheckout({
                tierName,
                priceId,
                user,
                token
            });
            window.location.href = result.url;
        } catch (error: any) {
            console.error("Checkout error:", error);
            alert(`Error starting checkout: ${error.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F5F7] font-sans">
            <Navbar />

            {/* Hero */}
            <div className="bg-[#080808] text-white py-20 text-center">
                <h1 className="text-4xl font-heading font-bold mb-4">Platform Pricing</h1>
                <p className="text-gray-400 max-w-xl mx-auto text-lg">
                    Tools built for your specific business type.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 -mt-10 relative z-10">

                {/* Industry Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    <IndustryTab
                        active={activeTab === 'ecommerce'}
                        onClick={() => setActiveTab('ecommerce')}
                        icon={<ShoppingBag size={18} />}
                        label="Online Stores"
                    />
                    <IndustryTab
                        active={activeTab === 'local'}
                        onClick={() => setActiveTab('local')}
                        icon={<MapPin size={18} />}
                        label="Local Business"
                    />
                    <IndustryTab
                        active={activeTab === 'saas'}
                        onClick={() => setActiveTab('saas')}
                        icon={<Building2 size={18} />}
                        label="Software / B2B"
                    />
                    <IndustryTab
                        active={activeTab === 'elearning'}
                        onClick={() => setActiveTab('elearning')}
                        icon={<GraduationCap size={18} />}
                        label="Education"
                    />
                </div>

                {/* Pricing Grids */}
                {activeTab === 'ecommerce' && (
                    <PricingGrid
                        tiers={[
                            {
                                name: "Starter", price: "$99", limit: "1 site, 5 keywords", priceId: "price_ecommerce_starter",
                                features: ["Track your rankings", "Basic competitor check", "Page improvement tips", "Site speed check"]
                            },
                            {
                                name: "Professional", price: "$299", limit: "5 sites, 50 keywords", highlight: true, priceId: "price_ecommerce_pro",
                                features: ["Smart keyword tool", "Product page optimizer", "Shopping results tracking", "Brand mention alerts", "Technical site audit"]
                            },
                            {
                                name: "Business", price: "$799", limit: "Unlimited sites, 500 keywords", priceId: "price_ecommerce_biz",
                                features: ["AI strategy generator", "Sales improvement tips", "International setup", "Automated rules", "Custom reports"]
                            }
                        ]}
                        onCheckout={handleCheckout}
                        isProcessing={isProcessing}
                    />
                )}

                {activeTab === 'local' && (
                    <PricingGrid
                        tiers={[
                            {
                                name: "Starter", price: "$79", limit: "1 location, 10 keywords", priceId: "price_local_starter",
                                features: ["Local ranking tracker", "Google Business tools", "Local listing check", "Review monitoring", "Monthly report"]
                            },
                            {
                                name: "Professional", price: "$249", limit: "3 locations, 30 keywords", highlight: true, priceId: "price_local_pro",
                                features: ["Service page optimizer", "Local link ideas", "Get more reviews tool", "AI chat for customers", "Multi-location tracking"]
                            },
                            {
                                name: "Enterprise", price: "$699", limit: "Unlimited locations", priceId: "price_local_ent",
                                features: ["White-label dashboard", "Custom AI model", "Reputation manager", "Event promotion tools", "Booking integration"]
                            }
                        ]}
                        onCheckout={handleCheckout}
                        isProcessing={isProcessing}
                    />
                )}

                {activeTab === 'saas' && (
                    <PricingGrid
                        tiers={[
                            {
                                name: "Starter", price: "$149", limit: "1 website, 10 keywords", priceId: "price_saas_starter",
                                features: ["Technical site audit", "Find missing content topics", "AI blog outlines", "Backlink ideas", "Traffic predictor"]
                            },
                            {
                                name: "Professional", price: "$449", limit: "1 website, 50 keywords", highlight: true, priceId: "price_saas_pro",
                                features: ["AI content strategy", "High-value keywords", "HubSpot integration", "Competitor insights", "AI pitch deck helper"]
                            },
                            {
                                name: "Enterprise", price: "$1,299", limit: "Unlimited keywords", priceId: "price_saas_ent",
                                features: ["Sales tracking", "Sales content helper", "Salesforce integration", "Custom AI model", "API access"]
                            }
                        ]}
                        onCheckout={handleCheckout}
                        isProcessing={isProcessing}
                    />
                )}

                {activeTab === 'elearning' && (
                    <PricingGrid
                        tiers={[
                            {
                                name: "Starter", price: "$119", limit: "5 course keywords", priceId: "price_elearning_starter",
                                features: ["Course page SEO", "Student search analysis", "Content ideas", "Competitor check"]
                            },
                            {
                                name: "Professional", price: "$359", limit: "25 course keywords", highlight: true, priceId: "price_elearning_pro",
                                features: ["Curriculum strategy", "AI course descriptions", "Student review analysis", "Enrollment predictor"]
                            },
                            {
                                name: "Enterprise", price: "$999", limit: "Unlimited courses", priceId: "price_elearning_ent",
                                features: ["Full platform strategy", "Custom AI recommendations", "Instructor content tools", "Certification SEO", "Partner dashboard"]
                            }
                        ]}
                        onCheckout={handleCheckout}
                        isProcessing={isProcessing}
                    />
                )}

            </div>
        </div>
    );
};

const IndustryTab = ({ active, onClick, label, icon }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all duration-200 border ${active
            ? 'bg-white text-[#F59E0B] shadow-lg border-transparent scale-105'
            : 'bg-[#111] text-gray-500 border-[#222] hover:bg-[#1A1A1A] hover:text-white'
            }`}
    >
        {icon}
        {label}
    </button>
);

const PricingGrid = ({ tiers, onCheckout, isProcessing }: { tiers: any[], onCheckout: (tierName: string, priceId: string) => void, isProcessing: string | null }) => (
    <div className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {tiers.map((tier, i) => (
            <Card key={i} className={`flex flex-col h-full border transition-all duration-300 bg-white ${tier.highlight ? 'border-[#F59E0B] shadow-float ring-1 ring-[#F59E0B]/20' : 'border-gray-200 hover:border-gray-300'}`}>
                {tier.highlight && (
                    <div className="absolute top-0 right-0 bg-[#F59E0B] text-white px-3 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wide">
                        Recommended
                    </div>
                )}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mt-4">
                        <span className={`text-4xl font-extrabold ${tier.highlight ? 'text-[#F59E0B]' : 'text-gray-900'}`}>{tier.price}</span>
                        <span className="text-gray-400 text-sm">/mo</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-2 bg-gray-100 inline-block px-2 py-1 rounded">{tier.limit}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                    {tier.features.map((f: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                            <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${tier.highlight ? 'bg-red-50 text-[#F59E0B]' : 'bg-gray-100 text-gray-500'}`}>
                                <Check size={10} strokeWidth={3} />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">{f}</span>
                        </li>
                    ))}
                </ul>
                <Button
                    variant={tier.highlight ? 'red' : 'secondary'}
                    className="w-full uppercase tracking-widest text-xs font-bold disabled:opacity-50"
                    onClick={() => onCheckout(tier.name, tier.priceId)}
                    disabled={isProcessing === tier.name}
                >
                    {isProcessing === tier.name ? 'Processing...' : 'Start Free Trial'}
                </Button>
            </Card>
        ))}
    </div>
);

export default Pricing;
