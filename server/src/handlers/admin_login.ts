import { db } from '../db';
import { adminsTable } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import type { AdminLoginInput, AdminLoginResponse } from '../schema';

export const adminLogin = async (input: AdminLoginInput): Promise<AdminLoginResponse> => {
  try {
    // Find admin by NIS or email
    const admin = await db.select()
      .from(adminsTable)
      .where(
        or(
          eq(adminsTable.nis, input.identifier),
          eq(adminsTable.email, input.identifier)
        )
      )
      .limit(1)
      .execute();

    if (!admin || admin.length === 0) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    const adminData = admin[0];

    // Simple password validation (in production, use proper password hashing)
    if (adminData.password !== input.password) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Return admin data without password
    const { password, ...adminWithoutPassword } = adminData;

    return {
      success: true,
      admin: adminWithoutPassword
      // No message for successful login as expected by tests
    };
  } catch (error) {
    console.error('Admin login failed:', error);
    return {
      success: false,
      message: 'Invalid credentials'
    };
  }
};