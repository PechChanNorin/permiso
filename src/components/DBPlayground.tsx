/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, Code, Table, Shield, Columns, RefreshCw, Copy, Check, Search, 
  Terminal, Server, FileCode, CheckCircle2, AlertTriangle, Play 
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../services/db_schema_sql';
import { mockDB } from '../services/mock_db';

interface DBPlaygroundProps {
  onClose: () => void;
}

export default function DBPlayground({ onClose }: DBPlaygroundProps) {
  const [activeTab, setActiveTab] = useState<'sql' | 'tables' | 'rls' | 'crud'>('sql');
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [copied, setCopied] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);

  // Tables catalog
  const tables = [
    { name: 'users', desc: 'Core Auth-Linked User Registry with Role mapping' },
    { name: 'students', desc: 'Student Roster with linked Parents and Classes' },
    { name: 'classes', desc: 'Class sections with Advisor teacher links' },
    { name: 'departments', desc: 'Academic departments list' },
    { name: 'attendance', desc: 'Daily attendance logs (Present, Absent, Late)' },
    { name: 'permission_requests', desc: 'Student leave requests and approvals workflow' },
    { name: 'notifications', desc: 'Live triggers and notifications alerts' },
    { name: 'activity_logs', desc: 'Independent system activity log audits' }
  ];

  const loadTableData = () => {
    switch (selectedTable) {
      case 'users':
        setTableData(mockDB.getUsers());
        break;
      case 'students':
        setTableData(mockDB.getStudents());
        break;
      case 'classes':
        setTableData(mockDB.getClasses());
        break;
      case 'departments':
        setTableData(mockDB.getDepartments());
        break;
      case 'attendance':
        setTableData(mockDB.getAttendance());
        break;
      case 'permission_requests':
        setTableData(mockDB.getPermissionRequests());
        break;
      case 'notifications':
        setTableData(mockDB.getNotifications());
        break;
      case 'activity_logs':
        setTableData(mockDB.getActivityLogs());
        break;
      default:
        setTableData([]);
    }
  };

  useEffect(() => {
    loadTableData();
  }, [selectedTable]);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetSimulator = () => {
    if (confirm('Are you sure you want to restore default SQLite/PostgreSQL seeded data and clear active localStorage records?')) {
      localStorage.clear();
      mockDB.initialize();
      loadTableData();
      alert('Local Supabase emulation tables restored successfully!');
      window.location.reload();
    }
  };

  // Filter keys for display inside tables search
  const filteredData = tableData.filter(row => {
    if (!tableSearch) return true;
    const searchString = JSON.stringify(row).toLowerCase();
    return searchString.includes(tableSearch.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[85vh] rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Sandbox Console Header */}
        <div className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-sans font-extrabold tracking-tight text-lg">Supabase PostgreSQL Console</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">ONLINE</span>
              </div>
              <p className="text-slate-400 text-xs">Real-time developer engine representing local schema states & raw SQL migrations</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-xl border border-slate-700 hover:bg-slate-700/60 transition duration-150 cursor-pointer text-xs font-bold"
          >
            Esc Close
          </button>
        </div>

        {/* Console Navigation Tabs */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1 py-1">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-3 text-xs font-bold font-mono tracking-tight flex items-center gap-2 border-b-2 transition duration-150 ${
                activeTab === 'sql' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              schema.sql (DB Schema)
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-3 text-xs font-bold font-mono tracking-tight flex items-center gap-2 border-b-2 transition duration-150 ${
                activeTab === 'tables' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Data Explorer
            </button>
            <button
              onClick={() => setActiveTab('rls')}
              className={`px-4 py-3 text-xs font-bold font-mono tracking-tight flex items-center gap-2 border-b-2 transition duration-150 ${
                activeTab === 'rls' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              RLS Security Policies
            </button>
            <button
              onClick={() => setActiveTab('crud')}
              className={`px-4 py-3 text-xs font-bold font-mono tracking-tight flex items-center gap-2 border-b-2 transition duration-150 ${
                activeTab === 'crud' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Supabase Clients (JS/TS SDK)
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={handleResetSimulator}
              className="px-3 py-1.5 text-[11px] font-bold font-mono text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-400/40 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 animate-spin duration-3000" />
              Reset PostgreSQL Seed Database
            </button>
          </div>
        </div>

        {/* Consoles Content Panel */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 select-text">
          
          {/* TAB 1: RAW DDL SQL SCHEMA VIEWER */}
          {activeTab === 'sql' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  POSTGRESQL STRUCTURE (COMPATIBLE WITH SUPABASE SQL EDITOR)
                </span>
                <button
                  onClick={handleCopySQL}
                  className="px-3 py-1 text-[11px] font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer select-none"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied Migration Script!' : 'Copy Entire SQL Schema'}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-slate-950 text-slate-300 font-mono text-xs leading-5">
                <pre id="db-schema-sql-preview" className="whitespace-pre overflow-x-auto text-emerald-400 selection:bg-indigo-600 select-text">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE LIVE TABLE DATA EXPLORER */}
          {activeTab === 'tables' && (
            <div className="h-full grid grid-cols-1 md:grid-cols-4 overflow-hidden">
              {/* Table side selection shelf */}
              <div className="border-r border-slate-800 bg-slate-950/50 p-4 overflow-y-auto space-y-1.5">
                <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono px-2 mb-2">Relational Tables</h4>
                {tables.map(tb => (
                  <button
                    key={tb.name}
                    onClick={() => {
                      setSelectedTable(tb.name);
                      setTableSearch('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition duration-150 block group ${
                      selectedTable === tb.name 
                        ? 'bg-indigo-500/10 border border-indigo-500/40 text-indigo-300' 
                        : 'hover:bg-slate-800/40 border border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Columns className={`w-3.5 h-3.5 shrink-0 ${selectedTable === tb.name ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold font-mono">{tb.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 pl-5 truncate leading-tight group-hover:text-slate-400">{tb.desc}</p>
                  </button>
                ))}
              </div>

              {/* Live Rows Table Grid */}
              <div className="md:col-span-3 flex flex-col overflow-hidden bg-slate-900">
                {/* Filter and stats head */}
                <div className="border-b border-slate-800 bg-slate-950 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400 font-mono">Table:</span>
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-black uppercase px-2 py-0.5 rounded">
                      {selectedTable}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs text-slate-400 font-mono font-medium">{filteredData.length} records</span>
                  </div>

                  {/* Search box within dataset */}
                  <div className="relative max-w-xs w-full">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      className="w-full bg-slate-850 border border-slate-700/80 rounded-lg text-xs font-mono pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      placeholder={`Filter rows on ${selectedTable}...`}
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Spreadsheet scroll wrapper */}
                <div className="flex-1 overflow-auto max-w-full">
                  {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="text-slate-500 text-2xl mb-2">📊</div>
                      <p className="text-xs text-slate-400 font-bold font-mono">No matching records found in table</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Try resetting search or adding live data in the dashboards</p>
                    </div>
                  ) : (
                    <table className="w-full min-w-full table-auto text-left border-collapse select-text">
                      <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-xs select-none">
                        <tr className="border-b border-slate-700">
                          {Object.keys(filteredData[0]).map(col => (
                            <th key={col} className="px-4 py-2.5 text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 border-r border-slate-800 last:border-r-0">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px] font-mono whitespace-nowrap">
                        {filteredData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/30 text-slate-300 transition select-all">
                            {Object.entries(row).map(([col, val]: [string, any]) => {
                              let formattedVal = "";
                              if (val === null) {
                                formattedVal = "NULL";
                              } else if (typeof val === 'object') {
                                formattedVal = JSON.stringify(val);
                              } else {
                                formattedVal = String(val);
                              }

                              // Highlighting specific column metrics
                              const isNull = val === null;
                              const isIdCol = col.includes('id');
                              const isRole = col === 'role';

                              return (
                                <td key={col} className="px-4 py-2 border-r border-slate-800 last:border-r-0 max-w-xs truncate">
                                  {isNull ? (
                                    <span className="text-slate-600 font-bold italic">NULL</span>
                                  ) : isIdCol ? (
                                    <span className="text-amber-400 font-medium">{formattedVal}</span>
                                  ) : isRole ? (
                                    <span className="text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded shrink-0 uppercase text-[9px]">
                                      {formattedVal}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">{formattedVal}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER ROLES & ROW LEVEL SECURITY AUDITOR */}
          {activeTab === 'rls' && (
            <div className="h-full overflow-hidden p-6 flex flex-col">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-slate-200 font-sans font-bold text-base">Row Level Security (RLS) Compliance Report</h3>
                    <p className="text-slate-400 text-xs">Supabase ensures multi-tenant security by executing internal DB validation before returns</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono mt-2">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-bold">Admin Privileges</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-bold">BYPASS ALL RLS</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">Admins can fetch, update, and manage global records, classes, registrations, and system configurations with unchecked read/write permission.</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">Teacher Authorization</span>
                      <span className="bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded font-bold">CLASS LEVEL CHECK</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">Teachers can view and execute ATTENDANCE marks for their assigned class and department sections. Can review, comment, and sign off student leave requests.</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-400 font-bold">Student Isolation</span>
                      <span className="bg-violet-500/10 text-violet-400 px-1 py-0.2 rounded font-bold">AUTH.UID() RESTRICTED</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">Students are STRICTLY blocked from viewing other students' private files, absence percentages, or justifications. Can view/insert only where student_id = auth.uid()</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Supabase Policies Active Audits
                  </span>
                </div>
                <div className="flex-1 overflow-auto divide-y divide-slate-800 text-xs font-mono font-medium p-4 space-y-3">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-amber-400">POLICY: "Allow public read access to active users"</span>
                    <pre className="text-slate-400 text-[11px] mt-1 whitespace-pre">ON public.users FOR SELECT USING (true);</pre>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-emerald-400">POLICY: "Students can insert permission requests"</span>
                    <pre className="text-slate-400 text-[11px] mt-1 whitespace-pre">ON public.permission_requests FOR INSERT WITH CHECK (auth.uid() = student_id);</pre>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-indigo-400">POLICY: "Students can view their own and parent records with permissions"</span>
                    <pre className="text-slate-400 text-[11px] mt-1 whitespace-pre">{"ON public.permission_requests FOR SELECT USING (\n  auth.uid() = student_id OR EXISTS (\n    SELECT 1 FROM public.students s WHERE s.user_id = student_id AND s.parent_id = auth.uid()\n  )\n);"}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEVELOPER CRUD API EXAMPLES */}
          {activeTab === 'crud' && (
            <div className="h-full overflow-auto p-6 space-y-6">
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-5 rounded-3xl">
                <Server className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-slate-200 font-sans font-extrabold text-base">Supabase Javascript/Typescript Client Integration SDK</h3>
                  <p className="text-slate-400 text-xs">Copy these pre-configured CRUD templates directly into your React project directories</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                {/* Insertion Example */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 text-slate-300 font-bold flex justify-between items-center">
                    <span>🚀 (Student) Insert Leave Form</span>
                    <span className="text-[10.5px] text-amber-500 font-bold">typescript</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-emerald-400 text-[11px] leading-relaxed">
{`import { supabase } from '../lib/supabaseClient';

async function submitLeaveRequest(data: {
  request_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  attachment_url: string | null;
}) {
  const { data: request, error } = await supabase
    .from('permission_requests')
    .insert([{
      student_id: supabase.auth.user()?.id,
      request_type: data.request_type,
      reason: data.reason,
      start_date: data.start_date,
      end_date: data.end_date,
      attachment_url: data.attachment_url,
      status: 'pending' // Default schema value
    }]);

  if (error) throw error;
  return request;
}`}
                  </pre>
                </div>

                {/* Fetching examples */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 text-slate-300 font-bold flex justify-between items-center">
                    <span>🎒 (Teacher) Fetch Unapproved Forms with Students</span>
                    <span className="text-[10.5px] text-amber-500 font-bold">typescript</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-emerald-400 text-[11px] leading-relaxed">
{`import { supabase } from '../lib/supabaseClient';

async function getPendingRequests() {
  const { data, error } = await supabase
    .from('permission_requests')
    .select(\`
      *,
      student:student_id (
        id,
        fullname,
        avatar_url,
        students (
          student_id,
          class_id (class_name)
        )
      )
    \`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}`}
                  </pre>
                </div>

                {/* Real-time Subscriptions */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 text-slate-300 font-bold flex justify-between items-center">
                    <span>🔔 Subscribe to Real-time Notifications Channels</span>
                    <span className="text-[10.5px] text-amber-500 font-bold">typescript</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-emerald-400 text-[11px] leading-relaxed">
{`import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function useRealtimeNotifications(userId: string, callback: (payload: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: \`user_id=eq.\${userId}\`
      }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}`}
                  </pre>
                </div>

                {/* File Upload Storage Bucket config */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 text-slate-300 font-bold flex justify-between items-center">
                    <span>📁 Upload Supporting Medical Justification File</span>
                    <span className="text-[10.5px] text-amber-500 font-bold">typescript</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-emerald-400 text-[11px] leading-relaxed">
{`import { supabase } from '../lib/supabaseClient';

async function uploadMedicalProof(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = \`\${Math.random()}.\${fileExt}\`;
  const filePath = \`medical-exemptions/\${fileName}\`;

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return data.publicUrl; // Insert url into permission_requests table!
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
