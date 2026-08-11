import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";


export const categories = pgTable("categories", {

  id: serial("id").primaryKey(),

  name: text("name").notNull(),

});


export const level = pgTable("levels", {

  id: serial("id").primaryKey(),

  name: text("name").notNull()
})


export const cities = pgTable("cities", {

  id: serial("id").primaryKey(),

  name: text("name").notNull(),

  country: text("name").notNull(),

  imageUrl: text("image_url"),

  levelId: integer("level_id")
    .references(() => level.id)
})



export const learningSets = pgTable("learning_sets", {

  id: serial("id").primaryKey(),

  name: text("name").notNull(),

});


export const vocabulary = pgTable("vocabulary", {

  id: serial("id").primaryKey(),

  itemId: text("item_id").notNull(),

  categoryId: integer("category_id")
    .references(() => categories.id),

  learningSetId: integer("learning_set_id")
    .references(() => learningSets.id),

  cityId: integer("city_id")
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