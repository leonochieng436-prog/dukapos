/**
 * SEED SCRIPT
 * ===========
 * Two distinct jobs, and it's important they stay separate:
 *
 * 1. GLOBAL CATALOG (not tenant-scoped): the `Permission` table. This is
 *    seeded once per deployment/environment, the same way for every
 *    tenant. Run this in production too, after every migration that adds
 *    a new permission key.
 *
 * 2. DEMO TENANT (dev/staging only): "Leon Retail Store" with branches,
 *    products, suppliers, customers, and enough purchases/sales/expenses
 *    that the dashboard looks like a real, lived-in business rather than
 *    an empty shell. NEVER run this against production.
 *
 * Usage: npx prisma db seed  (wired via package.json "prisma.seed")
 */
import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, PERMISSION_GROUPS } from "../src/lib/rbac/permissions";
import { hashPassword } from "../src/server/auth/password";
import {
  provisionSystemRoles,
  provisionDefaultExpenseCategories,
  provisionDefaultSettings,
} from "../src/server/services/organization-core";

const prisma = new PrismaClient();

async function seedPermissionCatalog() {
  for (const [group, keys] of Object.entries(PERMISSION_GROUPS)) {
    for (const key of keys) {
      await prisma.permission.upsert({
        where: { key },
        update: { group, label: humanize(key) },
        create: { key, group, label: humanize(key) },
      });
    }
  }
  console.log(`Seeded ${Object.keys(PERMISSIONS).length} permissions.`);
}

