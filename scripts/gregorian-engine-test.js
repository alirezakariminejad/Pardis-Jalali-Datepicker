// Gregorian Engine Integration Tests
// Loads from dist/index.cjs (run `npm run build` first)

const { PardisEngine, JalaaliUtil } = require('../dist/index.cjs');

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
}
function eq(a, b, msg) {
  if (a !== b) throw new Error(`FAIL: ${msg} — expected ${b}, got ${a}`);
}

// ── Helper: create a Gregorian engine instance ──
function makeGregorianEngine(opts = {}) {
  return new PardisEngine({ ...opts, calendar: 'gregorian' });
}

function testGregorianDefault() {
  const engine = makeGregorianEngine();
  // Default calendar should be 'gregorian'
  eq(engine._calEngine.name, 'gregorian', 'Engine name');
  // Year range
  assert(engine._calEngine.minYear >= 1600, 'minYear >= 1600');
  assert(engine._calEngine.maxYear <= 3000, 'maxYear <= 3000');
}

function testLeapYears() {
  const eng = makeGregorianEngine()._calEngine;
  assert(eng.isLeapYear(2000), '2000 is leap');
  assert(!eng.isLeapYear(1900), '1900 is not leap');
  assert(eng.isLeapYear(2024), '2024 is leap');
  assert(!eng.isLeapYear(2023), '2023 is not leap');
  assert(eng.isLeapYear(1600), '1600 is leap (400 rule)');
  assert(!eng.isLeapYear(1700), '1700 is not leap (100 rule)');
}

function testDaysInMonth() {
  const eng = makeGregorianEngine()._calEngine;
  eq(eng.getDaysInMonth(2024, 2), 29, 'Feb 2024 = 29 days');
  eq(eng.getDaysInMonth(2023, 2), 28, 'Feb 2023 = 28 days');
  eq(eng.getDaysInMonth(2000, 2), 29, 'Feb 2000 = 29 days');
  eq(eng.getDaysInMonth(1900, 2), 28, 'Feb 1900 = 28 days');
  eq(eng.getDaysInMonth(2025, 1), 31, 'Jan 2025 = 31 days');
  eq(eng.getDaysInMonth(2025, 4), 30, 'Apr 2025 = 30 days');
  eq(eng.getDaysInMonth(2025, 12), 31, 'Dec 2025 = 31 days');
}

function testJDNRoundTrip() {
  const eng = makeGregorianEngine()._calEngine;
  // Key dates
  const dates = [
    { gy: 2025, gm: 3, gd: 21 },
    { gy: 2000, gm: 1, gd: 1 },
    { gy: 1970, gm: 1, gd: 1 },
    { gy: 2024, gm: 2, gd: 29 },
    { gy: 1900, gm: 12, gd: 31 },
  ];
  for (const { gy, gm, gd } of dates) {
    const jdn    = eng.toJDN(gy, gm, gd);
    const back   = eng.fromJDN(jdn);
    eq(back.gy, gy,  `JDN round-trip year ${gy}-${gm}-${gd}`);
    eq(back.gm, gm,  `JDN round-trip month ${gy}-${gm}-${gd}`);
    eq(back.gd, gd,  `JDN round-trip day ${gy}-${gm}-${gd}`);

    // Cross-check: Gregorian JDN must match JalaaliUtil's g2d result
    const refJalaali = JalaaliUtil.toJalaali(gy, gm, gd);
    const refBack    = JalaaliUtil.toGregorian(refJalaali.jy, refJalaali.jm, refJalaali.jd);
    eq(refBack.gy, gy,  `JalaaliUtil cross-check year ${gy}-${gm}-${gd}`);
  }
}

function testJDNMatchesJalaaliUtil() {
  // The Gregorian JDN algorithm must produce the same JDN as JalaaliUtil's g2d
  const eng = makeGregorianEngine()._calEngine;
  const testDates = [
    [2025, 3, 21], [2000, 2, 29], [1970, 1, 1], [2024, 12, 31],
  ];
  for (const [gy, gm, gd] of testDates) {
    const myJdn  = eng.toJDN(gy, gm, gd);
    // Cross-check via Jalali → JDN → Gregorian round-trip
    const j = JalaaliUtil.toJalaali(gy, gm, gd);
    const refJdn = JalaaliUtil.j2d(j.jy, j.jm, j.jd);
    eq(myJdn, refJdn, `JDN match for ${gy}-${gm}-${gd}`);
  }
}

function testGregorianEngineSelectDate() {
  const engine = makeGregorianEngine();
  engine.selectDate(2025, 3, 21);
  assert(engine.selectedDate !== null, 'selectedDate set after select');
  eq(engine.selectedDate.year,  2025, 'selectedDate.year');
  eq(engine.selectedDate.month, 3,    'selectedDate.month');
  eq(engine.selectedDate.day,   21,   'selectedDate.day');
}

