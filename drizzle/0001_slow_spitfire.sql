CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`timestamp` timestamp NOT NULL,
	`alertType` varchar(100) NOT NULL,
	`alertValue` varchar(50),
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('active','resolved','acknowledged') NOT NULL DEFAULT 'active',
	`resolutionTime` int,
	`description` text,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `baltimoreData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100),
	`subcategory` varchar(100),
	`description` text,
	`value` text,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`timestamp` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `baltimoreData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`nodeName` varchar(255),
	`latitude` varchar(50),
	`longitude` varchar(50),
	`alertType` varchar(100),
	`alertValue` varchar(50),
	`alertDuration` varchar(50),
	`burnHours` varchar(50),
	`lightStatus` varchar(50),
	`nodeStatus` varchar(50),
	`networkType` varchar(50),
	`firmwareVersion` varchar(50),
	`hardwareVersion` varchar(50),
	`installDate` varchar(100),
	`utility` varchar(255),
	`timezone` varchar(100),
	`tags` text,
	`lastUpdate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `kpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`avgResolutionTime` int,
	`feederEfficiency` int,
	`networkStatusOnline` int,
	`networkStatusOffline` int,
	`activeAlertsCount` int,
	`deviceHealthScore` int,
	`totalDevices` int,
	`onlineDevices` int,
	`offlineDevices` int,
	`powerLossCount` int,
	`tiltAlertCount` int,
	`lowVoltageCount` int,
	CONSTRAINT `kpis_id` PRIMARY KEY(`id`)
);
