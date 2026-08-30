'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSystem } from '@/context/SystemContext';
import {
  Zap,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  X,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, systemSettings } = useSystem();
  
  const [email, setEmail] = useState('nileshsoni@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  
  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const success = await login(email, password);
      if (success) {
        router.push('/');
      } else {
        setError('Invalid email or password credentials. Please verify your username and password.');
      }
    });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotSuccess(`Password reset instructions have been dispatched to ${forgotEmail}. Please check your inbox.`);
    setTimeout(() => {
      setForgotSuccess('');
      setShowForgotModal(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      
      {/* Background Glow Highlights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Company Logo & Brand Header */}
        <div className="text-center space-y-2">
          {systemSettings.companyInfo.logoUrl ? (
            <img
              src={systemSettings.companyInfo.logoUrl}
              alt="Company Logo"
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500/30 mx-auto shadow-glow-orange"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow-orange mx-auto text-white font-bold text-xl">
              <Zap className="w-7 h-7 fill-current" />
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            {systemSettings.companyInfo.name || 'Penguin Peak Technologies Pvt Ltd.'}
          </h1>
          <p className="text-xs text-zinc-400">
            Sign in to access your enterprise dashboard
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-obsidian-900 border border-obsidian-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-500" /> Work Email Address
              </label>
              <input
                type="email"
                required
                placeholder="user@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-800 text-white rounded-xl focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-500" /> Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-brand-400 hover:text-brand-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-obsidian-950 border border-obsidian-800 text-white rounded-xl focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-extrabold rounded-xl shadow-glow-orange cursor-pointer flex items-center justify-center space-x-2 transition-all mt-2 text-sm"
            >
              <span>{isPending ? 'Signing In...' : 'Sign In To Platform'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        <p className="text-[11px] text-center text-zinc-600">
          Penguin Peak Technologies Pvt Ltd. Platform • All Rights Reserved
        </p>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-obsidian-800 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-obsidian-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-500" /> Reset Password
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
                <p className="text-zinc-400">
                  Enter your registered work email address below. We will send password reset instructions to your inbox.
                </p>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="user@enterprise.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-obsidian-950 border border-obsidian-800 text-white rounded-xl focus:border-brand-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-zinc-400 hover:bg-obsidian-950 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
