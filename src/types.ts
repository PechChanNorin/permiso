/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  fullname: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  avatar_url: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  student_id: string; // e.g. STU-2026-001
  class_id: string;
  department_id: string;
  enrollment_year: number;
  status: 'active' | 'suspended' | 'graduated';
}

export interface Teacher {
  id: string;
  user_id: string;
  department_id: string;
  specialization: string;
}

export interface Department {
  id: string;
  department_name: string;
  description: string;
}

export interface Class {
  id: string;
  class_name: string;
  department_id: string;
  advisor_teacher_id: string;
  academic_year: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  attendance_date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
  checked_by: string; // user_id of teacher
  remarks: string;
  created_at: string;
}

export type LeaveType = 'sickness' | 'compassionate' | 'family_activity' | 'school_duty' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface PermissionRequest {
  id: string;
  student_id: string;
  request_type: LeaveType;
  reason: string;
  attachment_url: string | null;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  approved_by: string | null; // user_id of teacher or admin
  rejection_reason: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string;
  created_at: string;
}
