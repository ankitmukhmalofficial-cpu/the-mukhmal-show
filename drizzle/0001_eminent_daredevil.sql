CREATE TABLE `site_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorHash` varchar(64) NOT NULL,
	`path` varchar(255) NOT NULL,
	`userAgent` varchar(255),
	`visitedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeId` varchar(32) NOT NULL,
	`visitorHash` varchar(64) NOT NULL,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtube_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeId` varchar(32) NOT NULL,
	`title` text NOT NULL,
	`thumbnailUrl` text NOT NULL,
	`videoType` varchar(16) NOT NULL,
	`youtubeViewCount` int NOT NULL DEFAULT 0,
	`websiteClickCount` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`isVisible` int NOT NULL DEFAULT 1,
	CONSTRAINT `youtube_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_videos_youtubeId_unique` UNIQUE(`youtubeId`)
);
