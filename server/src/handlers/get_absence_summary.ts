import { db } from '../db';
import { attendanceTable, studentsTable } from '../db/schema';
import { eq, and, ne, gte, lte, count, SQL } from 'drizzle-orm';
import type { AbsenceSummary } from '../schema';

export const getAbsenceSummary = async (
  className?: string, 
  startDate?: string, 
  endDate?: string
): Promise<AbsenceSummary[]> => {
  try {
    // Build query conditions
    const conditions: SQL<unknown>[] = [];
    
    // Filter by date range if provided
    if (startDate) {
      conditions.push(gte(attendanceTable.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(attendanceTable.date, endDate));
    }
    
    // Filter by non-attendance statuses (exclude 'hadir')
    conditions.push(ne(attendanceTable.status, 'hadir'));
    
    // Filter by class if specified
    if (className) {
      conditions.push(eq(studentsTable.class_name, className));
    }

    // Get detailed absence data for each student
    const absenceData = await db.select({
      student_nis: studentsTable.nis,
      student_name: studentsTable.full_name,
      class_name: studentsTable.class_name,
      status: attendanceTable.status
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(attendanceTable.student_id, studentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .execute();

    // Group data by student and calculate breakdown
    const studentMap = new Map<string, AbsenceSummary>();

    absenceData.forEach((record) => {
      const key = `${record.student_nis}-${record.student_name}`;
      
      if (!studentMap.has(key)) {
        studentMap.set(key, {
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

      const student = studentMap.get(key)!;
      student.total_absences += 1;
      
      // Update breakdown based on status
      if (record.status === 'izin') {
        student.breakdown.izin += 1;
      } else if (record.status === 'sakit') {
        student.breakdown.sakit += 1;
      } else if (record.status === 'alpha') {
        student.breakdown.alpha += 1;
      }
    });

    // Convert map to array and sort
    const result = Array.from(studentMap.values()).sort((a, b) => {
      // Sort by class name first, then by student name
      if (a.class_name !== b.class_name) {
        return a.class_name.localeCompare(b.class_name);
      }
      return a.student_name.localeCompare(b.student_name);
    });

    return result;
  } catch (error) {
    console.error('Failed to get absence summary:', error);
    return [];
  }
};