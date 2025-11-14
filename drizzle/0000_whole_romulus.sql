CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'resolved', 'acknowledged');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"deviceId" varchar(64) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"alertType" varchar(100) NOT NULL,
	"alertValue" varchar(50),
	"severity" "severity" DEFAULT 'medium' NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"resolutionTime" integer,
	"description" text,
	"latitude" varchar(50),
	"longitude" varchar(50),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "baltimoreData" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(100),
	"subcategory" varchar(100),
	"description" text,
	"value" text,
	"latitude" varchar(50),
	"longitude" varchar(50),
	"timestamp" timestamp with time zone,
	"metadata" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"deviceId" varchar(64) NOT NULL,
	"nodeName" varchar(255),
	"latitude" varchar(50),
	"longitude" varchar(50),
	"alertType" varchar(100),
	"alertValue" varchar(50),
	"alertDuration" varchar(50),
	"burnHours" varchar(50),
	"lightStatus" varchar(50),
	"nodeStatus" varchar(50),
	"networkType" varchar(50),
	"firmwareVersion" varchar(50),
	"hardwareVersion" varchar(50),
	"installDate" varchar(100),
	"utility" varchar(255),
	"timezone" varchar(100),
	"tags" text,
	"lastUpdate" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devices_deviceId_unique" UNIQUE("deviceId")
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"avgResolutionTime" integer,
	"feederEfficiency" integer,
	"networkStatusOnline" integer,
	"networkStatusOffline" integer,
	"activeAlertsCount" integer,
	"deviceHealthScore" integer,
	"totalDevices" integer,
	"onlineDevices" integer,
	"offlineDevices" integer,
	"powerLossCount" integer,
	"tiltAlertCount" integer,
	"lowVoltageCount" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
