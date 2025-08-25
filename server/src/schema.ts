import { z } from 'zod';

// Admin schema
export const adminSchema = z.object({
  id: z.number(),
  nis: z.string(),
  email: z.string().email(),
  password: z.string(),
  full_name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Admin = z.infer<typeof adminSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  nis: z.string(),
  full_name: z.string(),
  class_name: z.string(),
  photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Attendance status enum
export const attendanceStatusSchema = z.enum(['hadir', 'izin', 'sakit', 'alpha']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

// Validation status enum
export const validationStatusSchema = z.enum(['pending', 'validated', 'rejected']);
export type ValidationStatus = z.infer<typeof validationStatusSchema>;

// Attendance record schema
export const attendanceSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  date: z.string(), // YYYY-MM-DD format
  status: attendanceStatusSchema,
  validation_status: validationStatusSchema,
  notes: z.string().nullable(),
  validated_by: z.number().nullable(),
  validated_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Attendance = z.infer<typeof attendanceSchema>;

// Input schemas for admin login
export const adminLoginInputSchema = z.object({
  identifier: z.string(), // Can be NIS or email
  password: z.string().min(1, 'Password is required')
});

export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

// Admin login response schema
export const adminLoginResponseSchema = z.object({
  success: z.boolean(),
  admin: adminSchema.omit({ password: true }).optional(),
  message: z.string().optional()
});

export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;

// Dashboard statistics schema
export const dashboardStatsSchema = z.object({
  pending_validations: z.number(),
  today_stats: z.object({
    hadir: z.number(),
    izin: z.number(),
    sakit: z.number(),
    alpha: z.number(),
    total: z.number()
  })
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Attendance with student details for validation interface
export const attendanceWithStudentSchema = z.object({
  id: z.number(),
  student: z.object({
    id: z.number(),
    nis: z.string(),
    full_name: z.string(),
    class_name: z.string(),
    photo_url: z.string().nullable()
  }),
  date: z.string(),
  status: attendanceStatusSchema,
  validation_status: validationStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type AttendanceWithStudent = z.infer<typeof attendanceWithStudentSchema>;

// Input schema for attendance validation action
export const validateAttendanceInputSchema = z.object({
  attendance_id: z.number(),
  action: z.enum(['validate', 'reject']),
  admin_id: z.number(),
  notes: z.string().optional()
});

export type ValidateAttendanceInput = z.infer<typeof validateAttendanceInputSchema>;

// Input schema for export report
export const exportReportInputSchema = z.object({
  class_name: z.string().optional(), // Optional filter by class
  start_date: z.string(), // YYYY-MM-DD format
  end_date: z.string(), // YYYY-MM-DD format
  format: z.enum(['excel']).default('excel')
});

export type ExportReportInput = z.infer<typeof exportReportInputSchema>;

// Export report response schema
export const exportReportResponseSchema = z.object({
  success: z.boolean(),
  download_url: z.string().optional(),
  message: z.string().optional()
});

export type ExportReportResponse = z.infer<typeof exportReportResponseSchema>;

// Absence summary by class schema for reports
export const absenceSummarySchema = z.object({
  class_name: z.string(),
  student_name: z.string(),
  nis: z.string(),
  total_absences: z.number(),
  breakdown: z.object({
    izin: z.number(),
    sakit: z.number(),
    alpha: z.number()
  })
});

export type AbsenceSummary = z.infer<typeof absenceSummarySchema>;