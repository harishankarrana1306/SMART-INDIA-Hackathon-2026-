import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import { User as UserType } from '../types';
import { Landmark, AlertCircle, ArrowRight, Lock, User, ShieldCheck, Activity, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: (data: { token: string; user: UserType }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('investigator1');
  const [password, setPassword] = useState('Investigator@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (onLoginSuccess) {
        // Authenticate credentials against backend API
        const res = await api.login(username, password);
        onLoginSuccess({ token: res.access_token, user: res.user });
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#EFEAE2] flex flex-col justify-between text-[#2C241D] relative overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-16 px-6 sm:px-8 bg-[#20150F] border-b border-[#3D291D] flex items-center justify-between z-20 flex-shrink-0 shadow-md">
        {/* Brand & Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-10 flex items-center justify-center flex-shrink-0">
            <img
              src="/netra_eye_logo_transparent.png"
              alt="NETRA Official Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(221,161,94,0.4)] transform hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider text-white">
                NETRA
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#5C3D28] text-[#F5EFE6] border border-[#7D5337]">
                Decision Support
              </span>
            </div>
            <p className="text-[11px] text-[#B5A89B] tracking-tight">
              Criminal Network Analysis System
            </p>
          </div>
        </div>

        {/* Operational System Ready Capsule */}
        <div className="flex items-center gap-2 text-xs bg-[#2E1F16]/90 border border-[#523A2A] px-4 py-1.5 rounded-full text-[#E5DACB] shadow-inner backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-[#DDA15E] animate-pulse" />
          <span className="font-semibold text-[#F5EFE6]">Operational System Ready</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400 ml-0.5 animate-pulse" />
        </div>
      </header>

      {/* Main Container with Beige Hero Artwork */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Warm Beige & Caramel Cinematic Background Image (Static, Single Pristine Artwork) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/netra_beige_hero_bg_ultra.jpg"
            alt="NETRA Criminal Network Intelligence"
            className="w-full h-full object-cover object-bottom"
          />
          {/* Soft ambient gradient overlay to guarantee perfect contrast and depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFEAE2]/35 via-transparent to-[#EFEAE2]/20" />
        </div>

        {/* Hero Grid: Left Content (Elevated to top with high contrast) + Right 3D Bulging Card */}
        <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-2 sm:py-4 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:items-center">
          {/* Left Column: Welcome text, titles, descriptions & badges */}
          <div className="lg:col-span-7 flex flex-col justify-start self-start pt-0 lg:pt-1 space-y-3 pr-0 lg:pr-6">
            <div className="p-4 sm:p-6 -ml-4 rounded-3xl bg-gradient-to-br from-[#FAF7F2]/85 via-[#F5EFE6]/50 to-transparent backdrop-blur-xs border border-[#E5DACB]/40 shadow-sm space-y-2.5">
              <span className="text-xs font-black uppercase tracking-widest text-[#7A4B27]">
                Welcome to
              </span>

              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-[#20150F] tracking-tight leading-none drop-shadow-xs">
                NETRA
              </h2>

              <p className="text-sm sm:text-base font-black uppercase tracking-widest text-[#6E3C17] pt-0.5 drop-shadow-xs">
                CRIMINAL NETWORK ANALYSIS SYSTEM
              </p>

              <p className="text-xs sm:text-sm text-[#2C2018] leading-relaxed max-w-lg pt-1 font-bold">
                AI-Powered Intelligence for a Safer Nation. Multi-source entity resolution, cellular CDR triangulation, financial layering analysis, and temporal crime chronology reconstruction.
              </p>

              {/* Feature Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5C7B8] text-[#2C2018] font-bold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-[#8A5A36]" />
                  <span>Audited Hash-Chain</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5C7B8] text-[#2C2018] font-bold shadow-xs">
                  <Lock className="w-4 h-4 text-[#8A5A36]" />
                  <span>Tamper-Proof Ledger</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact 3D Bulging Pop-out Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end self-center">
            {/* Outer 3D Bevel Bezel / Frame */}
            <div
              className="w-full max-w-md p-1.5 rounded-[46px] transition-transform duration-300 hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(145deg, #FFFFFF 0%, #E8DCCB 50%, #CFC0AD 100%)',
                boxShadow:
                  '0 45px 90px -18px rgba(45, 28, 15, 0.42), 0 20px 45px -8px rgba(60, 38, 20, 0.25), 0 6px 16px rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* Inner Bulging Card Body */}
              <div
                className="w-full rounded-[40px] p-8 sm:p-10 relative overflow-hidden text-[#2C2018]"
                style={{
                  background: 'linear-gradient(155deg, #FFFDFB 0%, #FAF6EE 45%, #F2E9DC 100%)',
                  boxShadow:
                    'inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -4px 12px rgba(120, 80, 50, 0.12), 0 1px 2px rgba(0, 0, 0, 0.05)',
                  border: '1.5px solid rgba(255, 255, 255, 0.9)',
                }}
              >
                {/* Decorative Subtle Texture on Top Right */}
                <div className="absolute top-0 right-0 w-36 h-36 opacity-30 pointer-events-none bg-[radial-gradient(#8A5A36_1.5px,transparent_1.5px)] [background-size:12px_12px] rounded-tr-[40px]" />

                {/* 3D Floating Netra Eye Emblem (Transparent / Seamless Background) */}
                <div className="flex items-center justify-center mx-auto mb-3 transform hover:scale-105 transition-transform">
                  <img
                    src="/netra_eye_logo_transparent.png"
                    alt="NETRA Official Emblem"
                    className="w-28 h-18 object-contain filter drop-shadow-[0_12px_20px_rgba(104,63,30,0.35)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                  />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-[#2C2018] tracking-tight drop-shadow-2xs">
                    Welcome Back
                  </h3>
                  <p className="text-xs text-[#7D7268] mt-1 font-semibold">
                    Sign in to continue to the intelligence portal
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fadeIn font-semibold shadow-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username (Sunken 3D Well Depth) */}
                  <div>
                    <label className="block text-xs font-black text-[#2C2018] mb-1.5 uppercase tracking-wider">
                      Username
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="investigator1"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl text-[#2C2018] text-xs font-black placeholder-[#9C9288] focus:bg-white focus:outline-none focus:border-[#8A5A36] transition-all"
                        style={{
                          background: 'linear-gradient(180deg, #ECE4D6 0%, #F5EFE5 35%, #FAF7F2 100%)',
                          boxShadow:
                            'inset 0 3px 6px rgba(44, 28, 16, 0.15), inset 0 1px 2px rgba(44, 28, 16, 0.10), 0 1px 2px rgba(255, 255, 255, 0.9)',
                          border: '1.5px solid #D5C7B5',
                        }}
                      />
                    </div>
                  </div>

                  {/* Password (Sunken 3D Well Depth) */}
                  <div>
                    <label className="block text-xs font-black text-[#2C2018] mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-2xl text-[#2C2018] text-xs font-black placeholder-[#9C9288] focus:bg-white focus:outline-none focus:border-[#8A5A36] transition-all"
                        style={{
                          background: 'linear-gradient(180deg, #ECE4D6 0%, #F5EFE5 35%, #FAF7F2 100%)',
                          boxShadow:
                            'inset 0 3px 6px rgba(44, 28, 16, 0.15), inset 0 1px 2px rgba(44, 28, 16, 0.10), 0 1px 2px rgba(255, 255, 255, 0.9)',
                          border: '1.5px solid #D5C7B5',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#2C2018] cursor-pointer transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs text-[#7D7268] pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#D5C7B5] text-[#8A5A36] focus:ring-[#8A5A36] w-3.5 h-3.5"
                      />
                      <span className="text-[#5C5248] font-bold">Remember me</span>
                    </label>
                    <span className="text-[#8A5A36] hover:underline font-bold cursor-pointer">
                      Forgot Password?
                    </span>
                  </div>

                  {/* 3D Tactile Bulging Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 transform active:translate-y-0.5 disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(180deg, #9C6644 0%, #824E26 40%, #633B18 100%)',
                      boxShadow:
                        '0 10px 24px -3px rgba(99, 59, 24, 0.55), 0 3px 0 #48260E, inset 0 1.5px 2px rgba(255, 255, 255, 0.40), inset 0 -2px 4px rgba(0, 0, 0, 0.20)',
                      border: '1px solid #B07D58',
                    }}
                  >
                    <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </form>

                {/* Quick Demo Accounts */}
                <div className="mt-6 pt-4 border-t border-[#E5DACB]/80">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8C827A] mb-2.5 text-center">
                    Quick Demo Accounts
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleQuickSelect('investigator1', 'Investigator@123')}
                      className="py-2.5 px-4 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer transform active:translate-y-0.5 disabled:opacity-50"
                      style={
                        username === 'investigator1'
                          ? {
                              background: 'linear-gradient(180deg, #F3ECE1 0%, #E5DACB 100%)',
                              boxShadow: 'inset 0 2px 4px rgba(50, 35, 20, 0.15), 0 1px 0 #FFF',
                              border: '1.5px solid #8A5A36',
                              color: '#8A5A36',
                            }
                          : {
                              background: 'linear-gradient(180deg, #FFFFFF 0%, #F5EFE6 50%, #EDE5D8 100%)',
                              boxShadow: '0 4px 10px rgba(44, 30, 18, 0.08), 0 1.5px 0 #CFC3B0, inset 0 1px 1px #FFF',
                              border: '1.5px solid #D8CCBA',
                              color: '#5C5248',
                            }
                      }
                    >
                      Investigator
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleQuickSelect('supervisor1', 'Supervisor@123')}
                      className="py-2.5 px-4 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer transform active:translate-y-0.5 disabled:opacity-50"
                      style={
                        username === 'supervisor1'
                          ? {
                              background: 'linear-gradient(180deg, #F3ECE1 0%, #E5DACB 100%)',
                              boxShadow: 'inset 0 2px 4px rgba(50, 35, 20, 0.15), 0 1px 0 #FFF',
                              border: '1.5px solid #8A5A36',
                              color: '#8A5A36',
                            }
                          : {
                              background: 'linear-gradient(180deg, #FFFFFF 0%, #F5EFE6 50%, #EDE5D8 100%)',
                              boxShadow: '0 4px 10px rgba(44, 30, 18, 0.08), 0 1.5px 0 #CFC3B0, inset 0 1px 1px #FFF',
                              border: '1.5px solid #D8CCBA',
                              color: '#5C5248',
                            }
                      }
                    >
                      Supervisor
                    </button>
                  </div>
                </div>

                {/* Bottom Secured Badge */}
                <div className="mt-5 text-center">
                  <span className="text-[11px] text-[#8C827A] font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8A5A36]" />
                    Secured by NCRB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
