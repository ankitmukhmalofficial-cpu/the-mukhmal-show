ALTER TABLE `site_visits` ADD `userOpenId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `site_visits` ADD CONSTRAINT `site_visits_userOpenId_unique` UNIQUE(`userOpenId`);