import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, attendanceTable } from '../db/schema';
import { getAbsenceSummary } from '../handlers/get_absence_summary';

describe('getAbsenceSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return absence summary for all students', async () => {
    // Create test students
    const students = await db.insert(studentsTable)
      .values([
        { nis: '12001', full_name: 'Alice Johnson', class_name: '10A' },
        { nis: '12002', full_name: 'Bob Smith', class_name: '10B' },
        { nis: '12003', full_name: 'Charlie Brown', class_name: '10A' }
      ])
      .returning()
      .execute();

    // Create attendance records with various absence types
    await db.insert(attendanceTable)
      .values([
        // Alice's absences
        { student_id: students[0].id, date: '2024-01-15', status: 'izin' },
        { student_id: students[0].id, date: '2024-01-16', status: 'sakit' },
        { student_id: students[0].id, date: '2024-01-17', status: 'alpha' },
        { student_id: students[0].id, date: '2024-01-18', status: 'hadir' }, // Should be excluded
        
        // Bob's absences
        { student_id: students[1].id, date: '2024-01-15', status: 'izin' },
        { student_id: students[1].id, date: '2024-01-16', status: 'izin' },
        
        // Charlie's absences
        { student_id: students[2].id, date: '2024-01-15', status: 'sakit' },
        { student_id: students[2].id, date: '2024-01-16', status: 'sakit' },
        { student_id: students[2].id, date: '2024-01-17', status: 'sakit' }
      ])
      .execute();

    const result = await getAbsenceSummary();

    expect(result).toHaveLength(3);

    // Alice's summary
    const aliceSummary = result.find(s => s.nis === '12001');
    expect(aliceSummary).toBeDefined();
    expect(aliceSummary!.student_name).toBe('Alice Johnson');
    expect(aliceSummary!.class_name).toBe('10A');
    expect(aliceSummary!.total_absences).toBe(3);
    expect(aliceSummary!.breakdown).toEqual({
      izin: 1,
      sakit: 1,
      alpha: 1
    });

    // Bob's summary
    const bobSummary = result.find(s => s.nis === '12002');
    expect(bobSummary).toBeDefined();
    expect(bobSummary!.student_name).toBe('Bob Smith');
    expect(bobSummary!.class_name).toBe('10B');
    expect(bobSummary!.total_absences).toBe(2);
    expect(bobSummary!.breakdown).toEqual({
      izin: 2,
      sakit: 0,
      alpha: 0
    });

    // Charlie's summary
    const charlieSummary = result.find(s => s.nis === '12003');
    expect(charlieSummary).toBeDefined();
    expect(charlieSummary!.student_name).toBe('Charlie Brown');
    expect(charlieSummary!.class_name).toBe('10A');
    expect(charlieSummary!.total_absences).toBe(3);
    expect(charlieSummary!.breakdown).toEqual({
      izin: 0,
      sakit: 3,
      alpha: 0
    });
  });

  it('should filter by class name', async () => {
    // Create students in different classes
    const students = await db.insert(studentsTable)
      .values([
        { nis: '12001', full_name: 'Alice Johnson', class_name: '10A' },
        { nis: '12002', full_name: 'Bob Smith', class_name: '10B' }
      ])
      .returning()
      .execute();

    // Create attendance records for both students
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, date: '2024-01-15', status: 'izin' },
        { student_id: students[1].id, date: '2024-01-15', status: 'sakit' }
      ])
      .execute();

    const result = await getAbsenceSummary('10A');

    expect(result).toHaveLength(1);
    expect(result[0].nis).toBe('12001');
    expect(result[0].class_name).toBe('10A');
    expect(result[0].total_absences).toBe(1);
  });

  it('should filter by date range', async () => {
    // Create test student
    const students = await db.insert(studentsTable)
      .values([{ nis: '12001', full_name: 'Alice Johnson', class_name: '10A' }])
      .returning()
      .execute();

    // Create attendance records across different dates
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, date: '2024-01-10', status: 'izin' }, // Before range
        { student_id: students[0].id, date: '2024-01-15', status: 'sakit' }, // In range
        { student_id: students[0].id, date: '2024-01-20', status: 'alpha' }, // In range
        { student_id: students[0].id, date: '2024-01-25', status: 'izin' } // After range
      ])
      .execute();

    const result = await getAbsenceSummary(undefined, '2024-01-15', '2024-01-20');

    expect(result).toHaveLength(1);
    expect(result[0].total_absences).toBe(2);
    expect(result[0].breakdown).toEqual({
      izin: 0,
      sakit: 1,
      alpha: 1
    });
  });

  it('should filter by both class name and date range', async () => {
    // Create students in different classes
    const students = await db.insert(studentsTable)
      .values([
        { nis: '12001', full_name: 'Alice Johnson', class_name: '10A' },
        { nis: '12002', full_name: 'Bob Smith', class_name: '10B' }
      ])
      .returning()
      .execute();

    // Create attendance records
    await db.insert(attendanceTable)
      .values([
        // Alice - should be included
        { student_id: students[0].id, date: '2024-01-15', status: 'izin' },
        { student_id: students[0].id, date: '2024-01-25', status: 'sakit' }, // Outside date range
        
        // Bob - should be excluded (different class)
        { student_id: students[1].id, date: '2024-01-15', status: 'alpha' }
      ])
      .execute();

    const result = await getAbsenceSummary('10A', '2024-01-15', '2024-01-20');

    expect(result).toHaveLength(1);
    expect(result[0].nis).toBe('12001');
    expect(result[0].class_name).toBe('10A');
    expect(result[0].total_absences).toBe(1);
    expect(result[0].breakdown.izin).toBe(1);
  });

  it('should exclude hadir status from summary', async () => {
    // Create test student
    const students = await db.insert(studentsTable)
      .values([{ nis: '12001', full_name: 'Alice Johnson', class_name: '10A' }])
      .returning()
      .execute();

    // Create attendance records with only 'hadir' status
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, date: '2024-01-15', status: 'hadir' },
        { student_id: students[0].id, date: '2024-01-16', status: 'hadir' }
      ])
      .execute();

    const result = await getAbsenceSummary();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no attendance records exist', async () => {
    // Create test student but no attendance records
    await db.insert(studentsTable)
      .values([{ nis: '12001', full_name: 'Alice Johnson', class_name: '10A' }])
      .execute();

    const result = await getAbsenceSummary();

    expect(result).toHaveLength(0);
  });

  it('should sort results by class name then student name', async () => {
    // Create students with names that would sort differently alphabetically
    const students = await db.insert(studentsTable)
      .values([
        { nis: '12001', full_name: 'Zoe Wilson', class_name: '10A' },
        { nis: '12002', full_name: 'Alice Brown', class_name: '10B' },
        { nis: '12003', full_name: 'Bob Smith', class_name: '10A' }
      ])
      .returning()
      .execute();

    // Create attendance records for all students
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, date: '2024-01-15', status: 'izin' },
        { student_id: students[1].id, date: '2024-01-15', status: 'sakit' },
        { student_id: students[2].id, date: '2024-01-15', status: 'alpha' }
      ])
      .execute();

    const result = await getAbsenceSummary();

    expect(result).toHaveLength(3);
    
    // Should be sorted by class (10A, 10A, 10B), then by name within class
    expect(result[0].class_name).toBe('10A');
    expect(result[0].student_name).toBe('Bob Smith'); // Bob comes before Zoe alphabetically
    
    expect(result[1].class_name).toBe('10A');
    expect(result[1].student_name).toBe('Zoe Wilson');
    
    expect(result[2].class_name).toBe('10B');
    expect(result[2].student_name).toBe('Alice Brown');
  });

  it('should handle mixed absence types correctly', async () => {
    // Create test student
    const students = await db.insert(studentsTable)
      .values([{ nis: '12001', full_name: 'Alice Johnson', class_name: '10A' }])
      .returning()
      .execute();

    // Create attendance records with mixed statuses
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, date: '2024-01-15', status: 'izin' },
        { student_id: students[0].id, date: '2024-01-16', status: 'izin' },
        { student_id: students[0].id, date: '2024-01-17', status: 'sakit' },
        { student_id: students[0].id, date: '2024-01-18', status: 'alpha' },
        { student_id: students[0].id, date: '2024-01-19', status: 'alpha' },
        { student_id: students[0].id, date: '2024-01-20', status: 'alpha' },
        { student_id: students[0].id, date: '2024-01-21', status: 'hadir' } // Should be excluded
      ])
      .execute();

    const result = await getAbsenceSummary();

    expect(result).toHaveLength(1);
    expect(result[0].total_absences).toBe(6);
    expect(result[0].breakdown).toEqual({
      izin: 2,
      sakit: 1,
      alpha: 3
    });
  });
});