/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, LogOut, Check, Sparkles, Database, ShieldAlert, BadgeCheck,
  Smartphone, User, Circle, Users, GraduationCap, Heart, Clock
} from 'lucide-react';
import { mockDB } from '../services/mock_db';
import { User as UserType, Notification } from '../types';

interface HeaderProps {
  currentUser: UserType;
  onUserChanged: (user: UserType) => void;
  openDatabaseConsole: () => void;
}

export default function Header({ currentUser, onUserChanged, openDatabaseConsole }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [systemUsers, setSystemUsers] = useState<UserType[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('offline');

  useEffect(() => {
    const checkStatus = () => {
      const url = (import.meta as any).env.VITE_SUPABASE_URL;
      const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) {
        setSupabaseStatus('offline');
        return;
      }
      const st = localStorage.getItem('permiso_supabase_sync_status') as any;
      setSupabaseStatus(st || 'synced');
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Clock trigger
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const reloadData = () => {
    setNotifications(mockDB.getNotifications().filter(n => n.user_id === currentUser.id));
    setSystemUsers(mockDB.getUsers());
  };

  useEffect(() => {
    reloadData();
    // Poll notifications every 5 seconds for simulation
    const interval = setInterval(reloadData, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = () => {
    const allNotifs = mockDB.getNotifications();
    const updated = allNotifs.map(n => n.user_id === currentUser.id ? { ...n, is_read: true } : n);
    mockDB.saveNotifications(updated);
    setNotifications(updated.filter(n => n.user_id === currentUser.id));
  };

  const handleUserSwap = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetUserId = e.target.value;
    const found = systemUsers.find(u => u.id === targetUserId);
    if (found) {
      mockDB.setCurrentUser(found.id);
      onUserChanged(found);
      setShowNotifMenu(false);
    }
  };

  const getRoleIcon = (roleStr: string) => {
    switch (roleStr) {
      case 'admin': return <BadgeCheck className="w-4 h-4 text-rose-500" />;
      case 'teacher': return <Users className="w-4 h-4 text-emerald-500" />;
      case 'student': return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
            <span className="font-sans font-black text-xl tracking-wider select-none px-1">P</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-900 font-sans font-extrabold text-xl tracking-tight">Permiso</span>
              {supabaseStatus === 'synced' && (
                <span className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 font-mono text-[9px] px-2 py-0.5 rounded-md tracking-wide flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SUPABASE LIVE
                </span>
              )}
              {supabaseStatus === 'syncing' && (
                <span className="bg-amber-50 text-amber-750 font-bold border border-amber-100 font-mono text-[9px] px-2 py-0.5 rounded-md tracking-wide flex items-center gap-1 select-none font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> SYNCING...
                </span>
              )}
              {supabaseStatus === 'error' && (
                <span className="bg-rose-50 text-rose-700 font-bold border border-rose-100 font-mono text-[9px] px-2 py-0.5 rounded-md tracking-wide flex items-center gap-1 select-none">
                  🔴 SYNC ERROR
                </span>
              )}
              {supabaseStatus === 'offline' && (
                <span className="text-slate-400 font-mono text-[9px] border border-slate-200 bg-slate-50 px-1 py-0.2 rounded-sm tracking-wide select-none">
                  LOCAL ONLY
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs tracking-tight">Digital Attendance & absence Management System</p>
          </div>
        </div>

        {/* Dynamic School Clock Timer */}
        <div className="hidden lg:flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-600">{currentTime}</span>
          <span className="text-xs text-slate-300 font-sans">|</span>
          <span className="text-xs text-slate-500">UTC-TIME</span>
        </div>

        {/* Live Simulator Workspace Controllers */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          
          {/* Quick Database Playground Shortcut */}
          <button 
            type="button"
            id="header-db-btn"
            onClick={openDatabaseConsole}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition duration-150 active:scale-95 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DB Console</span>
          </button>

          {/* SIMULATOR QUICK ROLE PORTAL SELECTOR */}
          <div className="flex items-center gap-2 bg-slate-50 border border-indigo-100 pl-2 rounded-xl py-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider hidden sm:inline">Simulate Role:</span>
            <select
              id="header-role-swapper"
              value={currentUser.id}
              onChange={handleUserSwap}
              className="text-xs font-bold text-slate-700 bg-transparent py-1 pr-7 pl-1 border-none focus:outline-hidden hover:bg-slate-100 rounded-lg cursor-pointer transition duration-150"
            >
              <optgroup label="Administrators">
                {systemUsers.filter(u => u.role === 'admin').map(u => (
                  <option key={u.id} value={u.id}>👑 {u.fullname} [Admin]</option>
                ))}
              </optgroup>
              <optgroup label="Teachers & Class Advisors">
                {systemUsers.filter(u => u.role === 'teacher').map(u => (
                  <option key={u.id} value={u.id}>🧑‍🏫 {u.fullname} [Teacher]</option>
                ))}
              </optgroup>
              <optgroup label="Students">
                {systemUsers.filter(u => u.role === 'student').map(u => (
                  <option key={u.id} value={u.id}>🎓 {u.fullname} [Student]</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* NOTIFICATION HUB INBOX BELL */}
          <div className="relative">
            <button
              id="header-bell-btn"
              type="button"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-sans font-black flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Portal */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden transform duration-200 origin-top-right">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 bg-slate-50">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-500" />
                    Permiso Inbox ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <Circle className="w-8 h-8 text-slate-200 mb-1" />
                      <p className="text-xs text-slate-400 font-medium">Your notifications inbox is empty</p>
                      <p className="text-[10px] text-slate-400">Student actions trigger real-time faculty & teacher alerts</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      let bgClass = "bg-white";
                      let AccentClass = "bg-indigo-500";
                      if (!notif.is_read) bgClass = "bg-indigo-50/40 hover:bg-indigo-50/60";
                      
                      if (notif.type === 'success') AccentClass = "bg-emerald-500";
                      if (notif.type === 'warning') AccentClass = "bg-amber-500";
                      if (notif.type === 'alert') AccentClass = "bg-rose-500";

                      return (
                        <div key={notif.id} className={`px-4 py-3 transition ${bgClass} flex gap-2.5`}>
                          <span className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${AccentClass}`} />
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-[9px] text-slate-400 font-mono leading-tight">Database triggers propagate notification cascades automatically based on RLS settings.</p>
                </div>
              </div>
            )}
          </div>

          {/* active user brief card */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.fullname}
              className="w-8 h-8 rounded-full border border-indigo-200 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="hidden md:block text-left text-xs leading-none">
              <span className="font-extrabold text-slate-800 block text-[13px]">{currentUser.fullname}</span>
              <span className="text-[9px] font-mono font-medium text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-100 inline-flex items-center gap-1 mt-0.5 uppercase">
                {getRoleIcon(currentUser.role)}
                {currentUser.role}
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
