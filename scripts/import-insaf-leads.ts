/**
 * Safe, repeatable INSAF IBDC lead import.
 * Default mode is DRY RUN. Actual inserts require --apply.
 * No deletes, updates, schema changes, seeds, or migrations are performed.
 */
import fs from "node:fs";
import path from "node:path";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "../src/db";
import { leads } from "../src/db/schema";

type SourceLead = {
  sourceLeadId?: string; sourceDate?: string; companyId?: string; name?: string; phone?: string; whatsapp?: string;
  location?: string; source?: string; service?: string; requirement?: string; landSize?: string; roadWidth?: string;
  budget?: string | number; priority?: string; status?: string; nextFollowUpDate?: string; nextFollowUpTime?: string;
  originalStatus?: string; originalPriority?: string; originalServiceType?: string; originalClientRequirement?: string;
  originalInsafResponse?: string; originalRemarks?: string; originalReminder1?: string; originalReminder2?: string;
  originalReminder3?: string; needsReview?: boolean; [key: string]: unknown;
};

const apply = process.argv.includes("--apply");
const input = path.resolve(process.cwd(), "lead-import-review/leads-import-review.json");
const validStatuses = new Set(["New", "Contacted", "Follow-up", "Qualified", "Quotation", "Negotiating", "Won", "Lost", "On Hold"]);
const validPriorities = new Set(["Hot", "Warm", "Cold"]);
const clean = (v: unknown) => String(v ?? "").trim();
const safeDate = (v: unknown) => { const s = clean(v); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };

