import { db } from '../db';
import { attendanceTable, adminsTable } from '../db/schema';
import { type ValidateAttendanceInput } from '../schema';
import { eq } from 'drizzle-orm';

export const validateAttendance = async (input: ValidateAttendanceInput): Promise<{ success: boolean; message: string }> => {
  try {
    // First, verify that the admin exists
    const adminExists = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, input.admin_id))
      .execute();

    if (adminExists.length === 0) {
      return {
        success: false,
        message: 'Admin not found'
      };
    }

    // Check if the attendance record exists and is still pending
    const existingAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, input.attendance_id))
      .execute();

    if (existingAttendance.length === 0) {
      return {
        success: false,
        message: 'Attendance record not found'
      };
    }

    const attendance = existingAttendance[0];

    // Check if already processed
    if (attendance.validation_status !== 'pending') {
      return {
        success: false,
        message: `Attendance record has already been ${attendance.validation_status}`
      };
    }

    // Update the attendance record
    const validationStatus = input.action === 'validate' ? 'validated' : 'rejected';
    
    const updateData: any = {
      validation_status: validationStatus,
      validated_by: input.admin_id,
      validated_at: new Date(),
      updated_at: new Date()
    };

    // Add notes if provided
    if (input.notes) {
      updateData.notes = input.notes;
    }

    await db.update(attendanceTable)
      .set(updateData)
      .where(eq(attendanceTable.id, input.attendance_id))
      .execute();

    return {
      success: true,
      message: `Attendance record successfully ${validationStatus}`
    };

  } catch (error) {
    console.error('Attendance validation failed:', error);
    throw error;
  }
};