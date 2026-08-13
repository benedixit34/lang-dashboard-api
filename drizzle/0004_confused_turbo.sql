ALTER TABLE "cities" ALTER COLUMN "level_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "level_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ALTER COLUMN "category_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "vocabulary" ALTER COLUMN "learning_set_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "vocabulary" ALTER COLUMN "city_id" SET DATA TYPE uuid;