'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Building2, 
  User, 
  Mail, 
  Award, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { updateUserProfile } from '@/lib/api';

export default function AccountPage() {
  const [orgName, setOrgName] = useState('Novartis Commercial');
  const [userEmail, setUserEmail] = useState('us_commercial@pharmalaunch.com');
  const [role, setRole] = useState('launch_director');
  const [fullName, setFullName] = useState('US Commercial Director');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const roleLabels: Record<string, string> = {
    launch_director: 'Launch Director (Full Access)',
    forecast_analyst: 'Forecast Analyst (Read & Model)',
    commercial_associate: 'Commercial Associate (Workspace)',
    management_viewer: 'Management Viewer (Executive Read-Only)',
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOrg = sessionStorage.getItem('pharmalaunch_org') || localStorage.getItem('pharmalaunch_org');
      const storedEmail = sessionStorage.getItem('pharmalaunch_user_email') || localStorage.getItem('pharmalaunch_user_email');
      const storedName = sessionStorage.getItem('pharmalaunch_user_name') || localStorage.getItem('pharmalaunch_user_name');
      const storedRole = sessionStorage.getItem('pharmalaunch_role') || localStorage.getItem('pharmalaunch_role');

      if (storedOrg) setOrgName(storedOrg);
      if (storedEmail) setUserEmail(storedEmail);
      if (storedName) setFullName(storedName);
      if (storedRole) setRole(storedRole);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password to verify your identity before setting a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and Confirm password do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await updateUserProfile({
        email: userEmail,
        full_name: fullName,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });

      if (res.full_name) {
        setFullName(res.full_name);
        sessionStorage.setItem('pharmalaunch_user_name', res.full_name);
        localStorage.setItem('pharmalaunch_user_name', res.full_name);
      }
      if (res.token) {
        sessionStorage.setItem('pharmalaunch_token', res.token);
        localStorage.setItem('pharmalaunch_token', res.token);
      }

      setSuccessMsg('Account details updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Account & Profile Settings"
        subtitle="Manage your organization profile, credentials, and account details"
        backHref="/dashboard"
      />

      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Alerts */}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-4 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Card */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">User Profile & Credentials</h2>
                <p className="text-xs text-slate-500">View workspace roles and update editable user information</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Workspace
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Section 1: Read-Only Workspace Info */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Organization Details (Read-Only)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Organization Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={orgName}
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed select-none"
                  />
                  <p className="text-[10px] text-slate-400">Enterprise tenant assigned to this workspace</p>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" /> Assigned Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={roleLabels[role] || role}
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed select-none"
                  />
                  <p className="text-[10px] text-slate-400">Security permissions granted by organization admin</p>
                </div>

                {/* Email */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Work Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userEmail}
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed select-none"
                  />
                  <p className="text-[10px] text-slate-400">Primary login identity (immutable for account security)</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 2: Editable Full Name */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Personal Information (Editable)
              </h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 3: Password Update */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Change Password (Optional)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                To update your password, enter your current password to verify your identity followed by the new password.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating Account...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
