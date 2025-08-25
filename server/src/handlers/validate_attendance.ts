import { db } from '../db';
import { attendanceTable, adminsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { ValidateAttendanceInput } from '../schema';

export const validateAttendance = async (input: ValidateAttendanceInput): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if admin exists
    const admin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, input.admin_id))
      .limit(1)
      .execute();

    if (!admin || admin.length === 0) {
      return {
        success: false,
        message: 'Admin not found'
      };
    }

    // Check if attendance record exists
    const attendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, input.attendance_id))
      .limit(1)
      .execute();

    if (!attendance || attendance.length === 0) {
      return {
        success: false,
        message: 'Attendance record not found'
      };
    }

    const attendanceRecord = attendance[0];

    // Check if already validated or rejected
    if (attendanceRecord.validation_status === 'validated') {
      return {
        success: false,
        message: 'Attendance record has already been validated'
      };
    }

    if (attendanceRecord.validation_status === 'rejected') {
      return {
        success: false,
        message: 'Attendance record has already been rejected'
      };
    }

    const newStatus = input.action === 'validate' ? 'validated' : 'rejected';
    
    // Update attendance record
    const updateData: any = {
      validation_status: newStatus,
      validated_by: input.admin_id,
      validated_at: new Date(),
      updated_at: new Date()
    };

    // Only update notes if provided, otherwise preserve existing notes
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    await db.update(attendanceTable)
      .set(updateData)
      .where(eq(attendanceTable.id, input.attendance_id))
      .execute();

    const actionText = input.action === 'validate' ? 'validated' : 'rejected';
    
    return {
      success: true,
      message: `Attendance record successfully ${actionText}`
    };
  } catch (error) {
    console.error('Failed to validate attendance:', error);
    return {
      success: false,
      message: 'Failed to process validation. Please try again.'
    };
  }
};