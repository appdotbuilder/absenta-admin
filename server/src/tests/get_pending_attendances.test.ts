import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adminsTable, studentsTable, attendanceTable } from '../db/schema';
import { getPendingAttendances } from '../handlers/get_pending_attendances';

// Test data
const testAdmin = {
  nis: 'ADM001',
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Test Admin'
};

const testStudent1 = {
  nis: 'STU001',
  full_name: 'John Doe',
  class_name: '10A',
  photo_url: 'http://example.com/photo1.jpg'
};

const testStudent2 = {
  nis: 'STU002',
  full_name: 'Jane Smith', 
  class_name: '10B',
  photo_url: null
};

describe('getPendingAttendances', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pending attendances exist', async () => {
    const result = await getPendingAttendances();
    expect(result).toEqual([]);
  });

  it('should fetch pending attendance records with student details', async () => {
    // Create test data
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    const [student1, student2] = await db.insert(studentsTable)
      .values([testStudent1, testStudent2])
      .returning()
      .execute();

    // Create attendance records - one pending, one validated
    const [pendingAttendance] = await db.insert(attendanceTable)
      .values({
        student_id: student1.id,
        date: '2024-01-15',
        status: 'izin',
        validation_status: 'pending',
        notes: 'Sick leave request'
      })
      .returning()
      .execute();

    // Create a validated attendance (should not appear in results)
    await db.insert(attendanceTable)
      .values({
        student_id: student2.id,
        date: '2024-01-15',
        status: 'hadir',
        validation_status: 'validated',
        validated_by: admin.id,
        validated_at: new Date()
      })
      .execute();

    const result = await getPendingAttendances();

    expect(result).toHaveLength(1);
    
    const attendance = result[0];
    expect(attendance.id).toEqual(pendingAttendance.id);
    expect(attendance.student.id).toEqual(student1.id);
    expect(attendance.student.nis).toEqual('STU001');
    expect(attendance.student.full_name).toEqual('John Doe');
    expect(attendance.student.class_name).toEqual('10A');
    expect(attendance.student.photo_url).toEqual('http://example.com/photo1.jpg');
    expect(attendance.date).toEqual('2024-01-15');
    expect(attendance.status).toEqual('izin');
    expect(attendance.validation_status).toEqual('pending');
    expect(attendance.notes).toEqual('Sick leave request');
    expect(attendance.created_at).toBeInstanceOf(Date);
  });

  it('should handle student with null photo_url', async () => {
    // Create test data
    const [student] = await db.insert(studentsTable)
      .values(testStudent2) // This student has photo_url: null
      .returning()
      .execute();

    await db.insert(attendanceTable)
      .values({
        student_id: student.id,
        date: '2024-01-16',
        status: 'sakit',
        validation_status: 'pending',
        notes: null
      })
      .execute();

    const result = await getPendingAttendances();

    expect(result).toHaveLength(1);
    expect(result[0].student.photo_url).toBeNull();
    expect(result[0].notes).toBeNull();
  });

  it('should order results by creation date (newest first)', async () => {
    // Create test students
    const [student1, student2] = await db.insert(studentsTable)
      .values([testStudent1, testStudent2])
      .returning()
      .execute();

    // Create first attendance record
    const [firstAttendance] = await db.insert(attendanceTable)
      .values({
        student_id: student1.id,
        date: '2024-01-15',
        status: 'izin',
        validation_status: 'pending',
        notes: 'First attendance'
      })
      .returning()
      .execute();

    // Wait a bit and create second attendance record
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const [secondAttendance] = await db.insert(attendanceTable)
      .values({
        student_id: student2.id,
        date: '2024-01-16',
        status: 'sakit',
        validation_status: 'pending',
        notes: 'Second attendance'
      })
      .returning()
      .execute();

    const result = await getPendingAttendances();

    expect(result).toHaveLength(2);
    // Should be ordered by created_at DESC (newest first)
    expect(result[0].id).toEqual(secondAttendance.id);
    expect(result[0].notes).toEqual('Second attendance');
    expect(result[1].id).toEqual(firstAttendance.id);
    expect(result[1].notes).toEqual('First attendance');
  });

  it('should only return pending attendances, not validated or rejected', async () => {
    // Create admin and student
    const [admin] = await db.insert(adminsTable)
      .values(testAdmin)
      .returning()
      .execute();

    const [student] = await db.insert(studentsTable)
      .values(testStudent1)
      .returning()
      .execute();

    // Create attendance records with different validation statuses
    await db.insert(attendanceTable)
      .values([
        {
          student_id: student.id,
          date: '2024-01-15',
          status: 'izin',
          validation_status: 'pending',
          notes: 'Should appear'
        },
        {
          student_id: student.id,
          date: '2024-01-16',
          status: 'sakit',
          validation_status: 'validated',
          validated_by: admin.id,
          validated_at: new Date(),
          notes: 'Should not appear'
        },
        {
          student_id: student.id,
          date: '2024-01-17',
          status: 'alpha',
          validation_status: 'rejected',
          validated_by: admin.id,
          validated_at: new Date(),
          notes: 'Should not appear'
        }
      ])
      .execute();

    const result = await getPendingAttendances();

    expect(result).toHaveLength(1);
    expect(result[0].validation_status).toEqual('pending');
    expect(result[0].notes).toEqual('Should appear');
  });

  it('should handle multiple pending attendances for different students', async () => {
    // Create multiple students
    const students = await db.insert(studentsTable)
      .values([
        { ...testStudent1, nis: 'STU001', class_name: '10A' },
        { ...testStudent2, nis: 'STU002', class_name: '10B' },
        { nis: 'STU003', full_name: 'Bob Wilson', class_name: '10C', photo_url: null }
      ])
      .returning()
      .execute();

    // Create pending attendance for each student
    await db.insert(attendanceTable)
      .values([
        {
          student_id: students[0].id,
          date: '2024-01-15',
          status: 'izin',
          validation_status: 'pending',
          notes: 'Student 1 attendance'
        },
        {
          student_id: students[1].id,
          date: '2024-01-15',
          status: 'sakit',
          validation_status: 'pending',
          notes: 'Student 2 attendance'
        },
        {
          student_id: students[2].id,
          date: '2024-01-15',
          status: 'alpha',
          validation_status: 'pending',
          notes: null
        }
      ])
      .execute();

    const result = await getPendingAttendances();

    expect(result).toHaveLength(3);
    
    // Verify all records have pending status
    result.forEach(attendance => {
      expect(attendance.validation_status).toEqual('pending');
      expect(attendance.student).toBeDefined();
      expect(attendance.student.full_name).toBeTruthy();
      expect(attendance.student.class_name).toBeTruthy();
    });

    // Verify we have all different students
    const studentIds = result.map(r => r.student.id);
    expect(new Set(studentIds)).toHaveProperty('size', 3);
  });
});