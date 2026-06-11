import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "cmlo@gs.keichi.edu.hk";

  const user = await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name:  adminEmail.split("@")[0],
      role:  "ADMIN",
    },
  });

  console.log(`✓ Admin set: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
