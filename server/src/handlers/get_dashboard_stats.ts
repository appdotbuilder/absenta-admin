import { db } from '../db';
import { attendanceTable } from '../db/schema';
import { eq, count } from 'drizzle-orm';
import type { DashboardStats } from '../schema';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Count pending validations
    const pendingValidations = await db.select({
      count: count()
    })
    .from(attendanceTable)
    .where(eq(attendanceTable.validation_status, 'pending'))
    .execute();

    // Get today's attendance statistics
    const todayAttendance = await db.select({
      status: attendanceTable.status,
      count: count()
    })
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today))
    .groupBy(attendanceTable.status)
    .execute();

    // Process today's stats
    const todayStats = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      total: 0
    };

    todayAttendance.forEach((record) => {
      const statusCount = record.count;
      todayStats[record.status as keyof typeof todayStats] = statusCount;
      todayStats.total += statusCount;
    });

    return {
      pending_validations: pendingValidations[0]?.count || 0,
      today_stats: todayStats
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    // Return default stats on error
    return {
      pending_validations: 0,
      today_stats: {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
        total: 0
      }
    };
  }
};