function testGregorianPayload() {
  let receivedPayload = null;
  const engine = makeGregorianEngine({ outputFormat: 'both' });
  engine.on('select', (p) => { receivedPayload = p; });
  engine.selectDate(2025, 3, 21);
  assert(receivedPayload !== null, 'payload emitted');
  eq(receivedPayload.calendar, 'gregorian', 'payload.calendar');
  eq(receivedPayload.gregorian.year,  2025,    'payload.gregorian.year');
  eq(receivedPayload.gregorian.month, 3,       'payload.gregorian.month');
  eq(receivedPayload.gregorian.day,   21,      'payload.gregorian.day');
  eq(receivedPayload.iso, '2025-03-21',        'payload.iso');
  // Jalali cross-reference: 2025-03-21 = 1404/1/1
  eq(receivedPayload.jalali.year,  1404, 'payload.jalali.year');
  eq(receivedPayload.jalali.month, 1,    'payload.jalali.month');
  eq(receivedPayload.jalali.day,   1,    'payload.jalali.day');
}

function testGregorianRangeMode() {
  const engine = makeGregorianEngine({ rangeMode: true });
  engine.selectDate(2025, 3, 1);
  engine.selectDate(2025, 3, 31);
  assert(engine.rangeStart !== null, 'rangeStart set');
  assert(engine.rangeEnd   !== null, 'rangeEnd set');
  eq(engine.rangeStart.year, 2025, 'rangeStart.year');
  eq(engine.rangeStart.day,  1,    'rangeStart.day');
  eq(engine.rangeEnd.day,    31,   'rangeEnd.day');
}

function testGregorianDaysOfMonth() {
  const engine = makeGregorianEngine({ initialYear: 2025, initialMonth: 1 });
  const days = engine.getDaysOfMonth();
  // January 2025: 31 days
  const currentDays = days.filter(d => d.isCurrentMonth);
  eq(currentDays.length, 31, 'Jan 2025 has 31 current-month cells');
  // Total cells must be multiple of 7
  assert(days.length % 7 === 0, 'Total cells divisible by 7');
  // Each cell has generic year/month/day
  assert(typeof days[0].year  === 'number', 'cell.year is number');
  assert(typeof days[0].month === 'number', 'cell.month is number');
  assert(typeof days[0].day   === 'number', 'cell.day is number');
}

function testJalaliBackwardCompat() {
  // Ensure Jalali engine (default) still works identically to v2
  const engine = new PardisEngine({ initialYear: 1404, initialMonth: 1 });
  eq(engine._calEngine.name, 'jalali', 'Default engine is jalali');
  eq(engine.viewYear, 1404,  'Jalali viewYear');
  eq(engine.viewMonth, 1,    'Jalali viewMonth');
  // today is generic
  assert(typeof engine.today.year  === 'number', 'today.year');
  assert(typeof engine.today.month === 'number', 'today.month');
  assert(typeof engine.today.day   === 'number', 'today.day');
}

function testDeprecatedTupleWarning() {
  // minDate with {jy,jm,jd} should still work but emit a warning
  // Reset the warned flag before test
  PardisEngine._deprecatedTupleWarned = false;
  const originalWarn = console.warn;
  let warned = false;
  console.warn = () => { warned = true; };

  const engine = new PardisEngine({
    minDate: { jy: 1404, jm: 1, jd: 1 },
  });
  // isDisabled should work without throwing
  const disabled = engine.isDisabled(1403, 12, 29);
  assert(disabled === true, 'isDisabled with deprecated {jy,jm,jd} minDate');
  assert(warned,            'Deprecation warning emitted');
  console.warn = originalWarn;
  // Reset for subsequent tests
  PardisEngine._deprecatedTupleWarned = false;
}

function testGregorianMinDateConstraint() {
  const engine = makeGregorianEngine({
    minDate: { year: 2025, month: 6, day: 1 },
  });
  assert(engine.isDisabled(2025, 5, 31), 'Before minDate is disabled');
  assert(!engine.isDisabled(2025, 6, 1), 'On minDate is not disabled');
  assert(!engine.isDisabled(2025, 7, 1), 'After minDate is not disabled');
}

function run() {
  const tests = [
    testGregorianDefault,
    testLeapYears,
    testDaysInMonth,
    testJDNRoundTrip,
    testJDNMatchesJalaaliUtil,
    testGregorianEngineSelectDate,
    testGregorianPayload,
    testGregorianRangeMode,
    testGregorianDaysOfMonth,
    testJalaliBackwardCompat,
    testDeprecatedTupleWarning,
    testGregorianMinDateConstraint,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test();
      console.log(`  ✓ ${test.name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ ${test.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
