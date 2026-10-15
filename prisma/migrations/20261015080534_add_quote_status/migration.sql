-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuoteRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BARU',
    "offeredPrice" INTEGER,
    "replyNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuoteRequest" ("businessName", "contactName", "createdAt", "id", "note", "phone", "productId", "quantity", "status", "supplierId", "unitPrice") SELECT "businessName", "contactName", "createdAt", "id", "note", "phone", "productId", "quantity", "status", "supplierId", "unitPrice" FROM "QuoteRequest";
DROP TABLE "QuoteRequest";
ALTER TABLE "new_QuoteRequest" RENAME TO "QuoteRequest";
CREATE INDEX "QuoteRequest_supplierId_createdAt_idx" ON "QuoteRequest"("supplierId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
