'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle2, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [orgName, setOrgName] = useState('Novartis Commercial');
  const [fullName, setFullName] = useState('US Commercial Director');
  const [email, setEmail] = useState('us_commercial@pharmalaunch.com');
  const [password, setPassword] = useState('pharma123');
  const [role, setRole] = useState('launch_director');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const endpoint = isSignUp 
      ? 'http://localhost:8000/api/auth/signup' 
      : 'http://localhost:8000/api/auth/signin';

    const payload = isSignUp 
      ? { organization_name: orgName, full_name: fullName, email, password, role }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      sessionStorage.setItem('pharmalaunch_token', data.token);
      sessionStorage.setItem('pharmalaunch_org', data.organization_name);
      sessionStorage.setItem('pharmalaunch_user_email', data.email);
      sessionStorage.setItem('pharmalaunch_user_name', data.full_name || 'User');
      sessionStorage.setItem('pharmalaunch_role', data.role || 'launch_director');

      localStorage.setItem('pharmalaunch_token', data.token);
      localStorage.setItem('pharmalaunch_org', data.organization_name);
      localStorage.setItem('pharmalaunch_user_email', data.email);
      localStorage.setItem('pharmalaunch_user_name', data.full_name || 'User');
      localStorage.setItem('pharmalaunch_role', data.role || 'launch_director');

      setSuccess(isSignUp ? 'Organization account created! Redirecting to Dashboard...' : 'Signed in successfully! Redirecting to Dashboard...');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 py-12 relative select-none">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 right-12 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className={`w-full ${isSignUp ? 'max-w-xl' : 'max-w-md'} bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl shadow-black/60 space-y-5 relative z-10 transition-all duration-200`}>
        
        {/* Top bar with back button */}
        {isSignUp && (
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setSuccess(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-semibold transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[11px] font-medium text-slate-500">Step 1 of 1</span>
          </div>
        )}

        {/* Card Header & Branding */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl mx-auto shadow-lg shadow-blue-500/25 border border-cyan-400/30">
            P
          </div>
          <h1 className="text-lg font-black tracking-tight text-white">
            PharmaLaunch <span className="text-cyan-400 font-extrabold text-[11px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">PRO</span>
          </h1>
          <h2 className="text-sm font-bold text-slate-200">
            {isSignUp ? 'Register Launch Organization' : 'Sign In to Enterprise Workspace'}
          </h2>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            {isSignUp 
              ? 'Create a pharmaceutical organization profile connected to your cloud workspace'
              : 'Access your persistent forecast studio and historical records'
            }
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl text-center font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl text-center font-semibold flex items-center justify-center gap-2 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 
            <span>{success}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp ? (
            <>
              {/* Row 1: Org Name + Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Organization Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Novartis"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Work Email + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Role Assignment
                  </label>
                  <div className="relative">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer transition-colors"
                    >
                      <option value="launch_director">Launch Director (Full)</option>
                      <option value="forecast_analyst">Forecast Analyst</option>
                      <option value="commercial_associate">Commercial Associate</option>
                      <option value="management_viewer">Stakeholder (Viewer)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer p-0.5 rounded"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Sign In Mode (Single Column) */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="commercial@pharmalaunch.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer p-0.5 rounded"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all mt-1 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Processing Request...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Organization Account' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Switcher */}
        <div className="pt-3.5 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors"
          >
            {isSignUp 
              ? 'Already have an organization account? Sign In'
              : 'Need to register a new launching organization? Sign Up'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
