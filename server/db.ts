import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Auto-migration/setup for development
export async function setupDatabase() {
  try {
    const client = await pool.connect();
    try {
      // Create admins table
      await client.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          last_login TIMESTAMP
        )
      `);

      // Create cats table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cats (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          age VARCHAR(50),
          gender VARCHAR(20),
          breed VARCHAR(100),
          color VARCHAR(100),
          description TEXT,
          personality VARCHAR(200),
          medical TEXT,
          status VARCHAR(50) DEFAULT 'available',
          images JSONB DEFAULT '[]'::jsonb,
          filters JSONB DEFAULT '[]'::jsonb,
          is_published BOOLEAN DEFAULT false,
          is_draft BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create fosters table
      await client.query(`
        CREATE TABLE IF NOT EXISTS fosters (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          age VARCHAR(50),
          gender VARCHAR(20),
          breed VARCHAR(100),
          color VARCHAR(100),
          description TEXT,
          personality VARCHAR(200),
          medical TEXT,
          status VARCHAR(50) DEFAULT 'available',
          image TEXT,
          images JSONB DEFAULT '[]'::jsonb,
          filters JSONB DEFAULT '[]'::jsonb,
          is_published BOOLEAN DEFAULT false,
          is_draft BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      await client.query(`
        ALTER TABLE fosters
        ADD COLUMN IF NOT EXISTS foster_duration VARCHAR(200)
      `);

      // Create foster parents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS foster_parents (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          foster_duration VARCHAR(200),
          statement TEXT,
          image TEXT,
          is_published BOOLEAN DEFAULT false,
          is_draft BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          date TIMESTAMP,
          location VARCHAR(200),
          image TEXT,
          is_published BOOLEAN DEFAULT false,
          is_draft BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create sections table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sections (
          id SERIAL PRIMARY KEY,
          section_key VARCHAR(100) UNIQUE NOT NULL,
          title VARCHAR(200),
          content TEXT,
          draft_content TEXT,
          metadata JSONB,
          is_published BOOLEAN DEFAULT false,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create photos table
      await client.query(`
        CREATE TABLE IF NOT EXISTS photos (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT,
          category VARCHAR(50),
          caption TEXT,
          is_published BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Create sessions table for connect-pg-simple
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        )
      `);
      
      console.log('Database tables verified/created successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error setting up database tables:', err);
    throw err;
  }
}
