import { Client } from "pg";
import "dotenv/config";

async function main() {
  // Test both 6543 and 5432 connection strings
  const urls = [
    { name: "DIRECT_URL (5432)", url: process.env.DIRECT_URL },
    { name: "DATABASE_URL (6543)", url: process.env.DATABASE_URL },
  ];

  for (const item of urls) {
    console.log(`Testing connection to ${item.name}...`);
    if (!item.url) {
      console.log(`- Skipped: URL not defined.`);
      continue;
    }
    const client = new Client({
      connectionString: item.url,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`- ✅ Success! Connected to ${item.name}`);
      const res = await client.query("SELECT COUNT(*) FROM events");
      console.log(`- Query result: total events = ${res.rows[0].count}`);
      await client.end();
    } catch (err) {
      console.log(`- ❌ Failed to connect:`, err);
    }
  }
}

main();
