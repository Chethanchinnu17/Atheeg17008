import React from 'react';

interface NotFoundProps {
  onNavigate: (view: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onNavigate }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you’re looking for is unavailable or has moved.
      </p>
      <button
        type="button"
        onClick={() => onNavigate('landing')}
        className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
      >
        Return home
      </button>
    </div>
  </div>
);
