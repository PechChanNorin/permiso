/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash, Plus, ShieldCheck, Database, Calendar, School, 
  Layers, ChevronRight, Search, Activity, BookOpen, Clock, RefreshCw, Filter, Check, MoreVertical
} from 'lucide-react';
import { mockDB } from '../services/mock_db';
import { User, Class, Department } from '../types';

export default function AdminView() {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  
  // Search and filter keys
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modal controllers
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formClassId, setFormClassId] = useState('');
  
  const [formClassName, setFormClassName] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formAdvisorId, setFormAdvisorId] = useState('');
  const [formAcademicYear, setFormAcademicYear] = useState('2026-2027');

  const [formDeptName, setFormDeptName] = useState('');
  const [formDeptDesc, setFormDeptDesc] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    setUsers(mockDB.getUsers());
    setClasses(mockDB.getClasses());
    setDepartments(mockDB.getDepartments());
    setActivityLogs(mockDB.getActivityLogs().slice(0, 15));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!formName || !formEmail) {
      setErrorMsg('Full Name and Email are strictly required fields.');
      return;
    }

    try {
      mockDB.registerUser(formName, formEmail, formRole, {
        phone: formPhone,
        specialization: formRole === 'teacher' ? formSpecialization : undefined,
        class_id: formRole === 'student' ? formClassId : undefined
      });
      
      setSuccessMsg(`Successfully registered new ${formRole}: ${formName}`);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormSpecialization('');
      loadData();
      setTimeout(() => {
        setShowAddUserModal(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user record.');
    }
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formClassName || !formDeptId || !formAdvisorId) {
      setErrorMsg('Please specify class section name, associated department, and advisor teacher.');
      return;
    }

    const adminUser = mockDB.getCurrentUser();
    if (!adminUser) return;

    mockDB.createClass(formClassName, formDeptId, formAdvisorId, formAcademicYear, adminUser.id);
    setSuccessMsg(`Class ${formClassName} successfully configured!`);
    setFormClassName('');
    loadData();
    setTimeout(() => {
      setShowAddClassModal(false);
      setSuccessMsg('');
    }, 1500);
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formDeptName) {
      setErrorMsg('Department name is required.');
      return;
    }

    const adminUser = mockDB.getCurrentUser();
    if (!adminUser) return;

    mockDB.createDepartment(formDeptName, formDeptDesc, adminUser.id);
    setSuccessMsg(`Academic department ${formDeptName} added to registry!`);
    setFormDeptName('');
    setFormDeptDesc('');
    loadData();
    setTimeout(() => {
      setShowAddDeptModal(false);
      setSuccessMsg('');
    }, 1500);
  };

  const handleDeleteUser = (userId: string) => {
    const adminUser = mockDB.getCurrentUser();
    if (!adminUser) return;
    
    if (userId === adminUser.id) {
      alert('Security lock: You cannot self-delete your active Administrator session!');
      return;
    }

    if (confirm('Are you sure you want to remove this user profile from the database? This cascades to students registries immediately.')) {
      mockDB.deleteUser(userId, adminUser.id);
      loadData();
    }
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'teacher' | 'student') => {
    const adminUser = mockDB.getCurrentUser();
    if (!adminUser) return;
    try {
      mockDB.updateUserRole(userId, newRole, adminUser.id);
      loadData();
      setSuccessMsg('User role updated and sub-registries synchronized.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role.');
    }
  };

  // Stats calculation
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalClasses = classes.length;
  const pendingRequests = mockDB.getPermissionRequests().filter(r => r.status === 'pending').length;
  const globalAttendance = mockDB.getAttendanceStats();

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullname.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Total Students */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Students</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalStudents}</h3>
            <p className="text-[10px] text-indigo-500 font-medium mt-1">Active enrollments</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Total Teachers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Faculty Staff</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalTeachers}</h3>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">Class advisors allocated</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <School className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Unapproved Leaves */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pending Leave requests</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingRequests}</h3>
            <p className="text-[10px] text-amber-500 font-medium mt-1">Requires staff approval</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Average Attendance Ratio */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Avg Attendance Rate</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{globalAttendance.rate}%</h3>
            {/* Visual tiny progress bar */}
            <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${globalAttendance.rate}%` }} />
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

      </div>

      {/* Main split: Directory and system management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Col: Users Directory Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          
          {/* Header Controls */}
          <div className="p-6 border-b border-slate-250 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-slate-900 font-display font-bold text-base tracking-tight">System User Directory</h2>
              <p className="text-slate-400 text-xs">Manage active school enrollment and instructor staff accounts</p>
            </div>
          </div>

          {(errorMsg || successMsg) && (
            <div className="px-6 py-2 border-b border-slate-100">
              {successMsg && <p className="text-xs text-emerald-600 font-bold">✓ {successMsg}</p>}
              {errorMsg && <p className="text-xs text-rose-600 font-bold">⚠️ {errorMsg}</p>}
            </div>
          )}

          <div className="px-6 py-3.5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl text-xs pl-9 pr-4 py-2 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Search user registry by name or email ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Role: All Users</option>
                <option value="admin">Admins Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="student">Students Only</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No registered accounts correspond to filters</p>
                <p className="text-[10px] text-slate-400 mt-1">Try resetting search parameters</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/30 text-slate-400 font-extrabold uppercase border-b border-slate-100 text-[10px] tracking-wider select-none">
                    <th className="px-6 py-3">Profile Data</th>
                    <th className="px-6 py-3">Role Status</th>
                    <th className="px-6 py-3">Contact info</th>
                    <th className="px-6 py-3 text-right">Operational Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700 text-[12px]">
                  {filteredUsers.map((user) => {
                    let badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-150";
                    if (user.role === 'admin') badgeClass = "bg-rose-50 text-rose-705 border-rose-150";
                    if (user.role === 'teacher') badgeClass = "bg-emerald-50 text-emerald-705 border-emerald-150";

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5 flex items-center gap-3">
                          <img
                            src={user.avatar_url}
                            alt={user.fullname}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block">{user.fullname}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'teacher' | 'student')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-hidden ${badgeClass}`}
                          >
                            <option value="student">🎓 Student</option>
                            <option value="teacher">🧑‍🏫 Teacher</option>
                            <option value="admin">👑 Admin</option>
                          </select>
                          <span className="text-[10px] text-slate-400 block mt-1.5 font-mono">ID: {user.id.slice(0, 10)}...</span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 font-medium">
                          <span className="block font-mono text-[11px]">{user.phone}</span>
                          <span className="text-[10px] text-emerald-500 flex items-center gap-1.5 mt-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition cursor-pointer inline-flex items-center"
                            title="De-register user"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col: Academic Infrastructure Panel */}
        <div className="space-y-6">
          
          {/* Section: Classes & Departments directory */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-900 font-display font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <School className="w-4 h-4 text-indigo-500" />
                  Academic Sections ({totalClasses})
                </h3>
                <p className="text-slate-400 text-[11px]">Class groupings and department structures</p>
              </div>
              
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="p-1 px-2 text-[10px] font-extrabold bg-slate-50 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 cursor-pointer"
                >
                  + Class
                </button>
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="p-1 px-2 text-[10px] font-extrabold bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  + Dept
                </button>
              </div>
            </div>

            {/* List classes */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {classes.map((cls) => {
                const advisor = users.find(u => u.id === cls.advisor_teacher_id);
                const dept = departments.find(d => d.id === cls.department_id);
                return (
                  <div key={cls.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between hover:border-indigo-200 transition">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-800">{cls.class_name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 font-bold uppercase shrink-0">
                          {dept?.department_name || 'General'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Advisor: <span className="font-bold text-slate-700">{advisor?.fullname || 'Unassigned'}</span>
                      </p>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                      {cls.academic_year}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Live Audited Operations Tracker */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-slate-900 font-display font-bold text-sm tracking-tight flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              System Operations Audit
            </h3>
            <p className="text-slate-400 text-[11px] mb-4">Cryptographic integrity trail representing all user actions</p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-[11px] font-mono select-none">
              {activityLogs.map((log) => {
                const user = users.find(u => u.id === log.user_id);
                return (
                  <div key={log.id} className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] hover:bg-slate-50 transition">
                    <div className="flex justify-between text-[10px] font-extrabold">
                      <span className="text-indigo-600 font-mono tracking-tight">{log.action}</span>
                      <span className="text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-normal font-sans text-xs">{log.description}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">Executed by: {user?.fullname || 'System Daemon'}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: ADD USER FORM */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-slate-900 font-sans font-extrabold text-base">Register School Entity</h3>
                <p className="text-slate-400 text-xs text-slate-500">Add secure credentials to authorization tables</p>
              </div>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 font-sans font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs rounded-xl font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs rounded-xl font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. Kenneth Cole"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Email Address / Login ID</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-mono"
                  placeholder="e.g. kenneth@school.edu"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">User Role</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 font-bold"
                    value={formRole}
                    onChange={(e: any) => setFormRole(e.target.value)}
                  >
                    <option value="student">🎓 Student</option>
                    <option value="teacher">🧑‍🏫 Teacher</option>
                    <option value="parent">👪 Parent</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Mobile Phone</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-mono"
                    placeholder="+1 (555) 9912"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Conditional teacher specialties */}
              {formRole === 'teacher' && (
                <div>
                  <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Specialization</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                    placeholder="e.g. Discrete Mathematics, Compiler Theory"
                    value={formSpecialization}
                    onChange={(e) => setFormSpecialization(e.target.value)}
                  />
                </div>
              )}

              {/* Conditional student enrollment section */}
              {formRole === 'student' && (
                <div>
                  <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Assign Class Section</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                  >
                    <option value="">-- Choose Class Section --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Confirm Registration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-slate-900 font-sans font-extrabold text-base">Setup Class Section</h3>
                <p className="text-slate-400 text-xs">Configure groupings under department RLS bounds</p>
              </div>
              <button 
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600 font-sans font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-100 text-[11px] text-rose-500 rounded-xl font-mono">{errorMsg}</div>
              )}
              {successMsg && (
                <div className="p-2 bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-500 rounded-xl font-mono">{successMsg}</div>
              )}

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Class Room / Section Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INF-2026-X"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-850 focus:outline-hidden"
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Department Association</label>
                <select
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-hidden font-bold"
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Faculty Advisor</label>
                <select
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-hidden font-bold"
                  value={formAdvisorId}
                  onChange={(e) => setFormAdvisorId(e.target.value)}
                >
                  <option value="">-- Choose Instructor --</option>
                  {users.filter(u => u.role === 'teacher').map(t => (
                    <option key={t.id} value={t.id}>{t.fullname} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Academic Session Year</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-850 focus:outline-hidden font-mono"
                  value={formAcademicYear}
                  onChange={(e) => setFormAcademicYear(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Create Class
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD DEPARTMENT */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-slate-900 font-sans font-extrabold text-base">Register Department</h3>
                <p className="text-slate-400 text-xs text-slate-500">Global registry settings</p>
              </div>
              <button 
                onClick={() => setShowAddDeptModal(false)}
                className="text-slate-400 hover:text-slate-600 font-sans font-bold text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-100 text-[11px] text-rose-500 rounded-xl font-mono">{errorMsg}</div>
              )}
              {successMsg && (
                <div className="p-2 bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-500 rounded-xl font-mono">{successMsg}</div>
              )}

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Engineering"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-850 focus:outline-hidden"
                  value={formDeptName}
                  onChange={(e) => setFormDeptName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 font-mono">Overview Description</label>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-850 h-24 focus:outline-hidden"
                  placeholder="Focus, targets and specialties of this academic school branch..."
                  value={formDeptDesc}
                  onChange={(e) => setFormDeptDesc(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Save Department
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
