import React from 'react';
import { LogOut, ShieldCheck, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Candidate } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAdmin: boolean;
  candidate: Candidate | null;
  onLogout: () => void;
  onDownloadHtml?: () => void;
  onOpenCsvUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isAdmin,
  candidate,
  onLogout
}) => {
  const scrollToSection = (id: string) => {
    if (currentView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform duration-200">
            <span className="font-extrabold text-white text-xl font-['Poppins']">
              A
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-['Poppins']">
                Atheeg<span className="text-blue-600">Test</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Precision Online Assessments &amp; Proctoring
            </p>
          </div>
        </button>

        {/* Center SaaS Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('assessments')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Assessments
          </button>
          <button
            onClick={() => scrollToSection('integrity')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Security &amp; Integrity
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Navigation state */}
          {isAdmin ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="nav-admin-panel-btn"
                onClick={() => onNavigate('admin-panel')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView.startsWith('admin')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin Suite</span>
              </button>

              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-800">System Admin</span>
                <span className="text-[10px] text-slate-500">madderlachethan@gmail.com</span>
              </div>

              <button
                id="nav-logout-btn"
                onClick={onLogout}
                title="Log out from Admin"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : candidate ? (
            /* Candidate Navigation state */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="nav-candidate-dashboard-btn"
                onClick={() => onNavigate('candidate-dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'candidate-dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>My Dashboard</span>
              </button>

              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900">{candidate.name}</span>
                <span className="text-[10px] text-slate-500">{candidate.email}</span>
              </div>

              <button
                id="nav-candidate-logout-btn"
                onClick={onLogout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Guest Navigation state */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="nav-admin-login-btn"
                onClick={() => onNavigate('admin-login')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2.5 py-2 transition-colors cursor-pointer hidden sm:flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin</span>
              </button>

              <button
                id="nav-candidate-auth-btn"
                onClick={() => onNavigate('candidate-auth')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer"
              >
                Sign In
              </button>

              {/* Primary "Get Started" CTA */}
              <button
                id="nav-get-started-btn"
                onClick={() => onNavigate('candidate-auth')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
