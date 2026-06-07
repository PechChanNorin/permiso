/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { mockDB } from './services/mock_db';
import { User, UserRole } from './types';
import Header from './components/Header';
import DBPlayground from './components/DBPlayground';
import AuthSimulate from './components/AuthSimulate';
import AdminView from './components/AdminView';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import { 
  LogOut, ShieldAlert, BadgeCheck, GraduationCap, Users, Heart, Clipboard, HelpCircle, Server
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDBPlayground, setShowDBPlayground] = useState(false);

  useEffect(() => {
    // Bootstrap Supabase emulate structures
    mockDB.initialize();
    
    // Check session persistence
    const savedUser = mockDB.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    if (currentUser) {
      mockDB.logActivity(currentUser.id, 'USER_LOGOUT', 'Destroyed user authorization credentials session.');
    }
    localStorage.removeItem('permiso_current_user_id');
    setCurrentUser(null);
  };

  const handleUserSwapInHeader = (swappedUser: User) => {
    setCurrentUser(swappedUser);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'border-rose-100 bg-rose-50 text-rose-700';
      case 'teacher': return 'border-emerald-100 bg-emerald-50 text-emerald-700';
      case 'student': return 'border-indigo-100 bg-indigo-50 text-indigo-700';
      default: return 'border-slate-100 bg-slate-50 text-slate-700';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <BadgeCheck className="w-5 h-5 text-rose-600" />;
      case 'teacher': return <Users className="w-5 h-5 text-emerald-600" />;
      case 'student': return <GraduationCap className="w-5 h-5 text-indigo-600" />;
      default: return <Clipboard className="w-5 h-5" />;
    }
  };

  // If session is unauthenticated, redirect to Google Login & credentials selector
  if (!currentUser) {
    return <AuthSimulate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Platform Header */}
      <Header 
        currentUser={currentUser} 
        onUserChanged={handleUserSwapInHeader} 
        openDatabaseConsole={() => setShowDBPlayground(true)} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
        {/* Welcome Banner Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-xl border ${getRoleBadgeColor(currentUser.role)} shadow-xs`}>
              {getRoleIcon(currentUser.role)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">Welcome, {currentUser.fullname}</h1>
                <span className={`text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 border rounded-full ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role} Account
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Current School Session • Academic Year 2026-2027 • Authorized via Supabase Row-Level Policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Quick API Manual Banner indicator */}
            <button
              onClick={() => setShowDBPlayground(true)}
              className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 rounded-xl transition cursor-pointer select-none"
            >
              SQL schema & API integration
            </button>

            <button
              id="app-signout-btn"
              onClick={handleLogout}
              className="p-2 px-3 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition border border-slate-200 cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Dynamic Workspace Resolution */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {currentUser.role === 'admin' && <AdminView />}
          {currentUser.role === 'teacher' && <TeacherView currentTeacherUser={currentUser} />}
          {currentUser.role === 'student' && <StudentView currentStudentUser={currentUser} />}
        </div>

      </main>

      {/* Database Playground and PostgreSQL Schema Viewer Modal Drawer */}
      {showDBPlayground && (
        <DBPlayground onClose={() => setShowDBPlayground(false)} />
      )}

      {/* Human Footnotes margins */}
      <footer className="py-6 border-t border-slate-100 text-center text-[11px] text-slate-400 font-mono">
        <p>Permiso Academic © 2026 • Digitized Absence Clearance Console. Powering Secure Realtime Educational Workflow.</p>
        <p className="mt-1 text-[10px] text-indigo-400 font-bold">Tested in High-Contrast Staging Safe Mode. Powered by Supabase RLS & PostgreSQL triggers.</p>
      </footer>

    </div>
  );
}
