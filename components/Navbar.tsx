import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { BeeMark } from './BeeMark';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  if (location.pathname.startsWith('/dashboard')) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 h-[76px] flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <BeeMark size={32} className="transition-transform group-hover:scale-105" />
          <span className="font-heading font-extrabold text-xl text-gray-900 tracking-wider uppercase">Seesby</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-wide">
            <Link to="/" className="hover:text-brand-amber transition-colors">Home</Link>
            <Link to="/agency" className="hover:text-brand-amber transition-colors">Agency</Link>
            <Link to="/pricing" className="hover:text-brand-amber transition-colors">SaaS Pricing</Link>
            <Link to="/dashboard" className="hover:text-brand-amber transition-colors">Platform</Link>
            <Link to="/board" className="hover:text-brand-amber transition-colors">Investors</Link>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <Link to="/auth" className="text-sm font-bold text-gray-500 hover:text-brand-amber uppercase tracking-wide">Log in</Link>
          <Link to="/auth?mode=signup">
            <Button size="sm" variant="amber">Start Free Trial</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-[76px] left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-4 md:hidden shadow-lg animate-in slide-in-from-top-5">
          <Link to="/" className="text-gray-600 font-bold uppercase tracking-wide py-2">Home</Link>
          <Link to="/agency" className="text-gray-600 font-bold uppercase tracking-wide py-2">Agency Services</Link>
          <Link to="/pricing" className="text-gray-600 font-bold uppercase tracking-wide py-2">SaaS Pricing</Link>
          <Link to="/dashboard" className="text-gray-600 font-bold uppercase tracking-wide py-2">Platform Demo</Link>
          <Link to="/board" className="text-gray-600 font-bold uppercase tracking-wide py-2">Investor Board</Link>
          <div className="flex flex-col gap-3 mt-4">
            <Link to="/auth" className="text-center py-3 text-gray-600 font-bold uppercase tracking-wide border-b border-gray-100">Log in</Link>
            <Link to="/auth?mode=signup">
              <Button className="w-full" variant="amber">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};