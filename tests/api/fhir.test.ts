/**
 * TC-FH001–FH003 — FHIR R4 Endpoint Tests
 *
 * Run: BASE_URL=https://thrive-at-home-pied.vercel.app FHIR_API_KEY=<key> npx tsx tests/api/fhir.test.ts
 * Or via the GitHub Actions workflow which sets env vars from secrets.
 */

const BASE_URL = process.env.BASE_URL ?? 'https://thrive-at-home-pied.vercel.app';
const FHIR_API_KEY = process.env.FHIR_API_KEY ?? '';

/** Minimal valid FHIR R4 ServiceRequest */
const VALID_SERVICE_REQUEST = {
  resourceType: 'ServiceRequest',
  id: 'thrive-test-001',
  status: 'active',
  intent: 'order',
  code: {
    coding: [{ system: 'http://snomed.info/sct', code: '306206005', display: 'Referral to service' }],
  },
  subject: {
    reference: 'Patient/test-patient-001',
    display: 'Test Patient',
  },
  requester: {
    reference: 'Practitioner/dr-test-001',
    display: 'Dr. Test Physician',
  },
  note: [{ text: 'Senior returning home after hip replacement. Needs daily check-in support.' }],
};

type TestResult = { tc: string; passed: boolean; message: string };
const results: TestResult[] = [];

function pass(tc: string, msg: string) {
  results.push({ tc, passed: true, message: msg });
  console.log(`✅ ${tc}: ${msg}`);
}

function fail(tc: string, msg: string) {
  results.push({ tc, passed: false, message: msg });
  console.error(`❌ ${tc}: ${msg}`);
}

function warn(tc: string, msg: string) {
  console.warn(`⚠️  ${tc}: ${msg}`);
}

async function runTests() {
  console.log(`\n=== FHIR R4 API Tests — ${BASE_URL} ===\n`);

  if (!FHIR_API_KEY) {
    fail('TC-FH003', 'FHIR_API_KEY env var not set — cannot run FHIR tests');
    return;
  }

  // ─── TC-FH001 — Valid FHIR ServiceRequest → 200 ──────────────────────────
  try {
    const resp = await fetch(`${BASE_URL}/api/fhir/referrals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FHIR_API_KEY}`,
        'Content-Type': 'application/fhir+json',
      },
      body: JSON.stringify(VALID_SERVICE_REQUEST),
    });

    const body = await resp.json().catch(() => ({}));

    if (resp.status === 200) {
      // Check FHIR OperationOutcome format
      if (body.resourceType === 'OperationOutcome') {
        const severity = body.issue?.[0]?.severity;
        if (severity === 'information') {
          pass('TC-FH001', `Valid FHIR referral accepted: 200 OperationOutcome severity=information`);
        } else {
          fail('TC-FH001', `200 OK but OperationOutcome severity="${severity}", expected "information"`);
        }
      } else {
        warn('TC-FH001', `200 OK but response is not FHIR OperationOutcome: ${JSON.stringify(body).substring(0, 200)}`);
        pass('TC-FH001', '200 OK — referral accepted');
      }
    } else {
      fail('TC-FH001', `Expected 200, got ${resp.status}: ${JSON.stringify(body).substring(0, 300)}`);
    }
  } catch (err) {
    fail('TC-FH001', `Network error: ${err}`);
  }

  // ─── TC-FH002 — Auth reject: no header → 401 ─────────────────────────────
  try {
    const resp = await fetch(`${BASE_URL}/api/fhir/referrals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(VALID_SERVICE_REQUEST),
    });
    if (resp.status === 401) {
      pass('TC-FH002a', 'No auth header → 401 (correct)');
    } else {
      fail('TC-FH002a', `No auth header → ${resp.status}, expected 401`);
    }
  } catch (err) {
    fail('TC-FH002a', `Network error: ${err}`);
  }

  // Wrong key → 401
  try {
    const resp = await fetch(`${BASE_URL}/api/fhir/referrals`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer wrong-key-xyz',
        'Content-Type': 'application/fhir+json',
      },
      body: JSON.stringify(VALID_SERVICE_REQUEST),
    });
    if (resp.status === 401) {
      pass('TC-FH002b', 'Wrong key → 401 (correct)');
    } else {
      fail('TC-FH002b', `Wrong key → ${resp.status}, expected 401`);
    }
  } catch (err) {
    fail('TC-FH002b', `Network error: ${err}`);
  }

  // Valid key + malformed JSON → 422
  try {
    const resp = await fetch(`${BASE_URL}/api/fhir/referrals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FHIR_API_KEY}`,
        'Content-Type': 'application/fhir+json',
      },
      body: '{ this is not valid json }',
    });
    if (resp.status === 422 || resp.status === 400) {
      pass('TC-FH002c', `Malformed JSON → ${resp.status} (correct)`);
    } else {
      fail('TC-FH002c', `Malformed JSON → ${resp.status}, expected 422`);
    }
  } catch (err) {
    fail('TC-FH002c', `Network error: ${err}`);
  }

  // ─── TC-FH003 — Env var presence ─────────────────────────────────────────
  // If we got a 200 above with the FHIR_API_KEY, the env var is set
  if (results.find((r) => r.tc === 'TC-FH001' && r.passed)) {
    pass('TC-FH003', 'FHIR_API_KEY is set in Vercel (inferred from successful auth)');
  } else {
    fail('TC-FH003', 'Could not confirm FHIR_API_KEY set — check Vercel env vars');
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const total  = results.length;
  console.log(`\n=== FHIR Results: ${passed}/${total} passed ===`);
  if (passed < total) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
