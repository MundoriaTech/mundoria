// Isolated tests: no credentials, database or real network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const m = new Module(filename, module);
  cache.set(filename, m);
  m.filename = filename;
  m.paths = module.paths;
  m.require = id => id.startsWith('@/') ? load(id.slice(2) + '.ts') : require(id);
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
  return m.exports;
}
const { onboardingEvent, rescheduledEvent } = load('lib/zoho/calendar-event.ts');
const { calendarClient, CalendarFailure } = load('lib/zoho/calendar.ts');
const { zohoOrigin } = load('lib/zoho/http.ts');
const { redactCalendarTelemetry } = load('lib/zoho/calendar-telemetry.ts');
const config = { clientId: 'test-id', secret: 'test-secret', refresh: 'test-refresh', uid: 'test-calendar',
  host: 'host@example.com', instructions: 'Test only', accounts: 'https://accounts.zoho.com', origin: 'https://calendar.zoho.com' };
const input = { cleanerId: 'test-cleaner', email: 'cleaner@example.com', host: 'host@example.com',
  startsAt: '2027-06-10T10:00:00+01:00', instructions: 'We will call at the booked time.' };

test('London summer and winter instants retain the correct 30-minute duration', () => {
  assert.deepEqual(onboardingEvent(input).dateandtime, { start: '20270610T090000Z', end: '20270610T093000Z', timezone: 'Europe/London' });
  assert.equal(onboardingEvent({ ...input, startsAt: '2027-01-10T10:00:00Z' }).dateandtime.start, '20270110T100000Z');
});
test('invite includes only the cleaner and host, with no conferencing purchase or document payload', () => {
  const event = onboardingEvent(input);
  assert.equal(event.isprivate, true);
  assert.equal(event.notify_attendee, 2);
  assert.equal(event.conference, 'none');
  assert.equal(event.allowForwarding, false);
  assert.deepEqual(event.attendees.map(x => x.email), ['cleaner@example.com', 'host@example.com']);
  assert.ok(!('attach' in event));
});
test('same host and cleaner email is not invited twice', () => {
  assert.equal(onboardingEvent({ ...input, email: ' HOST@example.com ' }).attendees.length, 1);
});
test('rescheduling preserves attendee RSVP, notes and the latest ETag', () => {
  const current = { ...onboardingEvent(input), uid: 'event-1', etag: 123,
    attendees: [{ email: input.email, status: 'ACCEPTED', permission: 0 }], color: '#123456' };
  const updated = rescheduledEvent(current, '2027-06-11T12:00:00Z', input.cleanerId);
  assert.deepEqual(updated.attendees, current.attendees);
  assert.equal(updated.description, current.description);
  assert.equal(updated.color, '#123456');
  assert.equal(updated.etag, 123);
  assert.equal(updated.dateandtime.start, '20270611T120000Z');
  assert.doesNotThrow(() => rescheduledEvent({ ...current, group_list: [], group_attendees: {}, attachments: [] }, input.startsAt, input.cleanerId));
});
test('foreign, recurring and manually extended events cannot be overwritten', () => {
  const current = { ...onboardingEvent(input), uid: 'event-1', etag: 123 };
  assert.throws(() => rescheduledEvent(current, input.startsAt, 'another-cleaner'), /IDENTITY/);
  assert.throws(() => rescheduledEvent({ ...current, rrule: 'FREQ=DAILY' }, input.startsAt, input.cleanerId), /EXTENDED/);
  assert.throws(() => rescheduledEvent({ ...current, attachments: ['private-file'] }, input.startsAt, input.cleanerId), /EXTENDED/);
});
test('credentials may only be sent to the expected Zoho origins', () => {
  assert.equal(zohoOrigin('https://calendar.zoho.com', 'calendar'), 'https://calendar.zoho.com');
  for (const url of ['https://calendar.zoho.com.evil.test', 'https://user:pass@calendar.zoho.com', 'http://calendar.zoho.com', 'https://calendar.zoho.com/private']) {
    assert.throws(() => zohoOrigin(url, 'calendar'));
  }
});

async function withNetwork(responses, run) {
  const original = global.fetch;
  const requests = [];
  global.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    const result = responses.shift();
    if (result instanceof Error) throw result;
    if (!result) throw new Error('Unexpected network request');
    return result;
  };
  try { await run(requests); } finally { global.fetch = original; }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const auth = () => json({ access_token: 'test-token' });
test('create requests use server OAuth and persist the returned UID', async () => {
  await withNetwork([auth(), json({ events: [{ uid: 'event-1' }] })], async requests => {
    const client = await calendarClient(config);
    const saved = await client.create(onboardingEvent(input));
    assert.equal(saved.uid, 'event-1');
    assert.equal(requests.length, 2);
    assert.equal(requests[1].init.method, 'POST');
    assert.equal(requests[1].init.redirect, 'error');
    assert.equal(requests[1].init.headers.Authorization, 'Zoho-oauthtoken test-token');
    assert.equal(JSON.parse(new URL(requests[1].url).searchParams.get('eventdata')).notify_attendee, 2);
  });
});
test('write timeout does not retry or claim a confirmed invitation', async () => {
  await withNetwork([auth(), new Error('timeout containing sensitive data')], async requests => {
    const client = await calendarClient(config);
    await assert.rejects(client.create(onboardingEvent(input)), e => e instanceof CalendarFailure && !e.retrySafe && e.code === 'CALENDAR_OUTCOME_UNKNOWN');
    assert.equal(requests.length, 2);
  });
});
test('unexpected success body and server failure need manual reconciliation', async () => {
  for (const response of [json({ success: true }), json({ email: 'private@example.com' }, 502)]) {
    await withNetwork([auth(), response], async () => {
      const client = await calendarClient(config);
      await assert.rejects(client.create(onboardingEvent(input)), e => !e.retrySafe && !e.message.includes('@'));
    });
  }
});
test('failed authentication is safe to retry because no event was submitted', async () => {
  await withNetwork([json({ error: 'invalid_grant' }, 400)], async requests => {
    await assert.rejects(calendarClient(config), e => e.retrySafe);
    assert.equal(requests.length, 1);
  });
});
test('cancellation requires a confirmed deleted event response', async () => {
  await withNetwork([auth(), json({ events: [{ uid: 'event-1' }] })], async () => {
    const client = await calendarClient(config);
    await assert.rejects(client.cancel({ uid: 'event-1', etag: 456 }), /CANCELLATION_UNCONFIRMED/);
  });
});
test('invitation query data is removed from nested monitoring events', () => {
  const source = { spans: [{ data: { url: 'https://calendar.zoho.com/events?eventdata=%7Bprivate%7D' } }], other: 'keep' };
  const safe = redactCalendarTelemetry(source);
  assert.equal(safe.other, 'keep');
  assert.ok(!JSON.stringify(safe).includes('private'));
  assert.ok(JSON.stringify(source).includes('private')); // non-mutating
  const date = new Date();
  assert.equal(redactCalendarTelemetry({ date }).date, date);
});
