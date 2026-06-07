/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, FileText, Upload, CheckCircle2, AlertTriangle, AlertCircle, Info, Paperclip, ChevronRight, X
} from 'lucide-react';
import { mockDB } from '../services/mock_db';
import { User, PermissionRequest, LeaveType } from '../types';

interface StudentViewProps {
  currentStudentUser: User;
}

export default function StudentView({ currentStudentUser }: StudentViewProps) {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0, rate: 100 });

  // Form states
  const [leaveType, setLeaveType] = useState<LeaveType>('sickness');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  // Attachment mock helpers
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const reloadData = () => {
    // Loaded requests from mock db
    const allReqs = mockDB.getPermissionRequests().filter(r => r.student_id === currentStudentUser.id);
    setRequests(allReqs);

    // Mapped attendance stats
    const ownStats = mockDB.getAttendanceStats(currentStudentUser.id);
    setStats(ownStats);
  };

  useEffect(() => {
    reloadData();
  }, [currentStudentUser]);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      alert('A valid reason for your leave request is required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Error: End-date cannot occur before start-date inside Permiso registries.');
      return;
    }

    mockDB.submitPermissionRequest(currentStudentUser.id, {
      requestType: leaveType,
      reason,
      startDate,
      endDate,
      attachmentUrl
    });

    // Reset form states
    setReason('');
    setAttachmentUrl(null);
    alert('Leave permission form submitted to class advisor successfully!');
    reloadData();
  };

  // Draggable drag support simulation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateFileUpload();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateFileUpload();
    }
  };

  const simulateFileUpload = () => {
    setIsUploading(true);
    // Simulate Supabase storage uploads latency
    setTimeout(() => {
      // Seed beautifully
      const attachments = [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', // Dental slip
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400', // Medical prescription
        'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400', // Official duty letter
      ];
      const randomUrl = attachments[Math.floor(Math.random() * attachments.length)];
      setAttachmentUrl(randomUrl);
      setIsUploading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (4/12): Personal Attendance HUD */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-slate-900 font-display font-bold text-sm tracking-tight mb-1">Attendance Dashboard</h3>
            <p className="text-slate-400 text-[11px] mb-4">Your current real-time attendance ratio</p>

            <div className="flex flex-col items-center justify-center p-4 py-6 border border-slate-100 bg-slate-50 rounded-2xl">
              
              {/* Circular gauge */}
              <div className="relative w-32 h-32 flex items-center justify-center select-none">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="transparent"
                    stroke={stats.rate > 85 ? "#10B981" : stats.rate > 70 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="8"
                    strokeDasharray={326.7}
                    strokeDashoffset={326.7 - (326.7 * stats.rate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{stats.rate}%</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">My Rating</p>
                </div>
              </div>

              {/* Attendance categories counters */}
              <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center text-xs font-mono">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-600 block font-black text-base">{stats.present}</span>
                  <span className="text-[9px] text-slate-400 font-sans block mt-0.5 font-bold uppercase">Present</span>
                </div>
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-amber-500 block font-black text-base">{stats.late}</span>
                  <span className="text-[9px] text-slate-400 font-sans block mt-0.5 font-bold uppercase">Late</span>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-rose-600 block font-black text-base">{stats.absent}</span>
                  <span className="text-[9px] text-slate-400 font-sans block mt-0.5 font-bold uppercase">Absent</span>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-50/55 rounded-2xl border border-indigo-100 flex gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-700 leading-normal font-sans">
              <strong>Attendance Note:</strong> Approval of pending leave forms will automatically mark your attendance as EXCUSED PRESENT retrospectively.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN (8/12): Leave request submission panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-slate-900 font-display font-bold text-sm tracking-tight mb-1">File Leave Permission Form</h3>
          <p className="text-slate-400 text-[11px] mb-4">Request academic excused absences. Supports uploading justificative docs</p>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Absence Reason Category</label>
                <select
                  id="student-leave-type-select"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-850 font-bold focus:outline-hidden cursor-pointer"
                  value={leaveType}
                  onChange={(e: any) => setLeaveType(e.target.value)}
                >
                  <option value="sickness">🤒 Sickness / Medical Rest</option>
                  <option value="compassionate">🏠 Family Compassionate</option>
                  <option value="family_activity">👪 Scheduled Family Event</option>
                  <option value="school_duty">🏆 Official School Duties</option>
                  <option value="other">📑 Other Custom Excuse</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Date Window: Start Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-850 font-mono font-bold focus:outline-hidden"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Date Window: End Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-850 font-mono font-bold focus:outline-hidden"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1 font-mono">Detailed Reason Box (Justification)</label>
              <textarea
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-850 h-20 focus:outline-hidden"
                placeholder="Explain why you require absence clearance from class lectures. Provide clinic details or duty descriptions..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Simulated file upload with Drag & Drop */}
            <div>
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1.5 font-mono">Attachment Proof (Optional)</span>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center bg-slate-50/50 ${
                  dragActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center py-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-[11px] font-mono text-indigo-500 font-semibold uppercase tracking-wider">Uploading to public.attachments buckets...</p>
                  </div>
                ) : attachmentUrl ? (
                  <div className="flex items-center justify-between gap-3 w-full max-w-sm px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[10px] font-mono text-emerald-700 truncate block">medical_certificate_verified.jpg</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachmentUrl(null)}
                      className="text-emerald-600 hover:text-rose-500 transition cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1 animate-bounce" />
                    <span className="text-xs font-bold text-slate-700 text-slate-800 block hover:underline">Drag your file here or click to browse</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Supports PDF, JPEG, PNG, hospital notes (Max 5MB)</span>
                    <input
                      type="file"
                      id="student-file-input"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer"
              >
                File Request
              </button>
            </div>

          </form>

        </div>

      </div>

      {/* LOWER SECTION: Request History List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-slate-900 font-display font-bold text-sm tracking-tight mb-1">Your Submitted Requests ({requests.length})</h3>
        <p className="text-slate-400 text-[11px] mb-4">Track progress of requested excuses signed off of classes</p>

        {requests.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-150 rounded-2xl">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-1" />
            <p className="text-xs text-slate-400 font-bold">You haven't submitted any leave requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-indigo-50/40 select-none">
                  <th className="px-5 py-3">Submit Date</th>
                  <th className="px-5 py-3">Category type</th>
                  <th className="px-5 py-3">Duration windows</th>
                  <th className="px-5 py-3">Reason Description</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Comments Vetting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-slate-700 text-[12.5px]">
                {requests.map((req) => {
                  let statusBadge = "bg-amber-50 text-amber-600 border border-amber-100";
                  if (req.status === 'approved') statusBadge = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                  if (req.status === 'rejected') statusBadge = "bg-rose-50 text-rose-500 border border-rose-100";

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/30 transition">
                      <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-mono font-bold text-[9px] rounded uppercase">
                          {req.request_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-[10.5px]">
                        {req.start_date} <ChevronRight className="w-3 h-3 inline text-slate-400" /> {req.end_date}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs font-medium">
                        <p className="line-clamp-2" title={req.reason}>{req.reason}</p>
                        {req.attachment_url && (
                          <span className="text-[10px] text-indigo-500 flex items-center gap-1.5 mt-1 font-bold">
                            <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block animate-pulse" />
                            Supported file attached
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${statusBadge}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] font-sans font-medium text-slate-500">
                        {req.status === 'rejected' ? (
                          <span className="text-rose-500 flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {req.rejection_reason}
                          </span>
                        ) : req.status === 'approved' ? (
                          <span className="text-emerald-600 flex items-start gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Cleared by class advisor
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending advisor log review...</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
