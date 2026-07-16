import { prisma } from "../lib/prisma";

async function main() {
  console.log("Querying events from database using Prisma Client with pg Driver Adapter...");
  const events = await prisma.events.findMany({
    take: 5,
  });
  console.log(`✅ Success! Retrieved ${events.length} events:`);
  events.forEach((e) => {
    console.log(`- ${e.name} (${e.code})`);
  });
}

main()
  .catch((err) => {
    console.error("❌ Test failed:", err);
  })
  .finally(() => {
    // We don't call prisma.$disconnect() here because pool needs to be shut down, 
    // but Prisma handles it. Let's just exit.
    process.exit(0);
  });
