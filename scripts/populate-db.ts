import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";
import "dotenv/config";

const SQL_FILE_PATH = path.join(__dirname, "../docs/projects/skema-database-kartjis.sql");
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error("❌ DIRECT_URL is not defined in environment variables.");
  process.exit(1);
}

async function run() {
  console.log("Reading SQL dump file...");
  let sqlText = fs.readFileSync(SQL_FILE_PATH, "utf8");

  // Clean the SQL: remove psql client commands like \restrict or \connect
  console.log("Cleaning SQL DDL statements...");
  const sqlLines = sqlText.split("\n");
  const cleanedLines = sqlLines.filter((line) => {
    const trimmed = line.trim();
    // Filter out psql commands starting with backslash (e.g. \restrict)
    if (trimmed.startsWith("\\")) {
      return false;
    }
    // Filter out CREATE SCHEMA public if it already exists to avoid errors
    if (trimmed.startsWith("CREATE SCHEMA public;") || trimmed.startsWith("ALTER SCHEMA public OWNER")) {
      return false;
    }
    // Filter out ALTER ... OWNER TO ... statements
    if (trimmed.toUpperCase().includes("OWNER TO")) {
      return false;
    }
    // Filter out GRANT and REVOKE DDL statements
    if (trimmed.toUpperCase().startsWith("GRANT ") || trimmed.toUpperCase().startsWith("REVOKE ")) {
      return false;
    }
    // Filter out any line mentioning kartjis_app (since role does not exist)
    if (trimmed.toLowerCase().includes("kartjis_app")) {
      return false;
    }
    return true;
  });
  
  sqlText = cleanedLines.join("\n");

  console.log("Connecting to Supabase PostgreSQL database using DIRECT_URL...");
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected! Executing SQL schema dump (this might take a few seconds)...");
    
    // Execute DDL queries
    await client.query(sqlText);
    
    console.log("✅ DDL Schema execution completed successfully!");
  } catch (error) {
    console.error("❌ Error executing schema DDL:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
