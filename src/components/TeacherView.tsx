/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Check, X, Shield, Calendar, Award, FileText, CheckCircle2, AlertCircle, Clock, Save, UserCheck, MessageSquare
} from 'lucide-react';
import { mockDB } from '../services/mock_db';
import { User, PermissionRequest, Attendance, Class } from '../types';

interface TeacherViewProps {
  currentTeacherUser: User;
}

export default function TeacherView({ currentTeacherUser }: TeacherViewProps) {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Vetting rejection/approval feedback states
  const [vettingComment, setVettingComment] = useState('');
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);

  // Temporary grid attendance state
  const [attendanceGrid, setAttendanceGrid] = useState<Record<string, { status: 'present' | 'absent' | 'late'; remarks: string }>>({});

  const reloadData = () => {
    // Permission requests (both pending and handled)
    setRequests(mockDB.getPermissionRequests());
    
    // Classes
    const allClasses = mockDB.getClasses();
    setClasses(allClasses);
    
    // Set default class if empty
    if (allClasses.length > 0 && !selectedClassId) {
      // Find classes advised by this teacher first, otherwise use first
      const advised = allClasses.find(c => c.advisor_teacher_id === currentTeacherUser.id);
      setSelectedClassId(advised ? advised.id : allClasses[0].id);
    }
  };

  useEffect(() => {
    reloadData();
  }, [currentTeacherUser]);

  // Load students for the selected class and populate current attendance grid values from DB
  const loadClassStudents = () => {
    if (!selectedClassId) return;

    const allStudents = mockDB.getStudents().filter(s => s.class_id === selectedClassId);
    const users = mockDB.getUsers();
    
    const mapped = allStudents.map(s => {
      const u = users.find(usr => usr.id === s.user_id);
      return {
        id: s.id,
        user_id: s.user_id,
        student_id_code: s.student_id,
        fullname: u?.fullname || 'Unknown Student',
        email: u?.email || '',
        avatar_url: u?.avatar_url || ''
      };
    });

    setStudents(mapped);

    // Pull attendance for this class and date
    const attendanceRecords = mockDB.getAttendance().filter(
      a => a.class_id === selectedClassId && a.attendance_date === attendanceDate
    );

    const initialGridState: Record<string, { status: 'present' | 'absent' | 'late'; remarks: string }> = {};
    mapped.forEach(std => {
      const record = attendanceRecords.find(a => a.student_id === std.user_id);
      initialGridState[std.user_id] = {
        status: record ? record.status : 'present', // Defaults to present on load
        remarks: record ? record.remarks : ''
      };
    });

    setAttendanceGrid(initialGridState);
  };

  useEffect(() => {
    loadClassStudents();
  }, [selectedClassId, attendanceDate]);

  const handleStatusChange = (studentUserId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceGrid(prev => ({
      ...prev,
      [studentUserId]: {
        ...prev[studentUserId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentUserId: string, remarks: string) => {
    setAttendanceGrid(prev => ({
      ...prev,
      [studentUserId]: {
        ...prev[studentUserId],
        remarks
      }
    }));
  };

  const handleSaveAttendance = () => {
    const entries = Object.entries(attendanceGrid) as [string, { status: 'present' | 'absent' | 'late'; remarks: string }][];
    const recordsToUpdate = entries.map(([studentId, data]) => ({
      student_id: studentId,
      class_id: selectedClassId,
      date: attendanceDate,
      status: data.status,
      remarks: data.remarks
    }));

    mockDB.updateAttendance(recordsToUpdate, currentTeacherUser.id);
    alert('Attendance Roster Sheet synchronized with database successfully!');
    reloadData();
  };

  const handleVetting = (reqId: string, action: 'approved' | 'rejected') => {
    if (action === 'rejected' && !vettingComment) {
      setProcessingReqId(reqId);
      setRejectMode(true);
      return;
    }

    mockDB.processPermissionRequest(reqId, currentTeacherUser.id, action, vettingComment);
    setVettingComment('');
    setProcessingReqId(null);
    setRejectMode(false);
    reloadData();
    loadClassStudents(); // approved leaves can retroactively alter today's grid, reload!
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      
      {/* Upper split: Vetting Center & Classroom selection tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CARD (7/12 width): Interactive Attendance Registry desk */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-slate-900 font-display font-bold text-base tracking-tight flex items-center gap-1.5">
                  <UserCheck className="w-5 h-5 text-indigo-500" />
                  Roster Control Desk
                </h2>
                <p className="text-slate-400 text-xs text-slate-500">Log class presence or absence anomalies for parents oversight</p>
              </div>

              {/* Class & Date filter handles */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  id="teacher-class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-extrabold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>👥 {c.class_name}</option>
                  ))}
                </select>

                <input
                  id="teacher-date-picker"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Attendance Spreadsheet Grid */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden mt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100 select-none">
                    <th className="px-5 py-3">Student Informant</th>
                    <th className="px-5 py-3">Registry Marking</th>
                    <th className="px-5 py-3">Advisor Commentary & Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700 text-[12.5px]">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-400 font-bold">
                        No students enrolled in section {selectedClass?.class_name || 'N/A'}
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const gridState = attendanceGrid[student.user_id] || { status: 'present', remarks: '' };

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/30 transition">
                          
                          {/* Student profile col */}
                          <td className="px-5 py-3 flex items-center gap-2.5">
                            <img
                              src={student.avatar_url}
                              alt={student.fullname}
                              className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="font-extrabold block text-slate-950 text-xs">{student.fullname}</span>
                              <span className="text-[9.5px] font-mono font-medium text-slate-400 block mt-0.5">ID: {student.student_id_code}</span>
                            </div>
                          </td>

                          {/* Present/Absent/Late selector badges */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-150 w-fit">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.user_id, 'present')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition uppercase select-none cursor-pointer ${
                                  gridState.status === 'present'
                                    ? 'bg-emerald-500 text-white font-black shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.user_id, 'late')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition uppercase select-none cursor-pointer ${
                                  gridState.status === 'late'
                                    ? 'bg-amber-400 text-slate-900 font-black shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.user_id, 'absent')}
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition uppercase select-none cursor-pointer ${
                                  gridState.status === 'absent'
                                    ? 'bg-rose-500 text-white font-black shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>

                          {/* Comments box */}
                          <td className="px-5 py-3">
                            <input
                              type="text"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[11px] px-2.5 py-1 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-400 focus:bg-white transition"
                              placeholder="e.g. excused dental rest, missed morning shuttle..."
                              value={gridState.remarks}
                              onChange={(e) => handleRemarksChange(student.user_id, e.target.value)}
                            />
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sync actions */}
          {students.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer active:scale-97 select-none"
              >
                <Save className="w-3.5 h-3.5" />
                Commit Attendance Logs
              </button>
            </div>
          )}
        </div>

        {/* RIGHT CARD (5/12 width): Leave Permissions Vetting Board */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-slate-900 font-display font-bold text-sm tracking-tight flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Vetting Board ({pendingRequests.length} pending)
              </h2>
              <p className="text-slate-400 text-[11px]">Audit excuses and sign off official permissions</p>
            </div>

            {/* Pending leave list */}
            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
                <Award className="w-10 h-10 text-emerald-400 mx-auto mb-1 animate-pulse" />
                <p className="text-xs font-bold text-slate-600">All student leave requests are vetted!</p>
                <p className="text-[10px] text-slate-400 mt-1">Excellent work keeping absence rosters clean.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {pendingRequests.map((req) => {
                  const applicant = mockDB.getUsers().find(u => u.id === req.student_id);
                  const isProcessingThis = processingReqId === req.id;

                  return (
                    <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col gap-2.5">
                      
                      {/* Applicant info */}
                      <div className="flex items-center gap-2">
                        <img
                          src={applicant?.avatar_url}
                          alt={applicant?.fullname}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-extrabold text-slate-800 block text-xs">{applicant?.fullname}</span>
                          <span className="text-[9px] text-indigo-500 font-mono font-bold uppercase shrink-0">
                            Type: {req.request_type}
                          </span>
                        </div>
                      </div>

                      {/* Content parameters */}
                      <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-150 leading-relaxed font-sans font-medium italic">
                        "{req.reason}"
                      </p>

                      {/* Date span */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono font-semibold bg-white p-1.5 rounded-lg border border-slate-100 self-start">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        <span>{req.start_date}</span>
                        <span>to</span>
                        <span>{req.end_date}</span>
                      </div>

                      {/* Attachment rendering if present */}
                      {req.attachment_url && (
                        <div className="p-1 px-2 border border-slate-200 bg-white rounded-xl self-start flex items-center gap-1.5 hover:bg-slate-50 transition cursor-help" title="Justification form attached">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-mono text-slate-500 shrink-0 select-none">Supported Document Proof</span>
                          <a href={req.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline shrink-0">View Attachment</a>
                        </div>
                      )}

                      {/* Action buttons or reject comment form */}
                      {isProcessingThis && rejectMode ? (
                        <div className="bg-white border border-rose-100 p-2 rounded-xl mt-1 flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase text-rose-500 block font-mono">Specify Rejection Comment</label>
                          <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-2 py-1 h-14 focus:outline-hidden"
                            placeholder="Why has this leave form been unapproved?..."
                            value={vettingComment}
                            onChange={(e) => setVettingComment(e.target.value)}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setProcessingReqId(null);
                                setRejectMode(false);
                                setVettingComment('');
                              }}
                              className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-700 bg-slate-100 rounded-md cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleVetting(req.id, 'rejected')}
                              disabled={!vettingComment}
                              className="px-2.5 py-1 text-[10px] text-white bg-rose-500 hover:bg-rose-600 font-bold rounded-md disabled:opacity-40 cursor-pointer"
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1 border-t border-slate-200/60 pt-2 bg-slate-50/50">
                          <button
                            type="button"
                            onClick={() => handleVetting(req.id, 'approved')}
                            className="p-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[10px] text-white font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Leave
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProcessingReqId(req.id);
                              setRejectMode(true);
                            }}
                            className="p-1.5 px-3 rounded-lg bg-slate-200 hover:bg-rose-50 hover:text-rose-600 text-[10px] text-slate-600 font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <X className="w-3.5 h-3.5" /> Rejection comment
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Leave approvals status tracker */}
          {pastRequests.length > 0 && (
            <div className="border-t border-slate-150 pt-4 mt-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider inline-block mb-2 font-mono">Recent Sign-off Reviews</span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {pastRequests.slice(0, 4).map(r => {
                  const applicant = mockDB.getUsers().find(u => u.id === r.student_id);
                  let stateColor = "text-emerald-500 bg-emerald-50 border border-emerald-100";
                  if (r.status === 'rejected') stateColor = "text-rose-500 bg-rose-50 border border-rose-100";
                  return (
                    <div key={r.id} className="p-2 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between text-[11px] hover:bg-slate-100 transition">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={applicant?.avatar_url}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-extrabold text-slate-700 block truncate max-w-[120px]">{applicant?.fullname}</span>
                      </div>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${stateColor}`}>
                        {r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
