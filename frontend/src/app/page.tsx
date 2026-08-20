'use client';

import React from 'react';

export default function RootPage() {
  React.useEffect(() => {
    const token = sessionStorage.getItem('pharmalaunch_token');
    if (token) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-semibold tracking-widest uppercase text-slate-400">Loading PharmaLaunch PRO...</p>
    </div>
  );
}