function humanize(key: string) {
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

async function seedDemoTenant() {
  const existing = await prisma.organization.findUnique({
    where: { slug: "leon-retail-store" },
  });
  if (existing) {
    await provisionSystemRoles(prisma, existing.id);
    await provisionDefaultSettings(prisma, existing.id);
    console.log("Demo tenant already exists, skipping.");
    return;
  }

  const org = await prisma.organization.create({
    data: {
      name: "Leon Retail Store",
      slug: "leon-retail-store",
      legalName: "Leon Retail Store Ltd",
      taxPin: "P051234567X",
      businessType: "retail",
      country: "KE",
      currency: "KES",
      phone: "+254712345678",
      email: "hello@leonretail.co.ke",
    },
  });

  const roles = await provisionSystemRoles(prisma, org.id);
  await provisionDefaultExpenseCategories(prisma, org.id);
  await provisionDefaultSettings(prisma, org.id);

  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: "growth",
      status: "active",
      branchLimit: 5,
      userLimit: 25,
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  // ── Branches ────────────────────────────────────────────────────
  const nairobi = await prisma.branch.create({
    data: { organizationId: org.id, name: "Nairobi Branch", code: "NBO" },
  });
  const mombasa = await prisma.branch.create({
    data: { organizationId: org.id, name: "Mombasa Branch", code: "MSA" },
  });

  const nairobiWarehouse = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      branchId: nairobi.id,
      name: "Nairobi Main Warehouse",
      isDefault: true,
    },
  });
  const mombasaWarehouse = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      branchId: mombasa.id,
      name: "Mombasa Warehouse",
      isDefault: true,
    },
  });

  const nairobiRegister = await prisma.register.create({
    data: { branchId: nairobi.id, name: "Register 1" },
  });
  await prisma.register.create({
    data: { branchId: nairobi.id, name: "Register 2" },
  });
  const mombasaRegister = await prisma.register.create({
    data: { branchId: mombasa.id, name: "Register 1" },
  });

  // ── Users ───────────────────────────────────────────────────────
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";
  const owner = await prisma.user.create({
    data: {
      name: "Leon Otieno",
      email: "owner@leonretail.co.ke",
      passwordHash: await hashPassword(ownerPassword),
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userOrganization.create({
    data: { userId: owner.id, organizationId: org.id, roleId: roles.owner.id, isOwner: true },
  });

  const cashierPassword = process.env.SEED_CASHIER_PASSWORD ?? "ChangeMe123!";
  const cashier = await prisma.user.create({
    data: {
      name: "Grace Wanjiru",
      email: "cashier@leonretail.co.ke",
      passwordHash: await hashPassword(cashierPassword),
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userOrganization.create({
    data: { userId: cashier.id, organizationId: org.id, roleId: roles.cashier.id },
  });
  await prisma.userBranch.create({ data: { userId: cashier.id, branchId: nairobi.id } });

  console.log("Demo login credentials:");
  console.log(`  Owner:   owner@leonretail.co.ke / ${ownerPassword}`);
  console.log(`  Cashier: cashier@leonretail.co.ke / ${cashierPassword}`);
  console.log(
    "  (Override with SEED_OWNER_PASSWORD / SEED_CASHIER_PASSWORD env vars.)"
  );

  // ── Categories & brands ─────────────────────────────────────────
  const [beverages, cosmetics, electronics, household] = await Promise.all(
    ["Beverages", "Cosmetics", "Electronics", "Household"].map((name) =>
      prisma.category.create({ data: { organizationId: org.id, name } })
    )
  );
  const [cocaCola, nivea, samsung] = await Promise.all(
    ["Coca-Cola", "Nivea", "Samsung"].map((name) =>
      prisma.brand.create({ data: { organizationId: org.id, name } })
    )
  );

  const vat = await prisma.taxRate.create({
    data: { organizationId: org.id, name: "VAT 16%", rate: 16, isDefault: true },
  });
  const zeroRated = await prisma.taxRate.create({
    data: { organizationId: org.id, name: "Zero-rated", rate: 0 },
  });

  // ── Suppliers ───────────────────────────────────────────────────
  const abcDistributors = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: "ABC Distributors",
      companyName: "ABC Distributors Ltd",
      phone: "+254700111222",
      email: "sales@abcdistributors.co.ke",
      paymentTerms: "Net 30",
      taxPin: "P051112223X",
    },
  });
  const kenyaWholesale = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: "Kenya Wholesale Ltd",
      companyName: "Kenya Wholesale Ltd",
      phone: "+254700333444",
      email: "orders@kenyawholesale.co.ke",
      paymentTerms: "Net 14",
      taxPin: "P051334445X",
    },
  });

  // ── Products (with a single default variant each) ──────────────
  type SeedProduct = {
    name: string;
    categoryId: string;
    brandId?: string;
    unit: string;
    cost: number;
    price: number;
    taxRateId: string;
    barcode: string;
    minStock: number;
    reorderLevel: number;
    openingQty: number;
  };

  const seedProducts: SeedProduct[] = [
    {
      name: "Coca-Cola 500ml",
      categoryId: beverages.id,
      brandId: cocaCola.id,
      unit: "bottle",
      cost: 45,
      price: 70,
      taxRateId: vat.id,
      barcode: "5449000000996",
      minStock: 24,
      reorderLevel: 48,
      openingQty: 200,
    },
    {
      name: "Coca-Cola 1L",
      categoryId: beverages.id,
      brandId: cocaCola.id,
      unit: "bottle",
      cost: 80,
      price: 120,
      taxRateId: vat.id,
      barcode: "5449000000997",
      minStock: 12,
      reorderLevel: 24,
      openingQty: 120,
    },
    {
      name: "Nivea Body Lotion 400ml",
      categoryId: cosmetics.id,
      brandId: nivea.id,
      unit: "bottle",
      cost: 380,
      price: 550,
      taxRateId: vat.id,
      barcode: "4005808217463",
      minStock: 6,
      reorderLevel: 12,
      openingQty: 40,
    },
    {
      name: "Nivea Roll-On Deodorant",
      categoryId: cosmetics.id,
      brandId: nivea.id,
      unit: "piece",
      cost: 210,
      price: 320,
      taxRateId: vat.id,
      barcode: "4005808217464",
      minStock: 10,
      reorderLevel: 20,
      openingQty: 60,
    },
    {
      name: "Samsung Phone Charger (Type-C)",
      categoryId: electronics.id,
      brandId: samsung.id,
      unit: "piece",
      cost: 650,
      price: 950,
      taxRateId: vat.id,
      barcode: "8806094356781",
      minStock: 5,
      reorderLevel: 10,
      openingQty: 25,
    },
    {
      name: "Maize Flour 2kg",
      categoryId: household.id,
      unit: "bag",
      cost: 165,
      price: 210,
      taxRateId: zeroRated.id,
      barcode: "6161100001234",
      minStock: 20,
      reorderLevel: 40,
      openingQty: 150,
    },
  ];

  for (const p of seedProducts) {
    const product = await prisma.product.create({
      data: {
        organizationId: org.id,
        categoryId: p.categoryId,
        brandId: p.brandId,
        primarySupplierId:
          p.categoryId === electronics.id ? abcDistributors.id : kenyaWholesale.id,
        name: p.name,
        unit: p.unit,
        type: "STOCKED",
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        organizationId: org.id,
        productId: product.id,
        sku: `${product.id.slice(-6).toUpperCase()}-DEF`,
        name: p.name,
        costPrice: p.cost,
        sellingPrice: p.price,
        wholesalePrice: Math.round(p.price * 0.9 * 100) / 100,
        taxRateId: p.taxRateId,
        minStock: p.minStock,
        reorderLevel: p.reorderLevel,
      },
    });

    await prisma.productBarcode.create({
      data: { variantId: variant.id, barcode: p.barcode },
    });

    // Opening balance for both branches' warehouses, recorded as proper
    // inventory movements — never a bare quantity write.
    for (const wh of [nairobiWarehouse, mombasaWarehouse]) {
      const qty = wh.id === nairobiWarehouse.id ? p.openingQty : Math.round(p.openingQty * 0.4);
      const batch = await prisma.batch.create({
        data: {
          organizationId: org.id,
          warehouseId: wh.id,
          variantId: variant.id,
          batchNumber: "OPENING",
          unitCost: p.cost,
          quantityIn: qty,
          quantityLeft: qty,
        },
      });
      await prisma.inventoryItem.create({
        data: {
          organizationId: org.id,
          warehouseId: wh.id,
          variantId: variant.id,
          batchId: batch.id,
          quantity: qty,
          averageCost: p.cost,
        },
      });
      await prisma.inventoryMovement.create({
        data: {
          organizationId: org.id,
          warehouseId: wh.id,
          variantId: variant.id,
          batchId: batch.id,
          type: "OPENING_BALANCE",
          quantity: qty,
          unitCost: p.cost,
          referenceType: "Seed",
          createdById: owner.id,
        },
      });
    }
  }

  // ── Customers ───────────────────────────────────────────────────
  const walkIn = await prisma.customer.create({
    data: { organizationId: org.id, name: "Walk-in Customer", isWalkIn: true, category: "REGULAR" },
  });
  await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: "John Otieno",
      phone: "+254722000111",
      category: "REGULAR",
      creditLimit: 10000,
    },
  });
  await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: "Mary Achieng",
      phone: "+254733000222",
      category: "VIP",
      creditLimit: 25000,
    },
  });

  // ── A representative expense so the dashboard isn't empty ──────
  const rentCategory = await prisma.expenseCategory.findFirstOrThrow({
    where: { organizationId: org.id, name: "Rent" },
  });
  await prisma.expense.create({
    data: {
      organizationId: org.id,
      branchId: nairobi.id,
      categoryId: rentCategory.id,
      amount: 45000,
      paymentMethod: "bank",
      description: "Nairobi branch monthly rent",
      createdById: owner.id,
    },
  });

  console.log(`Seeded demo tenant "${org.name}" with 2 branches, ${seedProducts.length} products.`);
  console.log(
    `(Registers created: ${nairobiRegister.name}/Register 2 at Nairobi, ${mombasaRegister.name} at Mombasa.)`
  );
  console.log(`Customers include: ${walkIn.name}, John Otieno, Mary Achieng.`);
}

async function main() {
  await seedPermissionCatalog();
  if (process.env.NODE_ENV !== "production") {
    await seedDemoTenant();
  } else {
    console.log("NODE_ENV=production: skipping demo tenant seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
