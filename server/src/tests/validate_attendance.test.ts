import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { attendanceTable, adminsTable, studentsTable } from '../db/schema';
import { type ValidateAttendanceInput } from '../schema';
import { validateAttendance } from '../handlers/validate_attendance';
import { eq } from 'drizzle-orm';

// Test data
const testAdmin = {
  nis: 'ADM001',
  email: 'admin@school.com',
  password: 'hashedpassword123',
  full_name: 'Test Admin'
};

const testStudent = {
  nis: 'STU001',
  full_name: 'Test Student',
  class_name: '10A',
  photo_url: null
};

const testAttendance = {
  date: '2024-01-15',
  status: 'izin' as const,
  validation_status: 'pending' as const,
  notes: 'Student permission for medical appointment'
};

describe('validateAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should validate attendance record successfully', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'validate',
      admin_id: admin.id
    };

    const result = await validateAttendance(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Attendance record successfully validated');
  });

  it('should reject attendance record successfully', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'reject',
      admin_id: admin.id,
      notes: 'Invalid documentation provided'
    };

    const result = await validateAttendance(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Attendance record successfully rejected');
  });

  it('should update attendance record in database correctly', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'validate',
      admin_id: admin.id,
      notes: 'Approved after review'
    };

    await validateAttendance(input);

    // Verify database changes
    const updatedAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    expect(updatedAttendance).toHaveLength(1);
    expect(updatedAttendance[0].validation_status).toBe('validated');
    expect(updatedAttendance[0].validated_by).toBe(admin.id);
    expect(updatedAttendance[0].notes).toBe('Approved after review');
    expect(updatedAttendance[0].validated_at).toBeInstanceOf(Date);
    expect(updatedAttendance[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject attendance record and update database correctly', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'reject',
      admin_id: admin.id,
      notes: 'Insufficient documentation'
    };

    await validateAttendance(input);

    // Verify database changes
    const updatedAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    expect(updatedAttendance).toHaveLength(1);
    expect(updatedAttendance[0].validation_status).toBe('rejected');
    expect(updatedAttendance[0].validated_by).toBe(admin.id);
    expect(updatedAttendance[0].notes).toBe('Insufficient documentation');
    expect(updatedAttendance[0].validated_at).toBeInstanceOf(Date);
    expect(updatedAttendance[0].updated_at).toBeInstanceOf(Date);
  });

  it('should preserve existing notes when no new notes provided', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record with existing notes
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id,
        notes: 'Original student notes'
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'validate',
      admin_id: admin.id
      // No notes provided
    };

    await validateAttendance(input);

    // Verify original notes are preserved
    const updatedAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    expect(updatedAttendance[0].notes).toBe('Original student notes');
    expect(updatedAttendance[0].validation_status).toBe('validated');
  });

  it('should fail when admin does not exist', async () => {
    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'validate',
      admin_id: 999 // Non-existent admin ID
    };

    const result = await validateAttendance(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Admin not found');
  });

  it('should fail when attendance record does not exist', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: 999, // Non-existent attendance ID
      action: 'validate',
      admin_id: admin.id
    };

    const result = await validateAttendance(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Attendance record not found');
  });

  it('should fail when attendance record is already validated', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record that's already validated
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id,
        validation_status: 'validated',
        validated_by: admin.id,
        validated_at: new Date()
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'validate',
      admin_id: admin.id
    };

    const result = await validateAttendance(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Attendance record has already been validated');
  });

  it('should fail when attendance record is already rejected', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Create attendance record that's already rejected
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id,
        validation_status: 'rejected',
        validated_by: admin.id,
        validated_at: new Date()
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'reject',
      admin_id: admin.id
    };

    const result = await validateAttendance(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Attendance record has already been rejected');
  });

  it('should handle validation with different attendance statuses', async () => {
    // Create admin
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    // Create student
    const [student] = await db.insert(studentsTable)
      .values(testStudent)
      .returning()
      .execute();

    // Test with 'sakit' status
    const [attendance] = await db.insert(attendanceTable)
      .values({
        ...testAttendance,
        student_id: student.id,
        status: 'sakit'
      })
      .returning()
      .execute();

    const input: ValidateAttendanceInput = {
      attendance_id: attendance.id,
      action: 'validate',
      admin_id: admin.id
    };

    const result = await validateAttendance(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Attendance record successfully validated');

    // Verify the status remains 'sakit' but validation_status changes
    const updatedAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, attendance.id))
      .execute();

    expect(updatedAttendance[0].status).toBe('sakit');
    expect(updatedAttendance[0].validation_status).toBe('validated');
  });
});