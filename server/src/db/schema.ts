import { serial, text, pgTable, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const attendanceStatusEnum = pgEnum('attendance_status', ['hadir', 'izin', 'sakit', 'alpha']);
export const validationStatusEnum = pgEnum('validation_status', ['pending', 'validated', 'rejected']);

// Admins table
export const adminsTable = pgTable('admins', {
  id: serial('id').primaryKey(),
  nis: text('nis').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  full_name: text('full_name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  nis: text('nis').notNull().unique(),
  full_name: text('full_name').notNull(),
  class_name: text('class_name').notNull(),
  photo_url: text('photo_url'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Attendance records table
export const attendanceTable = pgTable('attendance', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull(),
  date: text('date').notNull(), // Store as YYYY-MM-DD string for simplicity
  status: attendanceStatusEnum('status').notNull(),
  validation_status: validationStatusEnum('validation_status').default('pending').notNull(),
  notes: text('notes'), // Nullable by default
  validated_by: integer('validated_by'), // Foreign key to admins table, nullable
  validated_at: timestamp('validated_at'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const adminsRelations = relations(adminsTable, ({ many }) => ({
  validatedAttendances: many(attendanceTable),
}));

export const studentsRelations = relations(studentsTable, ({ many }) => ({
  attendances: many(attendanceTable),
}));

export const attendanceRelations = relations(attendanceTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [attendanceTable.student_id],
    references: [studentsTable.id],
  }),
  validator: one(adminsTable, {
    fields: [attendanceTable.validated_by],
    references: [adminsTable.id],
  }),
}));

// TypeScript types for the tables
export type Admin = typeof adminsTable.$inferSelect;
export type NewAdmin = typeof adminsTable.$inferInsert;

export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;

export type Attendance = typeof attendanceTable.$inferSelect;
export type NewAttendance = typeof attendanceTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  admins: adminsTable,
  students: studentsTable,
  attendance: attendanceTable,
};