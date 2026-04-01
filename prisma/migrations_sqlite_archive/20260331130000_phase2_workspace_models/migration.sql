-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tuition" INTEGER NOT NULL,
    "totalCostEstimate" INTEGER NOT NULL,
    "housingAvailable" BOOLEAN NOT NULL,
    "housingCost" INTEGER,
    "acceptanceRate" REAL NOT NULL,
    "deadlines" TEXT NOT NULL,
    "testingPolicy" TEXT NOT NULL,
    "popularMajors" TEXT NOT NULL,
    "applicationPlatform" TEXT NOT NULL,
    "notes" TEXT,
    "website" TEXT,
    "scholarshipAidNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "essayType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "notes" TEXT,
    "draft" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "grades" TEXT NOT NULL,
    "hoursPerWeek" REAL NOT NULL,
    "weeksPerYear" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "achievementNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT,
    "graduationYear" INTEGER,
    "schoolName" TEXT,
    "gpa" REAL,
    "sat" INTEGER,
    "act" INTEGER,
    "intendedMajors" TEXT NOT NULL,
    "courseworkSummary" TEXT,
    "location" TEXT,
    "interests" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
