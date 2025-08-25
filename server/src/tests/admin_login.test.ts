import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type AdminLoginInput } from '../schema';
import { adminLogin } from '../handlers/admin_login';

// Test admin data
const testAdmin = {
  nis: 'ADM001',
  email: 'admin@school.edu',
  password: 'securepassword123',
  full_name: 'Admin User'
};

describe('adminLogin', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test admin for each test
    await db.insert(adminsTable)
      .values(testAdmin)
      .execute();
  });

  it('should authenticate admin with NIS', async () => {
    const input: AdminLoginInput = {
      identifier: 'ADM001',
      password: 'securepassword123'
    };

    const result = await adminLogin(input);

    expect(result.success).toBe(true);
    expect(result.admin).toBeDefined();
    expect(result.admin?.nis).toEqual('ADM001');
    expect(result.admin?.email).toEqual('admin@school.edu');
    expect(result.admin?.full_name).toEqual('Admin User');
    expect(result.admin?.id).toBeDefined();
    expect(result.admin?.created_at).toBeInstanceOf(Date);
    expect(result.admin?.updated_at).toBeInstanceOf(Date);
    expect(result.message).toBeUndefined();
    
    // Ensure password is not included in response
    expect((result.admin as any)?.password).toBeUndefined();
  });

  it('should authenticate admin with email', async () => {
    const input: AdminLoginInput = {
      identifier: 'admin@school.edu',
      password: 'securepassword123'
    };

    const result = await adminLogin(input);

    expect(result.success).toBe(true);
    expect(result.admin).toBeDefined();
    expect(result.admin?.nis).toEqual('ADM001');
    expect(result.admin?.email).toEqual('admin@school.edu');
    expect(result.admin?.full_name).toEqual('Admin User');
    expect(result.admin?.id).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const input: AdminLoginInput = {
      identifier: 'ADM001',
      password: 'wrongpassword'
    };

    const result = await adminLogin(input);

    expect(result.success).toBe(false);
    expect(result.admin).toBeUndefined();
    expect(result.message).toEqual('Invalid credentials');
  });

  it('should reject login with non-existent NIS', async () => {
    const input: AdminLoginInput = {
      identifier: 'NONEXISTENT',
      password: 'securepassword123'
    };

    const result = await adminLogin(input);

    expect(result.success).toBe(false);
    expect(result.admin).toBeUndefined();
    expect(result.message).toEqual('Invalid credentials');
  });

  it('should reject login with non-existent email', async () => {
    const input: AdminLoginInput = {
      identifier: 'nonexistent@school.edu',
      password: 'securepassword123'
    };

    const result = await adminLogin(input);

    expect(result.success).toBe(false);
    expect(result.admin).toBeUndefined();
    expect(result.message).toEqual('Invalid credentials');
  });

  it('should handle case-sensitive email correctly', async () => {
    const input: AdminLoginInput = {
      identifier: 'ADMIN@SCHOOL.EDU', // Different case
      password: 'securepassword123'
    };

    const result = await adminLogin(input);

    // Should fail because our implementation is case-sensitive
    expect(result.success).toBe(false);
    expect(result.admin).toBeUndefined();
    expect(result.message).toEqual('Invalid credentials');
  });

  it('should validate multiple admins with different credentials', async () => {
    // Insert another admin
    await db.insert(adminsTable)
      .values({
        nis: 'ADM002',
        email: 'admin2@school.edu',
        password: 'differentpassword',
        full_name: 'Second Admin'
      })
      .execute();

    // Test first admin
    const result1 = await adminLogin({
      identifier: 'ADM001',
      password: 'securepassword123'
    });

    expect(result1.success).toBe(true);
    expect(result1.admin?.full_name).toEqual('Admin User');

    // Test second admin
    const result2 = await adminLogin({
      identifier: 'admin2@school.edu',
      password: 'differentpassword'
    });

    expect(result2.success).toBe(true);
    expect(result2.admin?.full_name).toEqual('Second Admin');

    // Cross-check credentials should fail
    const result3 = await adminLogin({
      identifier: 'ADM001',
      password: 'differentpassword'
    });

    expect(result3.success).toBe(false);
  });

  it('should handle empty password', async () => {
    const input: AdminLoginInput = {
      identifier: 'ADM001',
      password: ''
    };

    const result = await adminLogin(input);

    expect(result.success).toBe(false);
    expect(result.admin).toBeUndefined();
    expect(result.message).toEqual('Invalid credentials');
  });
});