import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { attendanceTable, studentsTable, adminsTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats when no data exists', async () => {
    const result = await getDashboardStats();

    expect(result.pending_validations).toEqual(0);
    expect(result.today_stats.hadir).toEqual(0);
    expect(result.today_stats.izin).toEqual(0);
    expect(result.today_stats.sakit).toEqual(0);
    expect(result.today_stats.alpha).toEqual(0);
    expect(result.today_stats.total).toEqual(0);
  });

  it('should count pending validations correctly', async () => {
    // Create a test student first
    const studentResult = await db.insert(studentsTable)
      .values({
        nis: '12345',
        full_name: 'Test Student',
        class_name: '10A'
      })
      .returning()
      .execute();
    
    const studentId = studentResult[0].id;
    const today = new Date().toISOString().split('T')[0];

    // Create attendance records with different validation statuses
    await db.insert(attendanceTable).values([
      {
        student_id: studentId,
        date: today,
        status: 'hadir',
        validation_status: 'pending'
      },
      {
        student_id: studentId,
        date: today,
        status: 'izin',
        validation_status: 'pending'
      },
      {
        student_id: studentId,
        date: today,
        status: 'sakit',
        validation_status: 'validated'
      },
      {
        student_id: studentId,
        date: today,
        status: 'alpha',
        validation_status: 'rejected'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.pending_validations).toEqual(2);
  });

  it('should calculate today\'s attendance stats correctly', async () => {
    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        nis: '12345',
        full_name: 'Test Student',
        class_name: '10A'
      })
      .returning()
      .execute();
    
    const studentId = studentResult[0].id;
    const today = new Date().toISOString().split('T')[0];

    // Create attendance records for today
    await db.insert(attendanceTable).values([
      {
        student_id: studentId,
        date: today,
        status: 'hadir',
        validation_status: 'validated'
      },
      {
        student_id: studentId,
        date: today,
        status: 'hadir',
        validation_status: 'pending'
      },
      {
        student_id: studentId,
        date: today,
        status: 'izin',
        validation_status: 'validated'
      },
      {
        student_id: studentId,
        date: today,
        status: 'sakit',
        validation_status: 'pending'
      },
      {
        student_id: studentId,
        date: today,
        status: 'alpha',
        validation_status: 'rejected'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.today_stats.hadir).toEqual(2);
    expect(result.today_stats.izin).toEqual(1);
    expect(result.today_stats.sakit).toEqual(1);
    expect(result.today_stats.alpha).toEqual(1);
    expect(result.today_stats.total).toEqual(5);
  });

  it('should not include yesterday\'s records in today\'s stats', async () => {
    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        nis: '12345',
        full_name: 'Test Student',
        class_name: '10A'
      })
      .returning()
      .execute();
    
    const studentId = studentResult[0].id;
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Create attendance records for today and yesterday
    await db.insert(attendanceTable).values([
      // Today's records
      {
        student_id: studentId,
        date: today,
        status: 'hadir',
        validation_status: 'validated'
      },
      {
        student_id: studentId,
        date: today,
        status: 'izin',
        validation_status: 'pending'
      },
      // Yesterday's records (should not be counted in today's stats)
      {
        student_id: studentId,
        date: yesterdayStr,
        status: 'hadir',
        validation_status: 'validated'
      },
      {
        student_id: studentId,
        date: yesterdayStr,
        status: 'sakit',
        validation_status: 'pending'
      }
    ]).execute();

    const result = await getDashboardStats();

    // Should only count today's records
    expect(result.today_stats.hadir).toEqual(1);
    expect(result.today_stats.izin).toEqual(1);
    expect(result.today_stats.sakit).toEqual(0);
    expect(result.today_stats.alpha).toEqual(0);
    expect(result.today_stats.total).toEqual(2);
    
    // Should count all pending validations regardless of date
    expect(result.pending_validations).toEqual(2);
  });

  it('should handle multiple students correctly', async () => {
    // Create multiple test students
    const students = await db.insert(studentsTable).values([
      {
        nis: '12345',
        full_name: 'Student One',
        class_name: '10A'
      },
      {
        nis: '12346',
        full_name: 'Student Two',
        class_name: '10B'
      },
      {
        nis: '12347',
        full_name: 'Student Three',
        class_name: '10A'
      }
    ]).returning().execute();

    const today = new Date().toISOString().split('T')[0];

    // Create attendance records for multiple students
    await db.insert(attendanceTable).values([
      // Student 1
      {
        student_id: students[0].id,
        date: today,
        status: 'hadir',
        validation_status: 'validated'
      },
      // Student 2
      {
        student_id: students[1].id,
        date: today,
        status: 'izin',
        validation_status: 'pending'
      },
      // Student 3
      {
        student_id: students[2].id,
        date: today,
        status: 'sakit',
        validation_status: 'pending'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.today_stats.hadir).toEqual(1);
    expect(result.today_stats.izin).toEqual(1);
    expect(result.today_stats.sakit).toEqual(1);
    expect(result.today_stats.alpha).toEqual(0);
    expect(result.today_stats.total).toEqual(3);
    expect(result.pending_validations).toEqual(2);
  });

  it('should return correct structure even with no today records but pending validations exist', async () => {
    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        nis: '12345',
        full_name: 'Test Student',
        class_name: '10A'
      })
      .returning()
      .execute();
    
    const studentId = studentResult[0].id;
    
    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Create attendance record for yesterday with pending validation
    await db.insert(attendanceTable).values({
      student_id: studentId,
      date: yesterdayStr,
      status: 'hadir',
      validation_status: 'pending'
    }).execute();

    const result = await getDashboardStats();

    // Should have pending validation but no today stats
    expect(result.pending_validations).toEqual(1);
    expect(result.today_stats.hadir).toEqual(0);
    expect(result.today_stats.izin).toEqual(0);
    expect(result.today_stats.sakit).toEqual(0);
    expect(result.today_stats.alpha).toEqual(0);
    expect(result.today_stats.total).toEqual(0);
  });
});