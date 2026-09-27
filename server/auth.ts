import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';
import { admins } from '../shared/schema';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecurePassword(length: number = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export async function createAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await db.select().from(admins).where(eq(admins.username, username));
    if (existing.length > 0) {
      return { success: false, error: 'Admin already exists' };
    }
    
    const passwordHash = await hashPassword(password);
    await db.insert(admins).values({ username, passwordHash });
    return { success: true };
  } catch (error) {
    console.error('Error creating admin:', error);
    return { success: false, error: 'Database error' };
  }
}

export async function validateAdmin(username: string, password: string): Promise<{ valid: boolean; admin?: any }> {
  try {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    if (!admin) {
      return { valid: false };
    }
    
    const valid = await verifyPassword(password, admin.passwordHash);
    if (valid) {
      await db.update(admins).set({ lastLogin: new Date() }).where(eq(admins.id, admin.id));
      return { valid: true, admin: { id: admin.id, username: admin.username } };
    }
    return { valid: false };
  } catch (error) {
    console.error('Error validating admin:', error);
    return { valid: false };
  }
}

export async function changePassword(adminId: number, newPassword: string): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(newPassword);
    await db.update(admins).set({ passwordHash }).where(eq(admins.id, adminId));
    return true;
  } catch (error) {
    console.error('Error changing password:', error);
    return false;
  }
}

export async function getAdminCount(): Promise<number> {
  const result = await db.select().from(admins);
  return result.length;
}
