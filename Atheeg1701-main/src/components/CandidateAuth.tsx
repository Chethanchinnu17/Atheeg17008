import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Lock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Candidate } from '../types';
import { auth } from '../firebase';
import { getCandidates, saveCandidate, setCandidateSession } from '../utils/storage';

interface CandidateAuthProps {
  onNavigate: (view: string) => void;
  onSuccessLogin: (candidate: Candidate) => void;
  initialTab?: 'login' | 'register';
}

export const CandidateAuth: React.FC<CandidateAuthProps> = ({
  onNavigate,
  onSuccessLogin,
  initialTab = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessToast, setRegSuccessToast] = useState('');

  // Handle Candidate Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const existingCandidate = getCandidates().find(c => c.email.toLowerCase() === email);
      const candidate: Candidate = existingCandidate || {
        id: credential.user.uid || `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: credential.user.displayName || email.split('@')[0],
        email,
        phone: credential.user.phoneNumber || '',
        password,
        createdAt: new Date().toISOString()
      };

      if (!existingCandidate) {
        saveCandidate(candidate);
      }

      setCandidateSession(candidate.id);
      onSuccessLogin(candidate);
      return;
    } catch (firebaseError) {
      console.warn('Firebase candidate login failed, falling back to local auth flow.', firebaseError);
    }

    const candidates = getCandidates();
    const candidate = candidates.find(c => c.email.toLowerCase() === email);

    if (!candidate || candidate.password !== password) {
      setLoginError('Invalid email or password');
      return;
    }

    setCandidateSession(candidate.id);
    onSuccessLogin(candidate);
  };

  // Handle Candidate Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessToast('');

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const phone = regPhone.trim();
    const password = regPassword;
    const confirm = regConfirmPassword;

    if (!name) {
      setRegError('Full Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRegError('Please provide a valid email address format.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setRegError('Phone number must be exactly 10 digits.');
      return;
    }

    if (password.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirm) {
      setRegError('Passwords do not match.');
      return;
    }

    if (!regAgreeTerms) {
      setRegError('You must agree to the Terms & Conditions.');
      return;
    }

    const candidates = getCandidates();
    const existing = candidates.find(c => c.email.toLowerCase() === email);
    if (existing) {
      setRegError('Email already registered');
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const newCandidate: Candidate = {
        id: credential.user.uid || `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        email,
        phone: phoneDigits,
        password,
        createdAt: new Date().toISOString()
      };

      saveCandidate(newCandidate);
      setRegSuccessToast('Registration successful! Please log in.');
      setLoginEmail(email);
      setLoginPassword('');
      setActiveTab('login');
      setTimeout(() => setRegSuccessToast(''), 6000);
      return;
    } catch (firebaseError) {
      console.warn('Firebase registration failed, falling back to local registration flow.', firebaseError);
    }

    const newCandidate: Candidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
      phone: phoneDigits,
      password,
      createdAt: new Date().toISOString()
    };

    saveCandidate(newCandidate);
    setRegSuccessToast('Registration successful! Please log in.');
    setLoginEmail(email);
    setLoginPassword('');
    setActiveTab('login');

    setTimeout(() => {
      setRegSuccessToast('');
    }, 6000);
  };

  const fillDemoCandidate = () => {
    setLoginEmail('test@atheeg.com');
    setLoginPassword('test123');
    setLoginError('');
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[130px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          id="auth-back-home-btn"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Success Toast */}
        {regSuccessToast && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-sm animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{regSuccessToast}</span>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-blue-500/5">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600 mb-3 shadow-md shadow-blue-600/20 flex items-center justify-center">
              <span className="font-extrabold text-white text-xl font-['Poppins']">
                A
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-['Poppins']">
              Candidate Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'login' ? 'Sign in to access your assessments' : 'Register for an Atheeg Test candidate account'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl mb-6">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Registration
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="candidate-login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="candidate-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="candidate-login-submit"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer mt-2"
              >
                Log In as Candidate
              </button>

              {/* Demo Account Helper */}
              <div className="pt-3 border-t border-slate-200 text-center">
                <button
                  type="button"
                  onClick={fillDemoCandidate}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  Fill Sample Candidate (<span className="underline">test@atheeg.com</span>)
                </button>
              </div>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="candidate-reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="candidate-reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone (10 Digits) <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="candidate-reg-phone"
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit number"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password (min 6 chars) <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="candidate-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Choose password"
                    className="w-full pl-10 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="candidate-reg-confirm-password"
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              {/* T&C Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="candidate-reg-terms-checkbox"
                  type="checkbox"
                  checked={regAgreeTerms}
                  onChange={(e) => setRegAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="candidate-reg-terms-checkbox" className="text-xs text-slate-600 leading-tight cursor-pointer">
                  I agree to the <span className="text-blue-600 underline">Terms &amp; Conditions</span> and candidate code of conduct.
                </label>
              </div>

              <button
                id="candidate-reg-submit"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer mt-3"
              >
                Complete Registration
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
