import { pgEnum, pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";


export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  username: text("username").notNull(),

  email: text("email").notNull().unique(),

  passwordHash: text("password_hash").notNull(),

  role: userRoleEnum("role")
    .notNull()
    .default("user"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});


export const categories = pgTable("categories", {

  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

});


export const level = pgTable("levels", {

  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull()
})


export const cities = pgTable("cities", {

  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  country: text("name").notNull(),

  imageUrl: text("image_url"),

  levelId: uuid("level_id")
    .notNull()
    .references(() => level.id)
})



export const learningSets = pgTable("learning_sets", {

  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

});


export const vocabulary = pgTable("vocabulary", {

  id: uuid("id").defaultRandom().primaryKey(),

  itemId: text("item_id").notNull(),

  categoryId: uuid("category_id")
    .references(() => categories.id),

  learningSetId: uuid("learning_set_id")
    .references(() => learningSets.id),

  cityId: uuid("city_id")
    .references(() => cities.id),

  germanWord: text("german_word")
    .notNull(),

  englishMeaning: text("english_meaning"),

  article: text("article"),

  wordType: text("word_type"),

  difficulty: text("difficulty"),

  imageIdea: text("image_idea"),

  imageUrl: text("image_url"),

  audioUrl: text("audio_url"),

});