async function main() {
  if (!fs.existsSync(input)) throw new Error(`JSON file not found: ${input}`);
  const records = JSON.parse(fs.readFileSync(input, "utf8")) as SourceLead[];
  if (!Array.isArray(records) || records.length !== 342) throw new Error(`Expected 342 records, found ${Array.isArray(records) ? records.length : "invalid JSON"}. No changes made.`);

  const existing = await db.select({ id: leads.id, leadCode: leads.leadCode, companyId: leads.companyId, name: leads.name, phone: leads.phone, requirement: leads.requirement }).from(leads);
  const knownCodes = new Set(existing.map(x => x.leadCode));
  const sourceMarkers = new Set(existing.map(x => (x.requirement || "").match(/\[Import Source ID: (L-\d+)\]/)?.[1]).filter(Boolean) as string[]);
  const planned: Array<{ src: SourceLead; values: typeof leads.$inferInsert }> = [];
  const skipped: string[] = [];
  const review: string[] = [];
  let codeCounter = 1;

  for (const src of records) {
    const sourceId = clean(src.sourceLeadId) || `ROW-${records.indexOf(src) + 1}`;
    if (sourceMarkers.has(sourceId)) { skipped.push(`${sourceId}: already imported (source marker)`); continue; }
    const nameOriginal = clean(src.name);
    const phoneOriginal = clean(src.phone);
    const name = nameOriginal || `Demo Lead ${sourceId}`;
    // Demo-only placeholder for the required phone field; never use it for calls/WhatsApp.
    // The original blank is explicitly preserved in Requirement below.
    const phone = phoneOriginal || "0000000000";
    // Existing same-company exact name+phone is treated as a possible duplicate, never inserted automatically.
    const duplicate = existing.some(x => x.companyId === 1 && x.name.trim().toLowerCase() === nameOriginal.toLowerCase() && x.phone.trim() === phoneOriginal && nameOriginal && phoneOriginal);
    if (duplicate) { skipped.push(`${sourceId}: possible existing duplicate ${nameOriginal} / ${phoneOriginal}`); continue; }

    let leadCode = "";
    while (!leadCode || knownCodes.has(leadCode)) leadCode = `LEAD-IMP-${String(codeCounter++).padStart(4, "0")}`;
    knownCodes.add(leadCode);
    const sourceLines = [
      `[Import Source ID: ${sourceId}]`,
      `Original source date: ${clean(src.sourceDate) || "Not provided"}`,
      `Original name: ${nameOriginal || "[blank in source; demo name used in CRM]"}`,
      `Original phone: ${phoneOriginal || "[blank in source; demo phone 0000000000 used in CRM]"}`,
      `Original WhatsApp: ${clean(src.whatsapp) || "[blank in source]"}`,
      `Original status: ${clean(src.originalStatus) || clean(src.status) || "[blank in source]"}`,
      `Original priority: ${clean(src.originalPriority) || clean(src.priority) || "[blank in source]"}`,
      `Original service type: ${clean(src.originalServiceType) || clean(src.service) || "[blank in source]"}`,
      `Client Requirement: ${clean(src.originalClientRequirement)}`,
      `INSAF Response: ${clean(src.originalInsafResponse)}`,
      `Remarks: ${clean(src.originalRemarks)}`,
      `Reminder 1: ${clean(src.originalReminder1)}`,
      `Reminder 2: ${clean(src.originalReminder2)}`,
      `Reminder 3: ${clean(src.originalReminder3)}`,
      `Source notes: ${clean(src.requirement)}`,
      `Review required: ${src.needsReview ? "YES - original fields preserved below" : "No"}`,
    ].filter((line, i) => i < 9 || !line.endsWith(": "));
    if (src.needsReview || !nameOriginal || !phoneOriginal || /^https?:\/\//i.test(phoneOriginal)) review.push(`${sourceId}: review recommended (source values preserved in Requirement)`);

    const status = validStatuses.has(clean(src.status)) ? clean(src.status) : "New";
    const rawPriority = clean(src.priority).replace(/^.*?(Hot|Warm|Cold).*$/i, "$1");
    const priority = validPriorities.has(rawPriority) ? rawPriority : "Warm";
    const budgetNum = Number(src.budget ?? 0);
    const values: typeof leads.$inferInsert = {
      leadCode, companyId: 1, name, phone, whatsapp: clean(src.whatsapp), location: clean(src.location),
      source: clean(src.source) || "Direct", service: clean(src.service) || "Other", propertyType: "Other",
      projectName: "", unitFlatShop: "", preferredLocation: "", size: "", floor: "", bedrooms: "", purpose: "",
      expectedPurchaseDate: "", clientRequirement: clean(src.originalClientRequirement), requirement: sourceLines.join("\n"),
      landSize: clean(src.landSize), roadWidth: clean(src.roadWidth), budget: Number.isFinite(budgetNum) && budgetNum >= 0 ? budgetNum.toFixed(2) : "0.00",
      priority, status, lastContactDate: safeDate(src.sourceDate), nextFollowUpTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(clean(src.nextFollowUpTime)) ? clean(src.nextFollowUpTime) : "10:00",
      assignedStaffId: null, nextFollowUpDate: safeDate(src.nextFollowUpDate), convertedClientId: null,
    };
    planned.push({ src, values });
  }

  console.log(`Mode: ${apply ? "APPLY (INSERT ONLY)" : "DRY RUN (no database changes)"}`);
  console.log(`Source records: ${records.length}`);
  console.log(`Will insert: ${planned.length}`);
  console.log(`Skipped as already imported / possible duplicates: ${skipped.length}`);
  console.log(`Review recommended: ${review.length}`);
  if (skipped.length) console.log("\nSkipped records:\n" + skipped.join("\n"));
  if (review.length) console.log("\nReview records:\n" + review.join("\n"));
  if (!apply) { console.log("\nDry run only. To insert the planned records, run: npx tsx scripts/import-insaf-leads.ts --apply"); return; }

  // Insert one record at a time. If interrupted, rerunning skips records by the source marker.
  let inserted = 0;
  for (const item of planned) {
    const sourceId = clean(item.src.sourceLeadId);
    const marker = sourceId ? `[Import Source ID: ${sourceId}]` : "";
    if (marker) {
      const already = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.companyId, 1), ilike(leads.requirement, `%${marker}%`))).limit(1);
      if (already.length) continue;
    }
    await db.insert(leads).values(item.values);
    inserted++;
    if (inserted % 25 === 0) console.log(`Inserted ${inserted}/${planned.length}`);
  }
  console.log(`Finished. Inserted ${inserted}; no existing rows were updated or deleted.`);
}

main().catch(error => { console.error("Import stopped; review error before retrying:", error); process.exitCode = 1; });
