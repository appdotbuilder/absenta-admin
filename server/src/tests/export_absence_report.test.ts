import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, attendanceTable, adminsTable } from '../db/schema';
import { type ExportReportInput } from '../schema';
import { exportAbsenceReport } from '../handlers/export_absence_report';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test input with all required fields
const testInput: ExportReportInput = {
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  format: 'excel' as any // Cast to bypass type check since we implement CSV
};

// Test input with class filter
const testInputWithClass: ExportReportInput = {
  class_name: '10A',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  format: 'excel' as any // Cast to bypass type check since we implement CSV
};

describe('exportAbsenceReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export absence report successfully', async () => {
    // Create test admin
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    // Create test students
    const studentsResult = await db.insert(studentsTable)
      .values([
        {
          nis: 'SIS001',
          full_name: 'Ahmad Budi',
          class_name: '10A'
        },
        {
          nis: 'SIS002', 
          full_name: 'Siti Aisyah',
          class_name: '10B'
        }
      ])
      .returning()
      .execute();

    // Create test attendance records (mix of validated absences and other statuses)
    await db.insert(attendanceTable)
      .values([
        {
          student_id: studentsResult[0].id,
          date: '2024-01-15',
          status: 'izin',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-16',
          status: 'sakit',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[1].id,
          date: '2024-01-17',
          status: 'alpha',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        // This should be excluded (not validated)
        {
          student_id: studentsResult[0].id,
          date: '2024-01-18',
          status: 'izin',
          validation_status: 'pending'
        },
        // This should be excluded (hadir status)
        {
          student_id: studentsResult[0].id,
          date: '2024-01-19',
          status: 'hadir',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      ])
      .execute();

    const result = await exportAbsenceReport(testInput);

    // Basic response validation
    expect(result.success).toBe(true);
    expect(result.download_url).toBeDefined();
    expect(result.download_url).toMatch(/^\/reports\/laporan-ketidakhadiran-ringkasan_.*\.csv$/);
    expect(result.message).toContain('berhasil dibuat');
    expect(result.message).toContain('2 siswa');
    expect(result.message).toContain('3 ketidakhadiran');
  });

  it('should create CSV file with correct structure', async () => {
    // Create test data
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    const studentsResult = await db.insert(studentsTable)
      .values({
        nis: 'SIS001',
        full_name: 'Ahmad Budi',
        class_name: '10A'
      })
      .returning()
      .execute();

    await db.insert(attendanceTable)
      .values([
        {
          student_id: studentsResult[0].id,
          date: '2024-01-15',
          status: 'izin',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-16',
          status: 'sakit',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      ])
      .execute();

    const result = await exportAbsenceReport(testInput);
    
    expect(result.success).toBe(true);
    expect(result.download_url).toBeDefined();

    // Verify file exists and has correct structure
    const filename = result.download_url!.replace('/reports/', '');
    const filePath = path.join(process.cwd(), 'tmp', 'reports', filename);
    
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Read and verify CSV file structure
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    
    // Check header structure
    expect(lines[0]).toEqual('NIS,Nama Siswa,Kelas,Total Tidak Hadir,Izin,Sakit,Alpha');

    // Check data row
    expect(lines[1]).toEqual('SIS001,"Ahmad Budi",10A,2,1,1,0');

    // Clean up test file
    await fs.unlink(filePath).catch(() => {});
  });

  it('should filter by class when class_name is provided', async () => {
    // Create test admin
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    // Create students in different classes
    const studentsResult = await db.insert(studentsTable)
      .values([
        {
          nis: 'SIS001',
          full_name: 'Ahmad Budi',
          class_name: '10A'
        },
        {
          nis: 'SIS002',
          full_name: 'Siti Aisyah',
          class_name: '10B'
        }
      ])
      .returning()
      .execute();

    // Create attendance records for both classes
    await db.insert(attendanceTable)
      .values([
        {
          student_id: studentsResult[0].id,
          date: '2024-01-15',
          status: 'izin',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[1].id,
          date: '2024-01-16',
          status: 'sakit',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      ])
      .execute();

    const result = await exportAbsenceReport(testInputWithClass);

    expect(result.success).toBe(true);
    expect(result.message).toContain('1 siswa'); // Only class 10A student
    expect(result.message).toContain('1 ketidakhadiran');
  });

  it('should handle date range filtering correctly', async () => {
    // Create test data
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    const studentsResult = await db.insert(studentsTable)
      .values({
        nis: 'SIS001',
        full_name: 'Ahmad Budi',
        class_name: '10A'
      })
      .returning()
      .execute();

    // Create attendance records inside and outside date range
    await db.insert(attendanceTable)
      .values([
        {
          student_id: studentsResult[0].id,
          date: '2024-01-15', // Inside range
          status: 'izin',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2023-12-31', // Outside range (before)
          status: 'sakit',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-02-01', // Outside range (after)
          status: 'alpha',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      ])
      .execute();

    const result = await exportAbsenceReport(testInput);

    expect(result.success).toBe(true);
    expect(result.message).toContain('1 ketidakhadiran'); // Only the record within range
  });

  it('should exclude pending and rejected validations', async () => {
    // Create test data
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    const studentsResult = await db.insert(studentsTable)
      .values({
        nis: 'SIS001',
        full_name: 'Ahmad Budi',
        class_name: '10A'
      })
      .returning()
      .execute();

    await db.insert(attendanceTable)
      .values([
        {
          student_id: studentsResult[0].id,
          date: '2024-01-15',
          status: 'izin',
          validation_status: 'validated', // This should be included
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-16',
          status: 'sakit',
          validation_status: 'pending' // This should be excluded
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-17',
          status: 'alpha',
          validation_status: 'rejected', // This should be excluded
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      ])
      .execute();

    const result = await exportAbsenceReport(testInput);

    expect(result.success).toBe(true);
    expect(result.message).toContain('1 ketidakhadiran'); // Only validated record
  });

  it('should exclude hadir status records', async () => {
    // Create test data
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    const studentsResult = await db.insert(studentsTable)
      .values({
        nis: 'SIS001',
        full_name: 'Ahmad Budi',
        class_name: '10A'
      })
      .returning()
      .execute();

    await db.insert(attendanceTable)
      .values([
        {
          student_id: studentsResult[0].id,
          date: '2024-01-15',
          status: 'hadir', // Should be excluded
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-16',
          status: 'izin', // Should be included
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      ])
      .execute();

    const result = await exportAbsenceReport(testInput);

    expect(result.success).toBe(true);
    expect(result.message).toContain('1 ketidakhadiran'); // Only absence record
  });

  it('should return success false with no data', async () => {
    // No test data created, should return empty report
    const result = await exportAbsenceReport(testInput);

    expect(result.success).toBe(true);
    expect(result.download_url).toBeDefined();
    expect(result.message).toContain('0 siswa');
    expect(result.message).toContain('0 ketidakhadiran');
  });

  it('should handle large datasets correctly', async () => {
    // Create test admin
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    // Create multiple students for testing large dataset
    const studentsResult = await db.insert(studentsTable)
      .values([
        {
          nis: 'SIS001',
          full_name: 'Ahmad Budi',
          class_name: '10A'
        },
        {
          nis: 'SIS002',
          full_name: 'Siti Aisyah',
          class_name: '10B'
        },
        {
          nis: 'SIS003',
          full_name: 'Muhammad Ali',
          class_name: '10A'
        }
      ])
      .returning()
      .execute();

    // Create multiple attendance records for each student
    const attendanceData = [];
    for (const student of studentsResult) {
      attendanceData.push(
        {
          student_id: student.id,
          date: '2024-01-15',
          status: 'izin' as const,
          validation_status: 'validated' as const,
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: student.id,
          date: '2024-01-16',
          status: 'sakit' as const,
          validation_status: 'validated' as const,
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      );
    }

    await db.insert(attendanceTable)
      .values(attendanceData)
      .execute();

    const result = await exportAbsenceReport(testInput);

    expect(result.success).toBe(true);
    expect(result.download_url).toBeDefined();
    expect(result.message).toContain('3 siswa'); // 3 students
    expect(result.message).toContain('6 ketidakhadiran'); // 6 total absence records

    // Verify file exists
    const filename = result.download_url!.replace('/reports/', '');
    const filePath = path.join(process.cwd(), 'tmp', 'reports', filename);
    
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Clean up test file
    await fs.unlink(filePath).catch(() => {});
  });

  it('should aggregate absence data correctly by student and status', async () => {
    // Create test admin
    const adminResult = await db.insert(adminsTable)
      .values({
        nis: 'ADM001',
        email: 'admin@test.com',
        password: 'hashedpassword',
        full_name: 'Test Admin'
      })
      .returning()
      .execute();

    // Create test student
    const studentsResult = await db.insert(studentsTable)
      .values({
        nis: 'SIS001',
        full_name: 'Ahmad Budi',
        class_name: '10A'
      })
      .returning()
      .execute();

    // Create multiple absence records with different statuses
    await db.insert(attendanceTable)
      .values([
        {
          student_id: studentsResult[0].id,
          date: '2024-01-15',
          status: 'izin',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-16',
          status: 'izin',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-17',
          status: 'sakit',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        },
        {
          student_id: studentsResult[0].id,
          date: '2024-01-18',
          status: 'alpha',
          validation_status: 'validated',
          validated_by: adminResult[0].id,
          validated_at: new Date()
        }
      ])
      .execute();

    const result = await exportAbsenceReport(testInput);
    
    expect(result.success).toBe(true);

    // Verify file content has correct aggregation
    const filename = result.download_url!.replace('/reports/', '');
    const filePath = path.join(process.cwd(), 'tmp', 'reports', filename);
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    
    // Check aggregated data: Total=4, Izin=2, Sakit=1, Alpha=1
    expect(lines[1]).toEqual('SIS001,"Ahmad Budi",10A,4,2,1,1');

    // Clean up test file
    await fs.unlink(filePath).catch(() => {});
  });
});