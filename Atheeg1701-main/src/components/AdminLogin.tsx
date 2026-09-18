import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ADMIN_CREDENTIALS } from '../data/seedData';
import { auth } from '../firebase';
import { setAdminSession } from '../utils/storage';

interface AdminLoginProps {
  onNavigate: (view: string) => void;
  onSuccessAdminLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onNavigate,
  onSuccessAdminLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const normalizedEmail = email.trim().toLowerCase();
    const enteredPassword = password;

    try {
      const credential = auth ? await signInWithEmailAndPassword(auth, normalizedEmail, enteredPassword) : null;
      const isConfiguredAdmin =
        normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
        enteredPassword === ADMIN_CREDENTIALS.password;
      if (credential?.user.email && isConfiguredAdmin) {
        setAdminSession(true);
        onSuccessAdminLogin();
        return;
      }
    } catch (firebaseError) {
      console.warn('Firebase admin login failed, falling back to local admin credential check.', firebaseError);
    }

    const isAdminMatch =
      normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      enteredPassword === ADMIN_CREDENTIALS.password;

    if (isAdminMatch) {
      setAdminSession(true);
      onSuccessAdminLogin();
    } else {
      setErrorMsg('Invalid admin credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/10 blur-[130px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          id="admin-login-back-btn"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-blue-500/5">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600 mb-3 shadow-md shadow-blue-600/20 flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-['Poppins']">
              System Admin Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Restricted area for authorized platform administrators only
            </p>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            {errorMsg && (
              <div
                id="admin-login-error-alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs animate-shake"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer mt-2"
            >
              Verify &amp; Enter Admin Panel
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
