import { db } from '../db';
import { attendanceTable, studentsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import type { AttendanceWithStudent } from '../schema';

export const getPendingAttendances = async (): Promise<AttendanceWithStudent[]> => {
  try {
    const results = await db.select({
      id: attendanceTable.id,
      student_id: attendanceTable.student_id,
      date: attendanceTable.date,
      status: attendanceTable.status,
      validation_status: attendanceTable.validation_status,
      notes: attendanceTable.notes,
      created_at: attendanceTable.created_at,
      student: {
        id: studentsTable.id,
        nis: studentsTable.nis,
        full_name: studentsTable.full_name,
        class_name: studentsTable.class_name,
        photo_url: studentsTable.photo_url
      }
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(attendanceTable.student_id, studentsTable.id))
    .where(eq(attendanceTable.validation_status, 'pending'))
    .orderBy(desc(attendanceTable.created_at))
    .execute();

    return results.map((result) => ({
      id: result.id,
      student: result.student,
      date: result.date,
      status: result.status,
      validation_status: result.validation_status,
      notes: result.notes,
      created_at: result.created_at
    }));
  } catch (error) {
    console.error('Failed to get pending attendances:', error);
    return [];
  }
};