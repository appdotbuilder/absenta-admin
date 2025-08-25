import { db } from '../db';
import { attendanceTable, studentsTable } from '../db/schema';
import { eq, and, ne, gte, lte, SQL } from 'drizzle-orm';
import type { ExportReportInput, ExportReportResponse } from '../schema';
import * as fs from 'fs/promises';
import * as path from 'path';

export const exportAbsenceReport = async (input: ExportReportInput): Promise<ExportReportResponse> => {
  try {
    // Build query conditions
    const conditions: SQL<unknown>[] = [];
    
    // Filter by date range
    conditions.push(gte(attendanceTable.date, input.start_date));
    conditions.push(lte(attendanceTable.date, input.end_date));
    
    // Filter by non-attendance statuses (exclude 'hadir')
    conditions.push(ne(attendanceTable.status, 'hadir'));
    
    // Only include validated records
    conditions.push(eq(attendanceTable.validation_status, 'validated'));
    
    // Filter by class if specified
    if (input.class_name) {
      conditions.push(eq(studentsTable.class_name, input.class_name));
    }

    // Get absence data
    const absenceData = await db.select({
      student_nis: studentsTable.nis,
      student_name: studentsTable.full_name,
      class_name: studentsTable.class_name,
      date: attendanceTable.date,
      status: attendanceTable.status,
      notes: attendanceTable.notes
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(attendanceTable.student_id, studentsTable.id))
    .where(and(...conditions))
    .orderBy(studentsTable.class_name, studentsTable.full_name, attendanceTable.date)
    .execute();

    // Group data by student and calculate breakdown
    const studentMap = new Map<string, any>();

    absenceData.forEach((record) => {
      const key = `${record.student_nis}-${record.student_name}`;
      
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          nis: record.student_nis,
          name: record.student_name,
          class_name: record.class_name,
          total: 0,
          izin: 0,
          sakit: 0,
          alpha: 0
        });
      }

      const student = studentMap.get(key)!;
      student.total += 1;
      
      // Update breakdown based on status
      if (record.status === 'izin') {
        student.izin += 1;
      } else if (record.status === 'sakit') {
        student.sakit += 1;
      } else if (record.status === 'alpha') {
        student.alpha += 1;
      }
    });

    // Convert map to array and sort
    const studentsData = Array.from(studentMap.values()).sort((a, b) => {
      if (a.class_name !== b.class_name) {
        return a.class_name.localeCompare(b.class_name);
      }
      return a.name.localeCompare(b.name);
    });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `laporan-ketidakhadiran-ringkasan_${timestamp}.csv`;
    
    // Ensure tmp/reports directory exists
    const reportsDir = path.join(process.cwd(), 'tmp', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const filePath = path.join(reportsDir, filename);

    // Generate CSV content
    const csvHeader = 'NIS,Nama Siswa,Kelas,Total Tidak Hadir,Izin,Sakit,Alpha';
    const csvRows = studentsData.map(student => 
      `${student.nis},"${student.name}",${student.class_name},${student.total},${student.izin},${student.sakit},${student.alpha}`
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Write CSV file
    await fs.writeFile(filePath, csvContent, 'utf-8');

    const studentCount = studentsData.length;
    const totalAbsences = absenceData.length;

    return {
      success: true,
      download_url: `/reports/${filename}`,
      message: `Laporan berhasil dibuat dengan ${studentCount} siswa dan ${totalAbsences} ketidakhadiran`
    };
  } catch (error) {
    console.error('Failed to export absence report:', error);
    return {
      success: false,
      message: 'Gagal mengekspor laporan. Silakan coba lagi.'
    };
  }
};