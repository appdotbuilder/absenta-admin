import { db } from '../db';
import { attendanceTable, studentsTable } from '../db/schema';
import { type AbsenceSummary } from '../schema';
import { eq, and, gte, lte, inArray, SQL } from 'drizzle-orm';

export const getAbsenceSummary = async (className?: string, startDate?: string, endDate?: string): Promise<AbsenceSummary[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by absence statuses only (exclude 'hadir')
    conditions.push(inArray(attendanceTable.status, ['izin', 'sakit', 'alpha']));

    // Filter by class name if provided
    if (className) {
      conditions.push(eq(studentsTable.class_name, className));
    }

    // Filter by date range if provided
    if (startDate) {
      conditions.push(gte(attendanceTable.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendanceTable.date, endDate));
    }

    // Query attendance records with student information
    const attendanceRecords = await db.select({
      student_id: attendanceTable.student_id,
      student_nis: studentsTable.nis,
      student_name: studentsTable.full_name,
      class_name: studentsTable.class_name,
      status: attendanceTable.status,
      date: attendanceTable.date
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(attendanceTable.student_id, studentsTable.id))
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .execute();

    // Group and aggregate data by student
    const studentSummaryMap = new Map<number, {
      nis: string;
      student_name: string;
      class_name: string;
      izin: number;
      sakit: number;
      alpha: number;
    }>();

    attendanceRecords.forEach(record => {
      const studentId = record.student_id;
      
      if (!studentSummaryMap.has(studentId)) {
        studentSummaryMap.set(studentId, {
          nis: record.student_nis,
          student_name: record.student_name,
          class_name: record.class_name,
          izin: 0,
          sakit: 0,
          alpha: 0
        });
      }

      const summary = studentSummaryMap.get(studentId)!;
      
      // Increment the appropriate absence type counter
      if (record.status === 'izin') {
        summary.izin++;
      } else if (record.status === 'sakit') {
        summary.sakit++;
      } else if (record.status === 'alpha') {
        summary.alpha++;
      }
    });

    // Convert map to array and calculate totals
    const summaries: AbsenceSummary[] = Array.from(studentSummaryMap.values()).map(summary => ({
      class_name: summary.class_name,
      student_name: summary.student_name,
      nis: summary.nis,
      total_absences: summary.izin + summary.sakit + summary.alpha,
      breakdown: {
        izin: summary.izin,
        sakit: summary.sakit,
        alpha: summary.alpha
      }
    }));

    // Sort by class name, then by student name
    summaries.sort((a, b) => {
      const classCompare = a.class_name.localeCompare(b.class_name);
      if (classCompare !== 0) return classCompare;
      return a.student_name.localeCompare(b.student_name);
    });

    return summaries;
  } catch (error) {
    console.error('Absence summary query failed:', error);
    throw error;
  }
};