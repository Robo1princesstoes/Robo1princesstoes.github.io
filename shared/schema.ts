import { pgTable, serial, text, varchar, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
});

export const cats = pgTable('cats', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  age: varchar('age', { length: 50 }),
  gender: varchar('gender', { length: 20 }),
  breed: varchar('breed', { length: 100 }),
  color: varchar('color', { length: 100 }),
  description: text('description'),
  personality: varchar('personality', { length: 200 }),
  medical: text('medical'),
  status: varchar('status', { length: 50 }).default('available'),
  images: jsonb('images').$type<string[]>().default([]),
  filters: jsonb('filters').$type<string[]>().default([]),
  isPublished: boolean('is_published').default(false),
  isDraft: boolean('is_draft').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fosters = pgTable('fosters', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  age: varchar('age', { length: 50 }),
  gender: varchar('gender', { length: 20 }),
  breed: varchar('breed', { length: 100 }),
  color: varchar('color', { length: 100 }),
  description: text('description'),
  personality: varchar('personality', { length: 200 }),
  medical: text('medical'),
  status: varchar('status', { length: 50 }).default('available'),
  image: text('image'),
  images: jsonb('images').$type<string[]>().default([]),
  filters: jsonb('filters').$type<string[]>().default([]),
  fosterDuration: varchar('foster_duration', { length: 200 }),
  isPublished: boolean('is_published').default(false),
  isDraft: boolean('is_draft').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fosterParents = pgTable('foster_parents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  fosterDuration: varchar('foster_duration', { length: 200 }),
  statement: text('statement'),
  image: text('image'),
  isPublished: boolean('is_published').default(false),
  isDraft: boolean('is_draft').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  date: timestamp('date'),
  location: varchar('location', { length: 200 }),
  image: text('image'),
  isPublished: boolean('is_published').default(false),
  isDraft: boolean('is_draft').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  sectionKey: varchar('section_key', { length: 100 }).unique().notNull(),
  title: varchar('title', { length: 200 }),
  content: text('content'),
  draftContent: text('draft_content'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  isPublished: boolean('is_published').default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name'),
  category: varchar('category', { length: 50 }),
  caption: text('caption'),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  sid: varchar('sid', { length: 255 }).primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire').notNull(),
});



export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;
export type Cat = typeof cats.$inferSelect;
export type InsertCat = typeof cats.$inferInsert;
export type Foster = typeof fosters.$inferSelect;
export type InsertFoster = typeof fosters.$inferInsert;
export type FosterParent = typeof fosterParents.$inferSelect;
export type InsertFosterParent = typeof fosterParents.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type InsertSection = typeof sections.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;
