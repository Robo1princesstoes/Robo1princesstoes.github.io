import { db } from './db';
import { cats, fosters, fosterParents, events, sections, photos } from '../shared/schema';
import type { Cat, InsertCat, Foster, InsertFoster, FosterParent, InsertFosterParent, Event, InsertEvent, Section, InsertSection, Photo, InsertPhoto } from '../shared/schema';
import { eq } from 'drizzle-orm';

export class DatabaseStorage {
  async getCats(publishedOnly: boolean = false): Promise<Cat[]> {
    if (publishedOnly) {
      return db.select().from(cats).where(eq(cats.isPublished, true));
    }
    return db.select().from(cats);
  }

  async getCatById(id: number): Promise<Cat | undefined> {
    const [cat] = await db.select().from(cats).where(eq(cats.id, id));
    return cat;
  }

  async createCat(cat: InsertCat): Promise<Cat> {
    const formattedCat = {
      ...cat,
      createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
      updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
    };
    const [newCat] = await db.insert(cats).values(formattedCat).returning();
    return newCat;
  }

  async updateCat(id: number, cat: Partial<InsertCat>): Promise<Cat | undefined> {
    const formattedCat = { ...cat, updatedAt: new Date() };
    if (formattedCat.createdAt) formattedCat.createdAt = new Date(formattedCat.createdAt);
    const [updated] = await db.update(cats).set(formattedCat).where(eq(cats.id, id)).returning();
    return updated;
  }

  async deleteCat(id: number): Promise<boolean> {
    const result = await db.delete(cats).where(eq(cats.id, id));
    return true;
  }

