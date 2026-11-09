ALTER TABLE "leads" ADD COLUMN "source" text DEFAULT 'consult' NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "province" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "registered_at" timestamp with time zone;