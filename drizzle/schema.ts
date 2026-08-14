import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here


export const websiteEnquiries = mysqlTable("website_enquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phoneHash: varchar("phoneHash", { length: 64 }).notNull().unique(),
  phoneLast4: varchar("phoneLast4", { length: 4 }).notNull(),
  websiteType: varchar("websiteType", { length: 80 }).notNull(),
  budget: varchar("budget", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["new", "reviewed", "archived"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebsiteEnquiry = typeof websiteEnquiries.$inferSelect;
export type InsertWebsiteEnquiry = typeof websiteEnquiries.$inferInsert;


export const youtubeVideos = mysqlTable("youtube_videos", {
  id: int("id").autoincrement().primaryKey(),
  youtubeId: varchar("youtubeId", { length: 32 }).notNull().unique(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  videoType: varchar("videoType", { length: 16 }).notNull(),
  youtubeViewCount: int("youtubeViewCount").default(0).notNull(),
  websiteClickCount: int("websiteClickCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
  isVisible: int("isVisible").default(1).notNull(),
});

export type YoutubeVideo = typeof youtubeVideos.$inferSelect;
export type InsertYoutubeVideo = typeof youtubeVideos.$inferInsert;

export const siteVisits = mysqlTable("site_visits", {
  id: int("id").autoincrement().primaryKey(),
  visitorHash: varchar("visitorHash", { length: 64 }).notNull(),
  userOpenId: varchar("userOpenId", { length: 64 }).notNull().unique(),
  path: varchar("path", { length: 255 }).notNull(),
  userAgent: varchar("userAgent", { length: 255 }),
  visitedAt: timestamp("visitedAt").defaultNow().notNull(),
});

export type SiteVisit = typeof siteVisits.$inferSelect;
export type InsertSiteVisit = typeof siteVisits.$inferInsert;

export const videoClicks = mysqlTable("video_clicks", {
  id: int("id").autoincrement().primaryKey(),
  youtubeId: varchar("youtubeId", { length: 32 }).notNull(),
  visitorHash: varchar("visitorHash", { length: 64 }).notNull(),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
});

export type VideoClick = typeof videoClicks.$inferSelect;
export type InsertVideoClick = typeof videoClicks.$inferInsert;

export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  coverImageUrl: text("coverImageUrl"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

export const customerFeedback = mysqlTable("customer_feedback", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  projectType: varchar("projectType", { length: 80 }),
  message: text("message").notNull(),
  rating: int("rating"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
});

export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = typeof customerFeedback.$inferInsert;
