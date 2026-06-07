/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, Student, Teacher, Department, Class, 
  Attendance, PermissionRequest, Notification, ActivityLog, UserRole, LeaveType
} from '../types';
import { supabase } from '../supabaseClient';

// Helper to determine if Supabase config is enabled
const isUsingSupabase = (): boolean => {
  const url = (import.meta as any).env.VITE_SUPABASE_URL;
  const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key);
};

// Storage keys
const STORAGE_KEYS = {
  USERS: 'permiso_users_v2',
  STUDENTS: 'permiso_students_v2',
  TEACHERS: 'permiso_teachers_v2',
  DEPARTMENTS: 'permiso_departments_v2',
  CLASSES: 'permiso_classes_v2',
  ATTENDANCE: 'permiso_attendance_v2',
  PERMISSION_REQUESTS: 'permiso_permission_requests_v2',
  NOTIFICATIONS: 'permiso_notifications_v2',
  ACTIVITY_LOGS: 'permiso_activity_logs_v2',
  CURRENT_USER_ID: 'permiso_current_user_v2',
};

// Seed ids
const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', department_name: 'Computer Science', description: 'Core Computing and software engineering' },
  { id: 'dept-2', department_name: 'Language Studies', description: 'Modern linguistics & academic reading' }
];

const INITIAL_USERS: User[] = [
  {
    id: "admin-1",
    fullname: "Admin",
    username: "Admin",
    email: "pechchannorin@gmail.com",
    password: "Admin123",
    role: "admin",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    phone: "+1 (555) 0199",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const INITIAL_TEACHERS: Teacher[] = [];
const INITIAL_CLASSES: Class[] = [];
const INITIAL_STUDENTS: Student[] = [];
const INITIAL_ATTENDANCE: Attendance[] = [];
const INITIAL_PERMISSION_REQUESTS: PermissionRequest[] = [];
const INITIAL_NOTIFICATIONS: Notification[] = [];
const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

export const mockDB = {
  get<T>(key: string, decoder: () => T): T {
    const data = localStorage.getItem(key);
    if (!data) {
      const defaultValue = decoder();
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    try {
      return JSON.parse(data);
    } catch {
      return decoder();
    }
  },

  save<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  initialize() {
    const WAS_RESET_KEY = 'permiso_db_wipe_v10';
    if (!localStorage.getItem(WAS_RESET_KEY)) {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(WAS_RESET_KEY, 'true');
    }

    this.getUsers();
    this.getStudents();
    this.getTeachers();
    this.getDepartments();
    this.getClasses();
    this.getAttendance();
    this.getPermissionRequests();
    this.getNotifications();
    this.getActivityLogs();
    
    // Default logged in user: First registered user if any exists
    const users = this.getUsers();
    if (users.length > 0) {
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, users[0].id);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }

    // Trigger Supabase Cloud Sync
    if (isUsingSupabase()) {
      this.syncFromSupabase();
    }
  },

  // Real-time Cloud Synchronization FROM Supabase instance
  async syncFromSupabase() {
    if (!isUsingSupabase()) return;
    try {
      console.log("Syncing database tables FROM Supabase Cloud...");
      localStorage.setItem('permiso_supabase_sync_status', 'syncing');
      
      // 1. Sync Departments
      const { data: depts, error: deptsErr } = await supabase.from('departments').select('*');
      if (!deptsErr && depts) {
        if (depts.length > 0) {
          const formattedDepts: Department[] = depts.map(d => ({
            id: d.id,
            department_name: d.department_name,
            description: d.description || ''
          }));
          this.saveDepartments(formattedDepts);
        } else {
          // Sync out local values to Cloud
          await supabase.from('departments').insert(this.getDepartments());
        }
      }

      // 2. Sync Users
      const { data: users, error: usersErr } = await supabase.from('users').select('*');
      if (!usersErr && users) {
        if (users.length > 0) {
          const formattedUsers: User[] = users.map(u => ({
            id: u.id,
            fullname: u.fullname,
            email: u.email,
            role: u.role as UserRole,
            avatar_url: u.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
            phone: u.phone || '+1 (555) 9999',
            status: (u.status as 'active' | 'inactive') || 'active',
            created_at: u.created_at || new Date().toISOString(),
            updated_at: u.updated_at || new Date().toISOString()
          }));
          this.saveUsers(formattedUsers);
        } else {
          const localUsers = this.getUsers().map(u => ({
            id: u.id,
            fullname: u.fullname,
            email: u.email,
            role: u.role,
            avatar_url: u.avatar_url,
            phone: u.phone,
            status: u.status
          }));
          await supabase.from('users').insert(localUsers);
        }
      }

      // 3. Sync Teachers
      const { data: teachers, error: teachersErr } = await supabase.from('teachers').select('*');
      if (!teachersErr && teachers) {
        if (teachers.length > 0) {
          const formattedTeachers: Teacher[] = teachers.map(t => ({
            id: t.id,
            user_id: t.user_id,
            department_id: t.department_id || '',
            specialization: t.specialization || ''
          }));
          this.saveTeachers(formattedTeachers);
        } else {
          const localTeachers = this.getTeachers();
          if (localTeachers.length > 0) {
            await supabase.from('teachers').insert(localTeachers);
          }
        }
      }

      // 4. Sync Classes
      const { data: classes, error: classesErr } = await supabase.from('classes').select('*');
      if (!classesErr && classes) {
        if (classes.length > 0) {
          const formattedClasses: Class[] = classes.map(c => ({
            id: c.id,
            class_name: c.class_name,
            department_id: c.department_id,
            advisor_teacher_id: c.advisor_teacher_id || '',
            academic_year: c.academic_year
          }));
          this.saveClasses(formattedClasses);
        } else {
          const localClasses = this.getClasses();
          if (localClasses.length > 0) {
            await supabase.from('classes').insert(localClasses);
          }
        }
      }

      // 5. Sync Students
      const { data: students, error: studentsErr } = await supabase.from('students').select('*');
      if (!studentsErr && students) {
        if (students.length > 0) {
          const formattedStudents: Student[] = students.map(s => ({
            id: s.id,
            user_id: s.user_id,
            student_id: s.student_id,
            class_id: s.class_id || '',
            department_id: s.department_id || '',
            enrollment_year: s.enrollment_year,
            status: s.status as 'active' | 'suspended' | 'graduated'
          }));
          this.saveStudents(formattedStudents);
        } else {
          const localStudents = this.getStudents();
          if (localStudents.length > 0) {
            await supabase.from('students').insert(localStudents);
          }
        }
      }

      // 6. Sync Attendance
      const { data: attendance, error: attendanceErr } = await supabase.from('attendance').select('*');
      if (!attendanceErr && attendance) {
        if (attendance.length > 0) {
          const formattedAttendance: Attendance[] = attendance.map(a => ({
            id: a.id,
            student_id: a.student_id,
            class_id: a.class_id,
            attendance_date: a.attendance_date,
            status: a.status as 'present' | 'absent' | 'late',
            checked_by: a.checked_by || '',
            remarks: a.remarks || '',
            created_at: a.created_at || new Date().toISOString()
          }));
          this.saveAttendance(formattedAttendance);
        } else {
          const localAttendance = this.getAttendance();
          if (localAttendance.length > 0) {
            const mapped = localAttendance.map(a => ({
              id: a.id,
              student_id: a.student_id,
              class_id: a.class_id,
              attendance_date: a.attendance_date,
              status: a.status,
              checked_by: a.checked_by || null,
              remarks: a.remarks || null
            }));
            await supabase.from('attendance').insert(mapped);
          }
        }
      }

      // 7. Sync Permission Requests
      const { data: permission_requests, error: reqsErr } = await supabase.from('permission_requests').select('*');
      if (!reqsErr && permission_requests) {
        if (permission_requests.length > 0) {
          const formattedRequests: PermissionRequest[] = permission_requests.map(r => ({
            id: r.id,
            student_id: r.student_id,
            request_type: r.request_type as LeaveType,
            reason: r.reason,
            attachment_url: r.attachment_url,
            start_date: r.start_date,
            end_date: r.end_date,
            status: r.status as 'pending' | 'approved' | 'rejected',
            approved_by: r.approved_by,
            rejection_reason: r.rejection_reason,
            created_at: r.created_at || new Date().toISOString()
          }));
          this.savePermissionRequests(formattedRequests);
        } else {
          const localRequests = this.getPermissionRequests();
          if (localRequests.length > 0) {
            await supabase.from('permission_requests').insert(localRequests);
          }
        }
      }

      // 8. Sync Notifications
      const { data: notifications, error: notifErr } = await supabase.from('notifications').select('*');
      if (!notifErr && notifications) {
        if (notifications.length > 0) {
          const formattedNotifications: Notification[] = notifications.map(n => ({
            id: n.id,
            user_id: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type as 'info' | 'success' | 'warning' | 'alert',
            is_read: n.is_read,
            created_at: n.created_at || new Date().toISOString()
          }));
          this.saveNotifications(formattedNotifications);
        } else {
          const localNotifs = this.getNotifications();
          if (localNotifs.length > 0) {
            await supabase.from('notifications').insert(localNotifs);
          }
        }
      }

      // 9. Sync Activity Logs
      const { data: activity_logs, error: logsErr } = await supabase.from('activity_logs').select('*');
      if (!logsErr && activity_logs) {
        if (activity_logs.length > 0) {
          const formattedLogs: ActivityLog[] = activity_logs.map(l => ({
            id: l.id,
            user_id: l.user_id || '',
            action: l.action,
            description: l.description,
            created_at: l.created_at || new Date().toISOString()
          }));
          this.saveActivityLogs(formattedLogs);
        } else {
          const localLogs = this.getActivityLogs();
          if (localLogs.length > 0) {
            const mapped = localLogs.map(l => ({
              id: l.id,
              user_id: l.user_id || null,
              action: l.action,
              description: l.description
            }));
            await supabase.from('activity_logs').insert(mapped);
          }
        }
      }

      console.log("Supabase Cloud Sync Successful!");
      localStorage.setItem('permiso_supabase_sync_status', 'synced');
      localStorage.setItem('permiso_supabase_sync_time', new Date().toISOString());
    } catch (err) {
      console.error("Supabase Sync Failed, using local cache:", err);
      localStorage.setItem('permiso_supabase_sync_status', 'error');
    }
  },

  // Users
  getUsers(): User[] {
    return this.get(STORAGE_KEYS.USERS, () => INITIAL_USERS);
  },
  saveUsers(users: User[]) {
    this.save(STORAGE_KEYS.USERS, users);
  },

  // Students
  getStudents(): Student[] {
    return this.get(STORAGE_KEYS.STUDENTS, () => INITIAL_STUDENTS);
  },
  saveStudents(students: Student[]) {
    this.save(STORAGE_KEYS.STUDENTS, students);
  },

  // Teachers
  getTeachers(): Teacher[] {
    return this.get(STORAGE_KEYS.TEACHERS, () => INITIAL_TEACHERS);
  },
  saveTeachers(teachers: Teacher[]) {
    this.save(STORAGE_KEYS.TEACHERS, teachers);
  },

  // Departments
  getDepartments(): Department[] {
    return this.get(STORAGE_KEYS.DEPARTMENTS, () => INITIAL_DEPARTMENTS);
  },
  saveDepartments(depts: Department[]) {
    this.save(STORAGE_KEYS.DEPARTMENTS, depts);
  },

  // Classes
  getClasses(): Class[] {
    return this.get(STORAGE_KEYS.CLASSES, () => INITIAL_CLASSES);
  },
  saveClasses(classes: Class[]) {
    this.save(STORAGE_KEYS.CLASSES, classes);
  },

  // Attendance
  getAttendance(): Attendance[] {
    return this.get(STORAGE_KEYS.ATTENDANCE, () => INITIAL_ATTENDANCE);
  },
  saveAttendance(attendance: Attendance[]) {
    this.save(STORAGE_KEYS.ATTENDANCE, attendance);
  },

  // Permission Requests
  getPermissionRequests(): PermissionRequest[] {
    return this.get(STORAGE_KEYS.PERMISSION_REQUESTS, () => INITIAL_PERMISSION_REQUESTS);
  },
  savePermissionRequests(reqs: PermissionRequest[]) {
    this.save(STORAGE_KEYS.PERMISSION_REQUESTS, reqs);
  },

  // Notifications
  getNotifications(): Notification[] {
    return this.get(STORAGE_KEYS.NOTIFICATIONS, () => INITIAL_NOTIFICATIONS);
  },
  saveNotifications(notifs: Notification[]) {
    this.save(STORAGE_KEYS.NOTIFICATIONS, notifs);
    
    // Background update read statuses in Supabase
    if (isUsingSupabase()) {
      notifs.forEach(notif => {
        supabase.from('notifications')
          .update({ is_read: notif.is_read })
          .eq('id', notif.id)
          .then();
      });
    }
  },

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    return this.get(STORAGE_KEYS.ACTIVITY_LOGS, () => INITIAL_ACTIVITY_LOGS);
  },
  saveActivityLogs(logs: ActivityLog[]) {
    this.save(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  },

  // Log action helper
  logActivity(userId: string, action: string, description: string) {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      user_id: userId,
      action,
      description,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.saveActivityLogs(logs);

    if (isUsingSupabase()) {
      supabase.from('activity_logs').insert({
        id: newLog.id,
        user_id: userId || null,
        action,
        description
      }).then();
    }
  },

  // Add Notification helper
  notifyUser(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') {
    const notifs = this.getNotifications();
    const newNotif: Notification = {
      id: `not-${Date.now()}`,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    this.saveNotifications(notifs);

    if (isUsingSupabase()) {
      supabase.from('notifications').insert({
        id: newNotif.id,
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      }).then();
    }
  },

  // Authentication Simulate
  getCurrentUser(): User | null {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;
    const users = this.getUsers();
    return users.find(u => u.id === currentId) || null;
  },

  setCurrentUser(userId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  },

  login(emailOrUsername: string, passwordInput: string): User | null {
    const users = this.getUsers();
    const found = users.find(u => 
      (u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
       (u.username && u.username.toLowerCase() === emailOrUsername.toLowerCase())) &&
      (!u.password || u.password === passwordInput)
    );
    if (found) {
      this.setCurrentUser(found.id);
      this.logActivity(found.id, 'USER_LOGIN', `Logged in successfully as ${found.fullname}`);
      return found;
    }
    return null;
  },

  registerUser(fullName: string, email: string, role: UserRole, extra: {
    username?: string;
    password?: string;
    phone?: string;
    student_id?: string;
    class_id?: string;
    specialization?: string;
    department_id?: string;
    customId?: string;
  }): User {
    const users = this.getUsers();
    
    // Check duplication
    const exist = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exist) {
      throw new Error('Email already registered inside Permiso databases');
    }

    const newUserId = extra.customId || `user-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      fullname: fullName,
      email,
      username: extra.username || fullName,
      password: extra.password || 'Admin123',
      role,
      avatar_url: `https://images.unsplash.com/photo-${role === 'student' ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?w=150`,
      phone: extra.phone || '+1 (555) 9999',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    let newStudent: Student | null = null;
    let newTeacher: Teacher | null = null;

    if (role === 'student') {
      const students = this.getStudents();
      newStudent = {
        id: `student-${Date.now()}`,
        user_id: newUserId,
        student_id: extra.student_id || `STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        class_id: extra.class_id || (this.getClasses()[0]?.id || ''),
        department_id: extra.department_id || (this.getDepartments()[0]?.id || ''),
        enrollment_year: new Date().getFullYear(),
        status: 'active'
      };
      students.push(newStudent);
      this.saveStudents(students);
    } else if (role === 'teacher') {
      const teachers = this.getTeachers();
      newTeacher = {
        id: `teacher-${Date.now()}`,
        user_id: newUserId,
        department_id: extra.department_id || (this.getDepartments()[0]?.id || ''),
        specialization: extra.specialization || 'General Studies'
      };
      teachers.push(newTeacher);
      this.saveTeachers(teachers);
    }

    this.logActivity(newUserId, 'USER_REGISTER', `Created new ${role} account: ${fullName}`);

    if (isUsingSupabase()) {
      // Background push user information
      supabase.from('users').insert({
        id: newUserId,
        fullname: fullName,
        email: email,
        role: role,
        avatar_url: newUser.avatar_url,
        phone: newUser.phone,
        status: 'active'
      }).then(() => {
        if (role === 'student' && newStudent) {
          supabase.from('students').insert({
            id: newStudent.id,
            user_id: newUserId,
            student_id: newStudent.student_id,
            class_id: newStudent.class_id || null,
            department_id: newStudent.department_id || null,
            enrollment_year: newStudent.enrollment_year,
            status: 'active'
          }).then();
        } else if (role === 'teacher' && newTeacher) {
          supabase.from('teachers').insert({
            id: newTeacher.id,
            user_id: newUserId,
            department_id: newTeacher.department_id || null,
            specialization: newTeacher.specialization
          }).then();
        }
      });
    }

    return newUser;
  },

  updateUserRole(userId: string, newRole: UserRole, adminId: string) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User account not found');
    const oldRole = user.role;
    user.role = newRole;
    user.updated_at = new Date().toISOString();
    this.saveUsers(users);

    const generatedStudentId = `student-${Date.now()}`;
    const formattedStudentNumber = `STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const targetClassId = this.getClasses()[0]?.id || '';
    const targetDeptId = this.getDepartments()[0]?.id || '';

    const generatedTeacherId = `teacher-${Date.now()}`;

    // Sync sub-tables
    if (newRole === 'student') {
      const teachers = this.getTeachers().filter(t => t.user_id !== userId);
      this.saveTeachers(teachers);

      const students = this.getStudents();
      if (!students.some(s => s.user_id === userId)) {
        students.push({
          id: generatedStudentId,
          user_id: userId,
          student_id: formattedStudentNumber,
          class_id: targetClassId,
          department_id: targetDeptId,
          enrollment_year: new Date().getFullYear(),
          status: 'active'
        });
        this.saveStudents(students);
      }
    } else if (newRole === 'teacher') {
      const students = this.getStudents().filter(s => s.user_id !== userId);
      this.saveStudents(students);

      const teachers = this.getTeachers();
      if (!teachers.some(t => t.user_id === userId)) {
        teachers.push({
          id: generatedTeacherId,
          user_id: userId,
          department_id: targetDeptId,
          specialization: 'General Studies'
        });
        this.saveTeachers(teachers);
      }
    } else if (newRole === 'admin') {
      const students = this.getStudents().filter(s => s.user_id !== userId);
      this.saveStudents(students);
      const teachers = this.getTeachers().filter(t => t.user_id !== userId);
      this.saveTeachers(teachers);
    }

    this.logActivity(adminId, 'UPDATE_ROLE', `Modified role of ${user.fullname} from ${oldRole} to ${newRole}`);

    if (isUsingSupabase()) {
      supabase.from('users').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId).then(() => {
        if (newRole === 'student') {
          supabase.from('teachers').delete().eq('user_id', userId).then();
          supabase.from('students').upsert({
            id: generatedStudentId,
            user_id: userId,
            student_id: formattedStudentNumber,
            class_id: targetClassId || null,
            department_id: targetDeptId || null,
            enrollment_year: new Date().getFullYear(),
            status: 'active'
          }).then();
        } else if (newRole === 'teacher') {
          supabase.from('students').delete().eq('user_id', userId).then();
          supabase.from('teachers').upsert({
            id: generatedTeacherId,
            user_id: userId,
            department_id: targetDeptId || null,
            specialization: 'General Studies'
          }).then();
        } else {
          supabase.from('students').delete().eq('user_id', userId).then();
          supabase.from('teachers').delete().eq('user_id', userId).then();
        }
      });
    }
  },

  // Business actions
  submitPermissionRequest(studentUserId: string, data: {
    requestType: LeaveType;
    reason: string;
    startDate: string;
    endDate: string;
    attachmentUrl: string | null;
  }): PermissionRequest {
    const reqs = this.getPermissionRequests();
    const newReq: PermissionRequest = {
      id: `req-${Date.now()}`,
      student_id: studentUserId,
      request_type: data.requestType,
      reason: data.reason,
      attachment_url: data.attachmentUrl,
      start_date: data.startDate,
      end_date: data.endDate,
      status: 'pending',
      approved_by: null,
      rejection_reason: null,
      created_at: new Date().toISOString()
    };

    reqs.unshift(newReq);
    this.savePermissionRequests(reqs);

    const studentUser = this.getUsers().find(u => u.id === studentUserId);
    const studentInfo = this.getStudents().find(s => s.user_id === studentUserId);
    const classInfo = studentInfo ? this.getClasses().find(c => c.id === studentInfo.class_id) : null;
    const teachers = this.getTeachers();
    const advisorId = classInfo ? classInfo.advisor_teacher_id : (teachers[0]?.user_id || '');

    // Notify advisor teacher
    this.notifyUser(
      advisorId,
      'New Leave Request Filed',
      `${studentUser?.fullname || 'A student'} submitted a leave request for ${data.requestType} verification.`,
      'info'
    );

    this.logActivity(studentUserId, 'SUBMIT_PERMISSION', `Submitted leave request from ${data.startDate} to ${data.endDate}.`);

    if (isUsingSupabase()) {
      supabase.from('permission_requests').insert({
        id: newReq.id,
        student_id: studentUserId,
        request_type: data.requestType,
        reason: data.reason,
        attachment_url: data.attachmentUrl,
        start_date: data.startDate,
        end_date: data.endDate,
        status: 'pending'
      }).then();
    }

    return newReq;
  },

  processPermissionRequest(reqId: string, processorId: string, status: 'approved' | 'rejected', comment?: string): PermissionRequest {
    const reqs = this.getPermissionRequests();
    const index = reqs.findIndex(r => r.id === reqId);
    if (index === -1) throw new Error('Permission form not found in databases');

    const req = reqs[index];
    req.status = status;
    req.approved_by = processorId;
    req.rejection_reason = status === 'rejected' ? (comment || 'Rejected by staff authority') : null;
    
    reqs[index] = req;
    this.savePermissionRequests(reqs);

    const studentUser = this.getUsers().find(u => u.id === req.student_id);
    const studentInfo = this.getStudents().find(s => s.user_id === req.student_id);
    const staffUser = this.getUsers().find(u => u.id === processorId);

    // Notify Student
    this.notifyUser(
      req.student_id,
      `Leave Request ${status.toUpperCase()}`,
      `Your request for ${req.request_type} (${req.start_date}) was ${status} by ${staffUser?.fullname || 'staff'}.${status === 'rejected' ? ' Reason: ' + comment : ''}`,
      status === 'approved' ? 'success' : 'warning'
    );

    if (studentInfo) {
      if (status === 'approved') {
        const attendance = this.getAttendance();
        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const existAttIdx = attendance.findIndex(a => a.student_id === req.student_id && a.attendance_date === dateStr);
          const generatedAttId = `att-${Date.now()}-${Math.random()}`;

          if (existAttIdx !== -1) {
            attendance[existAttIdx].status = 'present';
            attendance[existAttIdx].remarks = `Excused Absence Approved (${req.request_type})`;
            attendance[existAttIdx].checked_by = processorId;
          } else {
            attendance.push({
              id: generatedAttId,
              student_id: req.student_id,
              class_id: studentInfo.class_id,
              attendance_date: dateStr,
              status: 'present',
              checked_by: processorId,
              remarks: `Excused Absence Approved (${req.request_type})`,
              created_at: new Date().toISOString()
            });
          }

          if (isUsingSupabase()) {
            supabase.from('attendance').upsert({
              student_id: req.student_id,
              class_id: studentInfo.class_id,
              attendance_date: dateStr,
              status: 'present',
              checked_by: processorId,
              remarks: `Excused Absence Approved (${req.request_type})`
            }).then();
          }
        }
        this.saveAttendance(attendance);
      }
    }

    this.logActivity(processorId, `${status.toUpperCase()}_PERMISSION`, `${status} request ${reqId} for student ${studentUser?.fullname || 'Student'}`);

    if (isUsingSupabase()) {
      supabase.from('permission_requests').update({
        status,
        approved_by: processorId,
        rejection_reason: status === 'rejected' ? (comment || null) : null
      }).eq('id', reqId).then();
    }

    return req;
  },

  updateAttendance(records: { student_id: string; class_id: string; date: string; status: 'present' | 'absent' | 'late'; remarks: string }[], teacherId: string) {
    const attendance = this.getAttendance();
    
    records.forEach(rec => {
      const idx = attendance.findIndex(a => a.student_id === rec.student_id && a.attendance_date === rec.date);
      const generatedId = `att-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

      if (idx !== -1) {
        attendance[idx].status = rec.status;
        attendance[idx].remarks = rec.remarks;
        attendance[idx].checked_by = teacherId;
      } else {
        attendance.push({
          id: generatedId,
          student_id: rec.student_id,
          class_id: rec.class_id,
          attendance_date: rec.date,
          status: rec.status,
          checked_by: teacherId,
          remarks: rec.remarks,
          created_at: new Date().toISOString()
        });
      }

      if (isUsingSupabase()) {
        supabase.from('attendance').upsert({
          student_id: rec.student_id,
          class_id: rec.class_id,
          attendance_date: rec.date,
          status: rec.status,
          checked_by: teacherId,
          remarks: rec.remarks
        }).then();
      }
    });

    this.saveAttendance(attendance);
    this.logActivity(teacherId, 'MARK_ATTENDANCE', `Updated class attendance roster for date ${records[0]?.date || 'today'}.`);
  },

  deleteUser(userId: string, adminId: string) {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);

    const students = this.getStudents().filter(s => s.user_id !== userId);
    this.saveStudents(students);

    const teachers = this.getTeachers().filter(t => t.user_id !== userId);
    this.saveTeachers(teachers);

    this.logActivity(adminId, 'DELETE_USER', `Permanently removed user account ${userId} from database tables.`);

    if (isUsingSupabase()) {
      supabase.from('users').delete().eq('id', userId).then();
    }
  },

  createClass(className: string, departmentId: string, advisorTeacherId: string, academicYear: string, adminId: string): Class {
    const classes = this.getClasses();
    const newClass: Class = {
      id: `class-${Date.now()}`,
      class_name: className,
      department_id: departmentId,
      advisor_teacher_id: advisorTeacherId,
      academic_year: academicYear
    };
    classes.push(newClass);
    this.saveClasses(classes);
    this.logActivity(adminId, 'CREATE_CLASS', `Created class section ${className} with academic year ${academicYear}.`);

    if (isUsingSupabase()) {
      supabase.from('classes').insert({
        id: newClass.id,
        class_name: className,
        department_id: departmentId,
        advisor_teacher_id: advisorTeacherId || null,
        academic_year: academicYear
      }).then();
    }

    return newClass;
  },

  createDepartment(deptName: string, description: string, adminId: string): Department {
    const depts = this.getDepartments();
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      department_name: deptName,
      description
    };
    depts.push(newDept);
    this.saveDepartments(depts);
    this.logActivity(adminId, 'CREATE_DEPARTMENT', `Created academic department: ${deptName}.`);

    if (isUsingSupabase()) {
      supabase.from('departments').insert({
        id: newDept.id,
        department_name: deptName,
        description
      }).then();
    }

    return newDept;
  },

  // Database helper analytics
  getAttendanceStats(studentUserId?: string) {
    const attendance = this.getAttendance();
    const targetAtt = studentUserId ? attendance.filter(a => a.student_id === studentUserId) : attendance;
    
    const present = targetAtt.filter(a => a.status === 'present').length;
    const absent = targetAtt.filter(a => a.status === 'absent').length;
    const late = targetAtt.filter(a => a.status === 'late').length;
    const total = targetAtt.length;

    const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;
    
    return { present, absent, late, total, rate };
  }
};

