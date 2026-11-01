CREATE TYPE "InquiryStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'IN_PROGRESS',
    'RESOLVED',
    'SPAM'
);

CREATE TYPE "InquiryNotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);

CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneDigits" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessType" TEXT,
    "numberOfLocations" TEXT,
    "currentSystem" TEXT,
    "subject" TEXT NOT NULL,
    "productOrService" TEXT,
    "message" TEXT NOT NULL,
    "productId" TEXT,
    "productUrl" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "ipHash" TEXT,
    "notificationStatus" "InquiryNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inquiries_submissionKey_key" ON "inquiries"("submissionKey");
CREATE INDEX "inquiries_status_createdAt_idx" ON "inquiries"("status", "createdAt");
CREATE INDEX "inquiries_createdAt_idx" ON "inquiries"("createdAt");
CREATE INDEX "inquiries_ipHash_createdAt_idx" ON "inquiries"("ipHash", "createdAt");
CREATE INDEX "inquiries_phone_createdAt_idx" ON "inquiries"("phone", "createdAt");
CREATE INDEX "inquiries_phoneDigits_createdAt_idx" ON "inquiries"("phoneDigits", "createdAt");
CREATE INDEX "inquiries_email_createdAt_idx" ON "inquiries"("email", "createdAt");
