import { db } from '../db';
import { studentsTable, attendanceTable } from '../db/schema';
import { type ExportReportInput, type ExportReportResponse, type AbsenceSummary } from '../schema';
import { eq, and, gte, lte, ne, SQL } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as path from 'path';

export const exportAbsenceReport = async (input: ExportReportInput): Promise<ExportReportResponse> => {
  try {
    // 1. Query attendance records within date range
    let baseQuery = db.select({
      student_id: attendanceTable.student_id,
      student_nis: studentsTable.nis,
      student_name: studentsTable.full_name,
      class_name: studentsTable.class_name,
      date: attendanceTable.date,
      status: attendanceTable.status,
      validation_status: attendanceTable.validation_status
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(attendanceTable.student_id, studentsTable.id));

    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];
    
    // Date range filter
    conditions.push(gte(attendanceTable.date, input.start_date));
    conditions.push(lte(attendanceTable.date, input.end_date));
    
    // Only include absence records (not 'hadir')
    conditions.push(ne(attendanceTable.status, 'hadir'));
    
    // Only include validated records
    conditions.push(eq(attendanceTable.validation_status, 'validated'));
    
    // Optional class filter
    if (input.class_name) {
      conditions.push(eq(studentsTable.class_name, input.class_name));
    }

    // Apply all conditions
    const query = baseQuery.where(and(...conditions));

    const attendanceRecords = await query.execute();

    // 3. Aggregate absence data by student and class
    const absenceSummary: Map<string, AbsenceSummary> = new Map();
    
    attendanceRecords.forEach(record => {
      const key = `${record.student_id}-${record.class_name}`;
      
      if (!absenceSummary.has(key)) {
        absenceSummary.set(key, {
          class_name: record.class_name,
          student_name: record.student_name,
          nis: record.student_nis,
          total_absences: 0,
          breakdown: {
            izin: 0,
            sakit: 0,
            alpha: 0
          }
        });
      }
      
      const summary = absenceSummary.get(key)!;
      summary.total_absences++;
      
      if (record.status === 'izin') {
        summary.breakdown.izin++;
      } else if (record.status === 'sakit') {
        summary.breakdown.sakit++;
      } else if (record.status === 'alpha') {
        summary.breakdown.alpha++;
      }
    });

    // Convert map to array and sort by class and student name
    const summaryData = Array.from(absenceSummary.values()).sort((a, b) => {
      if (a.class_name !== b.class_name) {
        return a.class_name.localeCompare(b.class_name);
      }
      return a.student_name.localeCompare(b.student_name);
    });

    // 4. Generate CSV report file (simplified approach without XLSX dependency)
    const reportsDir = path.join(process.cwd(), 'tmp', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const classFilter = input.class_name ? `_${input.class_name}` : '_semua-kelas';
    
    // Create summary CSV
    const summaryFilename = `laporan-ketidakhadiran-ringkasan_${input.start_date}_${input.end_date}${classFilter}_${timestamp}.csv`;
    const summaryFilePath = path.join(reportsDir, summaryFilename);
    
    const summaryHeader = 'NIS,Nama Siswa,Kelas,Total Tidak Hadir,Izin,Sakit,Alpha\n';
    const summaryRows = summaryData.map(item => 
      `${item.nis},"${item.student_name}",${item.class_name},${item.total_absences},${item.breakdown.izin},${item.breakdown.sakit},${item.breakdown.alpha}`
    ).join('\n');
    
    const summaryContent = summaryHeader + summaryRows;
    await fs.writeFile(summaryFilePath, summaryContent, 'utf-8');
    
    // Create detail CSV
    const detailFilename = `laporan-ketidakhadiran-detail_${input.start_date}_${input.end_date}${classFilter}_${timestamp}.csv`;
    const detailFilePath = path.join(reportsDir, detailFilename);
    
    const detailHeader = 'Tanggal,NIS,Nama Siswa,Kelas,Status\n';
    const detailRows = attendanceRecords.map(record => 
      `${record.date},${record.student_nis},"${record.student_name}",${record.class_name},${record.status.toUpperCase()}`
    ).join('\n');
    
    const detailContent = detailHeader + detailRows;
    await fs.writeFile(detailFilePath, detailContent, 'utf-8');
    
    // Return relative download URL for summary file (main report)
    const downloadUrl = `/reports/${summaryFilename}`;
    
    return {
      success: true,
      download_url: downloadUrl,
      message: `Laporan berhasil dibuat. Ditemukan ${summaryData.length} siswa dengan total ${attendanceRecords.length} ketidakhadiran.`
    };

  } catch (error) {
    console.error('Export absence report failed:', error);
    return {
      success: false,
      message: 'Gagal membuat laporan ketidakhadiran. Silakan coba lagi.'
    };
  }
};