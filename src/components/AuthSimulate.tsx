/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Key, Sparkles, LogIn, ChevronRight, Check, Shield, Globe, 
  HelpCircle, UserSquare2, ArrowRight, RefreshCw, UserPlus, GraduationCap
} from 'lucide-react';
import { mockDB } from '../services/mock_db';
import { User, UserRole } from '../types';

interface AuthSimulateProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthSimulate({ onLoginSuccess }: AuthSimulateProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Sign up States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regPhone, setRegPhone] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('');
  const [regClass, setRegClass] = useState('class-cs-2026-a');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setErrorMsg('Please enter your Username or Email details.');
      return;
    }
    if (!passwordInput) {
      setErrorMsg('Please enter your account password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const user = mockDB.login(emailInput, passwordInput);
      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMsg('Invalid login credentials. Please verify your Username or Email, and Password.');
        setLoading(false);
      }
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!regName || !regEmail) {
      setErrorMsg('Please enter Full Name and email address to register.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Please enter a password of at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      // Create a username based on the full name (lowercase, no spaces)
      const parsedUsername = regName.replace(/\s+/g, '').toLowerCase() || regEmail.split('@')[0];
      
      const newUser = mockDB.registerUser(regName, regEmail, regRole, {
        username: parsedUsername,
        password: regPassword,
        phone: regPhone,
        specialization: regRole === 'teacher' ? regSpecialty : undefined,
        class_id: regRole === 'student' ? regClass : undefined,
      });
      
      onLoginSuccess(newUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registrations failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100vh] bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 min-h-[520px]">
        
        {/* Left info column (5/12 width) */}
        <div className="md:col-span-5 bg-indigo-650 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle design elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl transform translate-x-24 -translate-y-12 opacity-50" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-sky-400 rounded-full blur-3xl opacity-30" />

          {/* Slogans */}
          <div className="relative">
            <div className="bg-indigo-500/35 border border-indigo-400/30 p-2.5 rounded-xl w-fit flex items-center justify-center mb-6">
              <span className="font-sans font-black text-2xl tracking-wider select-none px-1">P</span>
            </div>
            
            <h1 className="text-xl font-bold font-sans tracking-tight leading-tight font-display">Digital Attendance & Absence Management Platform</h1>
            <p className="text-indigo-200 text-xs mt-2 leading-relaxed">
              Replacing fragmented paper permissions with high-trust real-time workflows and advisor alerts.
            </p>
          </div>

          <div className="relative space-y-4 text-xs font-sans text-indigo-100 my-8">
            <div className="flex gap-2">
              <Check className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
              <p>Row-Level Security constraints lock student absence data to authorized staff.</p>
            </div>
            <div className="flex gap-2">
              <Check className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
              <p>Dynamic notifications alert relevant advisors on real-time headcount absence registries.</p>
            </div>
            <div className="flex gap-2">
              <Check className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
              <p>Advisors vet justifications (prescriptions, championship duty letters) in 1-click.</p>
            </div>
          </div>

          <div className="relative pt-6 border-t border-indigo-500/50 flex items-center gap-2">
            <span className="text-[10px] text-indigo-300 font-mono tracking-wider">SECURED ACADEMIC INTERFACE</span>
          </div>
        </div>

        {/* Right interaction column (7/12 width) */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-white relative">
          
          <div>
            {/* Nav Switch */}
            <div className="flex border-b border-slate-100 pb-2.5 mb-6">
              <button
                onClick={() => {
                  setErrorMsg('');
                  setActiveTab('signin');
                }}
                className={`pb-2.5 text-xs font-black tracking-tight uppercase px-4 border-b-2 transition duration-200 cursor-pointer ${
                  activeTab === 'signin' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setActiveTab('signup');
                }}
                className={`pb-2.5 text-xs font-black tracking-tight uppercase px-4 border-b-2 transition duration-200 cursor-pointer ${
                  activeTab === 'signup' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Register Identity
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-[11px] rounded-xl font-medium leading-relaxed mb-4">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* TAB CONTENT: SIGN IN */}
            {activeTab === 'signin' ? (
              <div className="space-y-6">
                
                {/* Email Form client */}
                <form onSubmit={handleStandardLogin} className="space-y-4">
                  
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Username or Email Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. pechchannorin@gmail.com or Admin"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-sans focus:outline-hidden"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter account password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-hidden"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {loading ? 'Authenticating secure session...' : 'Authorize Login Credentials'}
                    {!loading && <LogIn className="w-3.5 h-3.5" />}
                  </button>
                </form>

              </div>
            ) : (
              /* TAB CONTENT: REGISTRATIONS FORM */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Choose Registration Role</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    value={regRole}
                    onChange={(e: any) => setRegRole(e.target.value)}
                  >
                    <option value="student">🎓 Student Identity</option>
                    <option value="teacher">🧑‍🏫 Instructor Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Legal Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Timothy Vance"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-hidden"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. timmy@permiso.edu"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 font-mono focus:outline-hidden"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Phone No.</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 9912"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 font-mono focus:outline-hidden"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Set Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter at least 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 font-mono focus:outline-hidden"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>

                {regRole === 'student' && (
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Select Academic Class Section</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                      value={regClass}
                      onChange={(e) => setRegClass(e.target.value)}
                    >
                      <option value="class-cs-2026-a">CS-2026-A (Computer Science)</option>
                      <option value="class-ba-2026-b">BA-2026-B (Business Administration)</option>
                    </select>
                  </div>
                )}

                {regRole === 'teacher' && (
                  <div>
                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Classroom Speciality / Expertise</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cognitive Psychology, Cybernetics"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 focus:outline-hidden"
                      value={regSpecialty}
                      onChange={(e) => setRegSpecialty(e.target.value)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black py-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer mt-1 font-sans"
                >
                  {loading ? 'Initializing record mappings...' : 'Submit Profile Registrations'}
                  {!loading && <UserPlus className="w-3.5 h-3.5" />}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
