import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const db = new PrismaClient({ adapter });

type SeedUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "CUSTOMER" | "ADMIN";
};

const seedUsers: SeedUser[] = [
  {
    id: "usr_admin_seed",
    name: "Admin Kitchen",
    email: "admin@fnb.local",
    password: "Admin12345",
    role: "ADMIN",
  },
  {
    id: "usr_customer_seed",
    name: "Demo Customer",
    email: "customer@fnb.local",
    password: "Customer12345",
    role: "CUSTOMER",
  },
];

const seedMenu = [
  {
    id: "menu_nasi_goreng",
    name: "Nasi Goreng Kampung",
    description: "Wok-fried rice with chicken, sweet soy sauce, and a fried egg.",
    price: 32000,
    category: "FOOD",
    imageUrl: null,
  },
  {
    id: "menu_mie_ayam",
    name: "Mie Ayam Bakso",
    description: "Egg noodles with seasoned chicken, meatballs, and rich broth.",
    price: 30000,
    category: "FOOD",
    imageUrl: null,
  },
  {
    id: "menu_sate_ayam",
    name: "Sate Ayam Madura",
    description: "Ten skewers of grilled chicken with peanut sauce and lontong.",
    price: 38000,
    category: "FOOD",
    imageUrl: null,
  },
  {
    id: "menu_ayam_geprek",
    name: "Ayam Geprek Sambal Ijo",
    description: "Crispy fried chicken with fiery green chili sambal and rice.",
    price: 35000,
    category: "FOOD",
    imageUrl: null,
  },
  {
    id: "menu_es_teh",
    name: "Es Teh Manis",
    description: "Classic sweet iced tea brewed fresh every morning.",
    price: 8000,
    category: "DRINK",
    imageUrl: null,
  },
  {
    id: "menu_es_jeruk",
    name: "Es Jeruk Peras",
    description: "Freshly squeezed orange juice served over ice.",
    price: 12000,
    category: "DRINK",
    imageUrl: null,
  },
  {
    id: "menu_kopi_susu",
    name: "Kopi Susu Gula Aren",
    description: "Double espresso, milk, and palm sugar over ice.",
    price: 22000,
    category: "DRINK",
    imageUrl: null,
  },
  {
    id: "menu_matcha",
    name: "Matcha Latte",
    description: "Ceremonial-grade matcha whisked with fresh milk.",
    price: 25000,
    category: "DRINK",
    imageUrl: null,
  },
];

async function seedUser(user: SeedUser) {
  const passwordHash = await hashPassword(user.password);

  await db.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      role: user.role,
      emailVerified: true,
    },
    create: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: true,
      role: user.role,
    },
  });

  const existingAccount = await db.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (!existingAccount) {
    await db.account.create({
      data: {
        id: `acc_${user.id}`,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
  } else {
    await db.account.update({
      where: { id: existingAccount.id },
      data: { password: passwordHash },
    });
  }
}

async function main() {
  for (const user of seedUsers) {
    await seedUser(user);
  }

  for (const item of seedMenu) {
    await db.menuItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        isAvailable: true,
      },
      create: item,
    });
  }

  console.log("Seed complete.");
  console.log("Admin    : admin@fnb.local / Admin12345");
  console.log("Customer : customer@fnb.local / Customer12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
