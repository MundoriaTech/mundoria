import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, imports = {}, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports, require: name => name in imports ? imports[name] : require(name), Date, URL, URLSearchParams, ...globals }, { filename: path });
  return module.exports;
}
const urls = load("lib/cleaner/document-urls.ts");
const mapping = load("lib/zoho/recruit-mapping.ts", { "@/lib/cleaner/document-urls": urls });
const clean = value => JSON.parse(JSON.stringify(value));

function completeCleaner() {
  return {
    id: "11111111-1111-4111-8111-111111111111", years_experience: 3,
    onboarding_complete: true, application_reference: "INTERNAL-TEST",
    skills_exam_completed_at: "2026-11-23T12:00:00Z", skills_exam_score: 90, skills_exam_passed: true,
    interview_status: "completed", utr_number: "TEST-NOT-REAL", insurance_expiry_date: "2027-11-23",
    headshot_url: "private/photo", headshot_status: "verified", id_document_url: '["private/front","private/back"]', id_document_status: "verified",
    dbs_document_url: '["private/dbs"]', dbs_document_status: "verified", utr_document_url: "private/utr", utr_document_status: "verified",
    insurance_certificate_url: "private/insurance", insurance_status: "verified", specialist_review_required: false,
  };
}

test("receiving a file does not approve it, and stale approval without a file is missing", () => {
  assert.equal(mapping.recruitDocumentStatus("pending", "private/file"), "Uploaded");
  assert.equal(mapping.recruitDocumentStatus("verified", '["",null]'), "Not Uploaded");
  assert.equal(mapping.recruitDocumentStatus("rejected", "private/file"), "Rejected");
  assert.equal(mapping.recruitDocumentStatus("expired", "private/file"), "Expired");
});

test("submission maps assessment and saved availability without claiming completed onboarding", () => {
  const fields = mapping.cleanerRecruitFields(completeCleaner(), [{ postcode_prefix: "B1" }], [{ day_of_week: 1, start_time: "09:00", end_time: "12:00", is_available: true }], [{ service_type: "home", is_active: true }], "2026-11-23");
  assert.equal(fields.Assessment_Result, "Passed");
  assert.equal(fields.Application_Submitted_At, "2026-11-23T12:00:00+00:00");
  assert.equal(fields.Cleaner_Availability, "Monday 09:00–12:00");
  for (const protectedField of ["Cleaner_Lifecycle_Stage", "Activation_Review", "Onboarding_Completion_Status", "Right_to_Work_Status", "Proof_of_Address_Status", "Other_Documents_Status"]) assert.equal(protectedField in fields, false);
  assert.doesNotMatch(JSON.stringify(fields), /private\/|TEST-NOT-REAL/);
  assert.equal(fields.Secure_Cleaner_Record, "https://www.mundoria.co.uk/admin/cleaners/11111111-1111-4111-8111-111111111111");
});

test("a previously verified insurance certificate expires in Recruit without re-approval", () => {
  const fields = mapping.cleanerRecruitFields({ ...completeCleaner(), insurance_expiry_date: "2026-11-22" }, [], [], [], "2026-11-23");
  assert.equal(fields.Insurance_Status, "Expired");
});

test("a passed quiz with an outstanding specialist assessment still requires review", () => {
  const fields = mapping.cleanerRecruitFields({ ...completeCleaner(), specialist_review_required: true });
  assert.equal(fields.Assessment_Result, "Review Required");
});

test("activation fails for each missing mandatory file even if its old status is verified", () => {
  for (const field of ["headshot_url", "id_document_url", "dbs_document_url", "utr_document_url", "insurance_certificate_url"]) {
    assert.ok(mapping.incompleteActivationRequirements({ ...completeCleaner(), [field]: null }, "2026-11-23").length > 0, field);
  }
  assert.deepEqual(clean(mapping.incompleteActivationRequirements(completeCleaner(), "2026-11-23")), []);
});

test("activation fails for pending reviews, incomplete call/assessment, invalid dates and specialist review", () => {
  for (const change of [
    { id_document_status: "pending" }, { dbs_document_status: "rejected" },
    { interview_status: "scheduled" }, { skills_exam_passed: false },
    { insurance_expiry_date: "2026-11-22" }, { insurance_expiry_date: "2027-02-30" },
    { insurance_expiry_date: null }, { specialist_review_required: true }, { utr_number: " " },
  ]) assert.ok(mapping.incompleteActivationRequirements({ ...completeCleaner(), ...change }, "2026-11-23").length > 0, JSON.stringify(change));
});

function recruitHarness({ allow = true, failField = false, failAll = false, workflow = false } = {}) {
  const calls = [], errors = [];
  let upserts = 0;
  const api = load("lib/zoho/recruit.ts", {
    "@sentry/nextjs": { captureException: error => errors.push(error.message) },
    "@/lib/zoho/preview": { maySyncZohoEmail: () => allow },
    "@/lib/zoho/http": {
      zohoOrigin: value => value,
      zohoErrorCode: code => code,
      readZohoRecordResult: response => response.result,
      zohoFetch: async (url, init) => {
        if (url.includes("oauth/v2/token")) return { ok: true, json: async () => ({ access_token: "test-only", expires_in: 3600 }) };
        calls.push(JSON.parse(init.body)); upserts++;
        return { ok: !failAll, status: failAll ? 500 : 200, result: failAll ? { status: "error", code: "ERROR" } : failField && upserts === 1 ? { status: "error", details: { api_name: "Additional_Info" } } : { status: "success", details: { id: "test-candidate" } } };
      },
    },
  }, { process: { env: { ZOHO_RECRUIT_CLIENT_ID: "test", ZOHO_RECRUIT_CLIENT_SECRET: "test", ZOHO_RECRUIT_REFRESH_TOKEN: "test", ZOHO_RECRUIT_TRIGGER_WORKFLOWS: String(workflow) } } });
  return { api, calls, errors };
}
const person = { email: "test@example.invalid", fullName: "Internal Test", userId: "test-id" };

test("rich upserts deduplicate by website ID/email, suppress workflows and preserve identity", async () => {
  const h = recruitHarness();
  assert.equal((await h.api.upsertZohoCandidate(person, {}, { Mundoria_User_ID: "test-id", Email: "wrong@example.invalid" })).status, "synced");
  assert.deepEqual(h.calls[0].duplicate_check_fields, ["Mundoria_User_ID", "Email"]);
  assert.deepEqual(h.calls[0].trigger, []);
  assert.equal(h.calls[0].data[0].Email, person.email);
});

test("Additional Info fallback preserves custom fields and never reports failed upsert as success", async () => {
  const h = recruitHarness({ failField: true });
  await h.api.upsertZohoCandidate(person, {}, { Government_ID_Status: "Uploaded" });
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].data[0].Government_ID_Status, "Uploaded");
  const failed = recruitHarness({ failAll: true });
  assert.equal((await failed.api.upsertZohoCandidate(person, {}, {})).status, "failed");
  assert.equal(failed.errors.length, 1);
});

test("legacy basic signup behavior is preserved and preview guard prevents any API request", async () => {
  const legacy = recruitHarness();
  await legacy.api.upsertZohoCandidate(person);
  assert.equal("trigger" in legacy.calls[0], false);
  assert.deepEqual(legacy.calls[0].duplicate_check_fields, ["Email"]);
  const preview = recruitHarness({ allow: false });
  assert.equal((await preview.api.upsertZohoCandidate(person, {}, {})).status, "skipped");
  assert.equal(preview.calls.length, 0);
});
