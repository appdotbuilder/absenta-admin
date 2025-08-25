import { db } from '../db';
import { attendanceTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { eq, and, count, sql } from 'drizzle-orm';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Query 1: Count pending validations
    const pendingValidationsResult = await db
      .select({ count: count() })
      .from(attendanceTable)
      .where(eq(attendanceTable.validation_status, 'pending'))
      .execute();

    const pendingValidations = pendingValidationsResult[0]?.count || 0;

    // Query 2: Get today's attendance breakdown by status
    const todayStatsResult = await db
      .select({
        status: attendanceTable.status,
        count: count(),
      })
      .from(attendanceTable)
      .where(eq(attendanceTable.date, today))
      .groupBy(attendanceTable.status)
      .execute();

    // Initialize stats with zeros
    const todayStats = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0,
      total: 0,
    };

    // Populate stats from query results
    todayStatsResult.forEach((row) => {
      const statusCount = row.count;
      todayStats[row.status] = statusCount;
      todayStats.total += statusCount;
    });

    return {
      pending_validations: pendingValidations,
      today_stats: todayStats,
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
};