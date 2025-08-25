import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type AdminLoginInput, type AdminLoginResponse } from '../schema';
import { eq, or } from 'drizzle-orm';

export const adminLogin = async (input: AdminLoginInput): Promise<AdminLoginResponse> => {
  try {
    // Look up admin by NIS or email (identifier field)
    const admins = await db.select()
      .from(adminsTable)
      .where(
        or(
          eq(adminsTable.nis, input.identifier),
          eq(adminsTable.email, input.identifier)
        )
      )
      .execute();

    // Check if admin exists
    if (admins.length === 0) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    const admin = admins[0];

    // Verify password (simple string comparison for now - in production use bcrypt)
    if (admin.password !== input.password) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Return success with admin data (excluding password)
    return {
      success: true,
      admin: {
        id: admin.id,
        nis: admin.nis,
        email: admin.email,
        full_name: admin.full_name,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      }
    };
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
};