  async publishCat(id: number): Promise<Cat | undefined> {
    const [cat] = await db.update(cats).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(cats.id, id)).returning();
    return cat;
  }

  async unpublishCat(id: number): Promise<Cat | undefined> {
    const [cat] = await db.update(cats).set({ isPublished: false, isDraft: true, updatedAt: new Date() }).where(eq(cats.id, id)).returning();
    return cat;
  }

  async getFosters(publishedOnly: boolean = false): Promise<Foster[]> {
    if (publishedOnly) {
      return db.select().from(fosters).where(eq(fosters.isPublished, true));
    }
    return db.select().from(fosters);
  }

  async getFosterById(id: number): Promise<Foster | undefined> {
    const [foster] = await db.select().from(fosters).where(eq(fosters.id, id));
    return foster;
  }

  async createFoster(foster: InsertFoster): Promise<Foster> {
    const formattedFoster = {
      ...foster,
      createdAt: foster.createdAt ? new Date(foster.createdAt) : new Date(),
      updatedAt: foster.updatedAt ? new Date(foster.updatedAt) : new Date(),
    };
    const [newFoster] = await db.insert(fosters).values(formattedFoster).returning();
    return newFoster;
  }

  async updateFoster(id: number, foster: Partial<InsertFoster>): Promise<Foster | undefined> {
    const formattedFoster = { ...foster, updatedAt: new Date() };
    if (formattedFoster.createdAt) formattedFoster.createdAt = new Date(formattedFoster.createdAt);
    const [updated] = await db.update(fosters).set(formattedFoster).where(eq(fosters.id, id)).returning();
    return updated;
  }

  async deleteFoster(id: number): Promise<boolean> {
    await db.delete(fosters).where(eq(fosters.id, id));
    return true;
  }

  async publishFoster(id: number): Promise<Foster | undefined> {
    const [foster] = await db.update(fosters).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(fosters.id, id)).returning();
    return foster;
  }

  async unpublishFoster(id: number): Promise<Foster | undefined> {
    const [foster] = await db.update(fosters).set({ isPublished: false, isDraft: true, updatedAt: new Date() }).where(eq(fosters.id, id)).returning();
    return foster;
  }

  async getEvents(publishedOnly: boolean = false): Promise<Event[]> {
    if (publishedOnly) {
      return db.select().from(events).where(eq(events.isPublished, true));
    }
    return db.select().from(events);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const formattedEvent = {
      ...event,
      date: event.date ? new Date(event.date) : null,
      createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
    };
    const [newEvent] = await db.insert(events).values(formattedEvent).returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const formattedEvent = { ...event, updatedAt: new Date() };
    if (formattedEvent.date) formattedEvent.date = new Date(formattedEvent.date);
    if (formattedEvent.createdAt) formattedEvent.createdAt = new Date(formattedEvent.createdAt);
    const [updated] = await db.update(events).set(formattedEvent).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    return true;
  }

  async publishEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.update(events).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return event;
  }

  async getSection(key: string): Promise<Section | undefined> {
    const [section] = await db.select().from(sections).where(eq(sections.sectionKey, key));
    return section;
  }

  async getAllSections(): Promise<Section[]> {
    return db.select().from(sections);
  }

  async upsertSection(key: string, data: Partial<InsertSection>): Promise<Section> {
    const existing = await this.getSection(key);
    if (existing) {
      const [updated] = await db.update(sections)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sections.sectionKey, key))
        .returning();
      return updated;
    }
    const [newSection] = await db.insert(sections).values({ sectionKey: key, ...data }).returning();
    return newSection;
  }

  async publishSection(key: string): Promise<Section | undefined> {
    const section = await this.getSection(key);
    if (section) {
      const [updated] = await db.update(sections)
        .set({ 
          content: section.draftContent || section.content,
          isPublished: true,
          updatedAt: new Date()
        })
        .where(eq(sections.sectionKey, key))
        .returning();
      return updated;
    }
    return undefined;
  }

  async getPhotos(publishedOnly: boolean = false): Promise<Photo[]> {
    if (publishedOnly) {
      return db.select().from(photos).where(eq(photos.isPublished, true));
    }
    return db.select().from(photos);
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }

  async updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const [updated] = await db.update(photos).set(photo).where(eq(photos.id, id)).returning();
    return updated;
  }

  async deletePhoto(id: number): Promise<boolean> {
    await db.delete(photos).where(eq(photos.id, id));
    return true;
  }

  async getFosterParents(publishedOnly: boolean = false): Promise<FosterParent[]> {
    if (publishedOnly) return db.select().from(fosterParents).where(eq(fosterParents.isPublished, true));
    return db.select().from(fosterParents);
  }

  async createFosterParent(fp: InsertFosterParent): Promise<FosterParent> {
    const [newFp] = await db.insert(fosterParents).values({ ...fp, createdAt: new Date(), updatedAt: new Date() }).returning();
    return newFp;
  }

  async updateFosterParent(id: number, fp: Partial<InsertFosterParent>): Promise<FosterParent | undefined> {
    const [updated] = await db.update(fosterParents).set({ ...fp, updatedAt: new Date() }).where(eq(fosterParents.id, id)).returning();
    return updated;
  }

  async deleteFosterParent(id: number): Promise<boolean> {
    await db.delete(fosterParents).where(eq(fosterParents.id, id));
    return true;
  }

  async publishFosterParent(id: number): Promise<FosterParent | undefined> {
    const [fp] = await db.update(fosterParents).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(fosterParents.id, id)).returning();
    return fp;
  }

  async unpublishFosterParent(id: number): Promise<FosterParent | undefined> {
    const [fp] = await db.update(fosterParents).set({ isPublished: false, isDraft: true, updatedAt: new Date() }).where(eq(fosterParents.id, id)).returning();
    return fp;
  }

  async publishAllDrafts(): Promise<void> {
    await db.update(cats).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(cats.isDraft, true));
    await db.update(fosters).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(fosters.isDraft, true));
    await db.update(fosterParents).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(fosterParents.isDraft, true));
    await db.update(events).set({ isPublished: true, isDraft: false, updatedAt: new Date() }).where(eq(events.isDraft, true));
    
    const allSections = await db.select().from(sections);
    for (const section of allSections) {
      if (section.draftContent) {
        await db.update(sections)
          .set({ content: section.draftContent, isPublished: true, updatedAt: new Date() })
          .where(eq(sections.id, section.id));
      }
    }
  }
}

export const storage = new DatabaseStorage();
