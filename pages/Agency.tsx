import React from 'react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Check, Star, TrendingUp, Users, Target } from 'lucide-react';

const Agency: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F3F5F7] font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-[#080808] text-white py-24 relative overflow-hidden">
        {/* Abstract Red Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1BB6A8] opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
           <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-tight">
             Expert SEO Services
           </h1>
           <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
             We work with your team using our smart software to help you grow.
           </p>
           <Button size="lg" variant="red" className="shadow-float">Book Your Strategy Call</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">
         <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-[#F59E0B] uppercase tracking-widest mb-2">Our Plans</h2>
            <h3 className="text-3xl font-heading font-bold text-gray-900">Agency Service Tiers</h3>
         </div>

         <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
               tier="Growth Plan"
               priceRange="$3,500 - $5,500"
               target="Small Teams"
               desc="Best for teams needing a plan and some help."
               features={[
                   "Quarterly SEO strategy",
                   "Competitor analysis",
                   "AI content outlines",
                   "Link building ideas",
                   "Brand mention tracking",
                   "Monthly report"
               ]}
            />
            <PricingCard 
               tier="Scale Plan"
               priceRange="$6,500 - $12,000"
               highlight
               target="Growing Brands"
               desc="We help you write content and fix technical issues."
               features={[
                   "Everything in Growth",
                   "Content writing (High quality)",
                   "Technical site fixes",
                   "International SEO setup",
                   "Custom AI strategy",
                   "Priority support"
               ]}
            />
            <PricingCard 
               tier="Enterprise Plan"
               priceRange="$15,000+"
               target="Large Companies"
               desc="Full partnership. We handle everything."
               features={[
                   "Custom Dashboards",
                   "Full campaign management",
                   "Direct access to our team",
                   "High volume content production",
                   "Quarterly reviews",
                   "Custom integrations"
               ]}
            />
         </div>

         {/* Unit Economics Teaser (Optional for Investor view, but good for trust) */}
         <div className="mt-20 border-t border-gray-200 pt-16">
             <div className="grid md:grid-cols-3 gap-8 text-center">
                 <div>
                     <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F59E0B]">
                         <TrendingUp size={24} />
                     </div>
                     <h4 className="font-bold text-gray-900">Fair Pricing</h4>
                     <p className="text-sm text-gray-500 mt-2">We use AI to keep costs down, so your budget goes to results.</p>
                 </div>
                 <div>
                     <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F59E0B]">
                         <Users size={24} />
                     </div>
                     <h4 className="font-bold text-gray-900">Dedicated Manager</h4>
                     <p className="text-sm text-gray-500 mt-2">You get a real person to talk to who knows your business.</p>
                 </div>
                 <div>
                     <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F59E0B]">
                         <Target size={24} />
                     </div>
                     <h4 className="font-bold text-gray-900">Brand Focus</h4>
                     <p className="text-sm text-gray-500 mt-2">We help build your brand reputation, not just keyword rankings.</p>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

const PricingCard = ({ tier, priceRange, desc, features, highlight, target }: { tier: string, priceRange: string, desc: string, features: string[], highlight?: boolean, target: string }) => (
    <Card className={`flex flex-col h-full border transition-all duration-300 ${highlight ? 'border-[#F59E0B] shadow-float scale-105 z-10' : 'border-gray-200 hover:border-gray-300'}`}>
        {highlight && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F59E0B] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
                <Star size={12} fill="white" /> Most Popular
            </div>
        )}
        <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{tier}</h3>
            <p className="text-xs font-bold text-[#F59E0B] mt-1 uppercase tracking-wider">{target}</p>
            <div className="flex items-baseline gap-1 mt-4">
                <span className={`text-2xl font-light ${highlight ? 'text-[#F59E0B]' : 'text-gray-900'}`}>{priceRange}</span>
                <span className="text-gray-400 text-sm">/mo</span>
            </div>
            <p className="text-sm text-gray-500 mt-4 leading-relaxed">{desc}</p>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
            {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                    <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-red-50 text-[#F59E0B]' : 'bg-gray-100 text-gray-500'}`}>
                        <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-600">{f}</span>
                </li>
            ))}
        </ul>
        <Button variant={highlight ? 'red' : 'secondary'} className="w-full uppercase tracking-widest text-xs font-bold">Inquire Now</Button>
    </Card>
);

export default Agency;