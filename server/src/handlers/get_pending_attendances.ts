import { db } from '../db';
import { attendanceTable, studentsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type AttendanceWithStudent } from '../schema';

export const getPendingAttendances = async (): Promise<AttendanceWithStudent[]> => {
  try {
    // Query attendance records with status 'pending', joined with student details
    const results = await db.select()
      .from(attendanceTable)
      .innerJoin(studentsTable, eq(attendanceTable.student_id, studentsTable.id))
      .where(eq(attendanceTable.validation_status, 'pending'))
      .orderBy(desc(attendanceTable.created_at))
      .execute();

    // Transform the joined results to match AttendanceWithStudent schema
    return results.map(result => ({
      id: result.attendance.id,
      student: {
        id: result.students.id,
        nis: result.students.nis,
        full_name: result.students.full_name,
        class_name: result.students.class_name,
        photo_url: result.students.photo_url
      },
      date: result.attendance.date,
      status: result.attendance.status,
      validation_status: result.attendance.validation_status,
      notes: result.attendance.notes,
      created_at: result.attendance.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch pending attendances:', error);
    throw error;
  }
};