import fs from "node:fs";
import pg from "pg";

// ⬇️ ধাপ ২-এ যে নাম পেয়েছেন সেটা এখানে দিন
const VAR_NAME = "DATABASE_URL";

const env = fs.readFileSync(".env.local", "utf8");
const line = env.split(/\r?\n/).find((l) => l.trim().startsWith(VAR_NAME + "="));
if (!line) {
  console.error(`❌ .env.local-এ ${VAR_NAME} পাওয়া যায়নি`);
  process.exit(1);
}
const url = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");

const client = new pg.Client({ connectionString: url });
await client.connect();

await client.query(`
  ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS lead_date      text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS insaf_response text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS remarks        text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS reminder1      text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS reminder2      text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS reminder3      text NOT NULL DEFAULT '';
`);

const { rows } = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'leads'
    AND column_name IN ('lead_date','insaf_response','remarks','reminder1','reminder2','reminder3')
  ORDER BY column_name;
`);
console.log("✅ Columns:", rows.map((r) => r.column_name).join(", "));

const count = await client.query("SELECT COUNT(*) FROM leads");
console.log("📊 মোট লিড:", count.rows[0].count);

await client.end();