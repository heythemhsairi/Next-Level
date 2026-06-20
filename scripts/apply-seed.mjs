// Applies supabase/seed_demo.sql via the Supabase Management API.
// Idempotent: the seed deletes prior DEMO rows before inserting.
//
// Usage:
//   SUPABASE_PAT=sbp_xxx SUPABASE_PROJECT_REF=xxx node scripts/apply-seed.mjs

import fs from "node:fs/promises";
import path from "node:path";

const PAT = process.env.SUPABASE_PAT;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!PAT) {
  console.error("Set SUPABASE_PAT env var (a Supabase personal access token).");
  process.exit(1);
}
if (!PROJECT_REF) {
  console.error("Set SUPABASE_PROJECT_REF env var (your project ref).");
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const file = path.join(process.cwd(), "supabase", "seed_demo.sql");
const sql = await fs.readFile(file, "utf8");

process.stdout.write("Seeding demo data ... ");
const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});

if (!res.ok) {
  console.error(`FAILED (${res.status})\n${await res.text()}`);
  process.exit(1);
}
console.log("OK — demo data seeded. Reload the dashboard to see the numbers.");
