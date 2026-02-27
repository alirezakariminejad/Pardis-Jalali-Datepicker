/* ================================================================
   PARDIS JALALI DATEPICKER — Headless Engine (Vanilla JS)
   ================================================================
   Precise Jalaali ↔ Gregorian conversion algorithms.
   Zero external dependencies.
   ================================================================ */

// ── Jalaali Math Core ──
// Based on the reference jalaali-js algorithm by Behrang Noruzi Niya.
// Uses integer division (truncation toward zero) for correctness.
const JalaaliUtil = (() => {
  // Jalaali leap year breaks array
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
  ];

  // Integer division (truncation toward zero), NOT Math.floor
  function div(a, b) { return ~~(a / b); }
  // Remainder consistent with div (always same sign as dividend)
  function mod(a, b) { return a - ~~(a / b) * b; }

  function jalCal(jy) {
    const bl = breaks.length;
    let gy = jy + 621;
    let leapJ = -14;
    let jp = breaks[0];
    let jump;

    if (jy < jp || jy >= breaks[bl - 1])
      throw new Error('Invalid Jalaali year: ' + jy);

    for (let i = 1; i < bl; i++) {
      const jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }

    let n = jy - jp;
    leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && (jump - n) === 4) leapJ++;

    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;

    // Find if this year is leap
    if ((jump - n) < 6) {
      n = n - jump + div(jump + 4, 33) * 33;
    }
    let leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;

    return { leap: leap === 0 ? 1 : 0, gy, march };
  }

  function isLeapJalaaliYear(jy) {
    return jalCal(jy).leap === 1;
  }

  function jalaaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeapJalaaliYear(jy) ? 30 : 29;
  }

  function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }

  function d2j(jdn) {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f;

    if (k >= 0) {
      if (k <= 185) {
        const jm = 1 + div(k, 31);
        const jd = 1 + mod(k, 31);
        return { jy, jm, jd };
      }
      k -= 186;
    } else {
      jy--;
      k += 179;
      if (isLeapJalaaliYear(jy)) k++;
    }

    const jm = 7 + div(k, 30);
    const jd = 1 + mod(k, 30);
    return { jy, jm, jd };
  }

  function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
      + div(153 * mod(gm + 9, 12) + 2, 5)
      + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }

  function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  }

  function toJalaali(gy, gm, gd) {
    return d2j(g2d(gy, gm, gd));
  }

  function toGregorian(jy, jm, jd) {
    return d2g(j2d(jy, jm, jd));
  }

  function todayJalaali() {
    const now = new Date();
    return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  return {
    isLeapJalaaliYear,
    jalaaliMonthLength,
    toJalaali,
    toGregorian,
    todayJalaali,
    j2d,
    d2j,
  };
})();


/* ================================================================
   CALENDAR ENGINES — Pluggable calendar arithmetic abstraction
   ================================================================
   CalendarEngine interface (JSDoc contract):
     name: string
     minYear: number  (getter)
     maxYear: number  (getter)
     monthsInYear: number  (getter)
     getDaysInMonth(year, month): number
     isLeapYear(year): boolean
     toJDN(year, month, day): number          → Julian Day Number
     fromJDN(jdn): tuple                       → calendar-native tuple
     toGregorian(year, month, day): {gy,gm,gd}
     fromGregorian(gy, gm, gd): tuple
     today(): tuple
     getWeekdayOffset(year, month, weekStart): number  → 0-6
     makeTuple(year, month, day): tuple        → create a native tuple
     tupleYear(t): number
     tupleMonth(t): number
     tupleDay(t): number
   ================================================================ */

// ── JalaliEngine — wraps JalaaliUtil ──
class JalaliEngine {
  get name()         { return 'jalali'; }
  get minYear()      { return 1; }
  get maxYear()      { return 3177; }
  get monthsInYear() { return 12; }

  getDaysInMonth(year, month) {
    return JalaaliUtil.jalaaliMonthLength(year, month);
  }

  isLeapYear(year) {
    return JalaaliUtil.isLeapJalaaliYear(year);
  }

  toJDN(year, month, day) {
    return JalaaliUtil.j2d(year, month, day);
  }

  fromJDN(jdn) {
    return JalaaliUtil.d2j(jdn); // returns { jy, jm, jd }
  }

  toGregorian(year, month, day) {
    return JalaaliUtil.toGregorian(year, month, day); // returns { gy, gm, gd }
  }

  fromGregorian(gy, gm, gd) {
    return JalaaliUtil.toJalaali(gy, gm, gd); // returns { jy, jm, jd }
  }

  today() {
    return JalaaliUtil.todayJalaali(); // returns { jy, jm, jd }
  }

  /**
   * Returns the 0-based column offset for the first day of the month.
   * weekStart: JS day index (6 = Saturday for Jalali default).
   * Formula: (getDay() result - weekStart + 7) % 7
   */
  getWeekdayOffset(year, month, weekStart) {
    const g = JalaaliUtil.toGregorian(year, month, 1);
    const dow = new Date(g.gy, g.gm - 1, g.gd).getDay(); // 0=Sun … 6=Sat
    return (dow - weekStart + 7) % 7;
  }

  // Tuple constructors / accessors — Jalali uses {jy, jm, jd}
  makeTuple(year, month, day) { return { jy: year, jm: month, jd: day }; }
  tupleYear(t)  { return t.jy; }
  tupleMonth(t) { return t.jm; }
  tupleDay(t)   { return t.jd; }
}

// ── GregorianEngine — standard proleptic Gregorian calendar ──
class GregorianEngine {
  get name()         { return 'gregorian'; }
  get minYear()      { return 1600; }
  get maxYear()      { return 2999; }
  get monthsInYear() { return 12; }

  getDaysInMonth(year, month) {
    // Date constructor overflows month 0 of next year → gives last day of (month):
    return new Date(year, month, 0).getDate();
  }

  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  // Julian Day Number — same algorithm as JalaaliUtil.g2d / d2g
  // Uses Math.trunc (≡ ~~) which truncates toward zero.
  toJDN(year, month, day) {
    const T = Math.trunc;
    let d = T((year + T((month - 8) / 6) + 100100) * 1461 / 4)
          + T((153 * ((month + 9) % 12) + 2) / 5)
          + day - 34840408;
    d = d - T(T((year + 100100 + T((month - 8) / 6)) / 100) * 3 / 4) + 752;
    return d;
  }

  fromJDN(jdn) {
    const T = Math.trunc;
    let j = 4 * jdn + 139361631;
    j = j + T(T((4 * jdn + 183187720) / 146097) * 3 / 4) * 4 - 3908;
    const i  = T((j % 1461) / 4) * 5 + 308;
    const gd = T((i % 153) / 5) + 1;
    const gm = (T(i / 153) % 12) + 1;
    const gy = T(j / 1461) - 100100 + T((8 - gm) / 6);
    return { gy, gm, gd };
  }

  toGregorian(year, month, day) {
    return { gy: year, gm: month, gd: day }; // identity
  }

  fromGregorian(gy, gm, gd) {
    return { gy, gm, gd }; // identity
  }

  today() {
    const now = new Date();
    return { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };
  }

  /**
   * weekStart: 0=Sunday (Gregorian international default).
   */
  getWeekdayOffset(year, month, weekStart) {
    const dow = new Date(year, month - 1, 1).getDay(); // 0=Sun … 6=Sat
    return (dow - weekStart + 7) % 7;
  }

  // Tuple constructors / accessors — Gregorian uses {gy, gm, gd}
  makeTuple(year, month, day) { return { gy: year, gm: month, gd: day }; }
  tupleYear(t)  { return t.gy; }
  tupleMonth(t) { return t.gm; }
  tupleDay(t)   { return t.gd; }
}


/* ================================================================
   PARDIS LOCALES — Built-in and Pluggable Locale System
   ================================================================ */

/**
 * Built-in locale definitions.
 * @type {Record<string, PardisLocale>}
 */
const PARDIS_LOCALES = {
  'fa-IR': {
    code: 'fa-IR',
    direction: 'rtl',
    months: [
      'فروردین','اردیبهشت','خرداد',
      'تیر','مرداد','شهریور',
      'مهر','آبان','آذر',
      'دی','بهمن','اسفند',
    ],
    weekdays:     ['ش','ی','د','س','چ','پ','ج'],
    weekdaysLong: ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'],
    numerals: 'persian',
    weekStart: 6,
    ui: {
      today:           'امروز',
      clear:           'پاک کردن',
      selectMonth:     'ماه',
      selectYear:      'سال',
      prevMonth:       'ماه قبل',
      nextMonth:       'ماه بعد',
      prevYear:        'سال قبل',
      nextYear:        'سال بعد',
      prevDecade:      'دهه قبل',
      nextDecade:      'دهه بعد',
      thisWeek:        'هفته جاری',
      thisMonth:       'ماه جاری',
      last7Days:       '۷ روز گذشته',
      last30Days:      '۳۰ روز گذشته',
      rangeStart:      'روز شروع را انتخاب کنید',
      rangeEnd:        'روز پایان را انتخاب کنید',
      rangeDone:       'بازه انتخاب شد',
      selectMonthLabel:'انتخاب ماه',
      selectYearLabel: 'انتخاب سال',
      dateFormatHint:  'فرمت تاریخ: سال/ماه/روز',
    },
  },
  'en-US': {
    code: 'en-US',
    direction: 'ltr',
    months: [
      'Farvardin','Ordibehesht','Khordad',
      'Tir','Mordad','Shahrivar',
      'Mehr','Aban','Azar',
      'Dey','Bahman','Esfand',
    ],
    weekdays:     ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'],
    weekdaysLong: ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'],
    numerals: 'latin',
    weekStart: 6,
    ui: {
      today:           'Today',
      clear:           'Clear',
      selectMonth:     'Month',
      selectYear:      'Year',
      prevMonth:       'Previous month',
      nextMonth:       'Next month',
      prevYear:        'Previous year',
      nextYear:        'Next year',
      prevDecade:      'Previous decade',
      nextDecade:      'Next decade',
      thisWeek:        'This week',
      thisMonth:       'This month',
      last7Days:       'Last 7 days',
      last30Days:      'Last 30 days',
      rangeStart:      'Select start date',
      rangeEnd:        'Select end date',
      rangeDone:       'Range selected',
      selectMonthLabel:'Select month',
      selectYearLabel: 'Select year',
      dateFormatHint:  'Date format: YYYY/MM/DD',
    },
  },
  'en-US-gregorian': {
    code: 'en-US-gregorian',
    direction: 'ltr',
    months: [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ],
    weekdays:     ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    weekdaysLong: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    numerals: 'latin',
    weekStart: 0, // Sunday
    ui: {
      today:           'Today',
      clear:           'Clear',
      selectMonth:     'Month',
      selectYear:      'Year',
      prevMonth:       'Previous month',
      nextMonth:       'Next month',
      prevYear:        'Previous year',
      nextYear:        'Next year',
      prevDecade:      'Previous decade',
      nextDecade:      'Next decade',
      thisWeek:        'This week',
      thisMonth:       'This month',
      last7Days:       'Last 7 days',
      last30Days:      'Last 30 days',
      rangeStart:      'Select start date',
      rangeEnd:        'Select end date',
      rangeDone:       'Range selected',
      selectMonthLabel:'Select month',
      selectYearLabel: 'Select year',
      dateFormatHint:  'Date format: MM/DD/YYYY',
    },
  },
  'fa-IR-gregorian': {
    code: 'fa-IR-gregorian',
    direction: 'rtl',
    months: [
      'ژانویه','فوریه','مارس','آوریل','مه','ژوئن',
      'ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر',
    ],
    weekdays:     ['ی','د','س','چ','پ','ج','ش'],
    weekdaysLong: ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],
    numerals: 'persian',
    weekStart: 0, // Sunday
    ui: {
      today:           'امروز',
      clear:           'پاک کردن',
      selectMonth:     'ماه',
      selectYear:      'سال',
      prevMonth:       'ماه قبل',
      nextMonth:       'ماه بعد',
      prevYear:        'سال قبل',
      nextYear:        'سال بعد',
      prevDecade:      'دهه قبل',
      nextDecade:      'دهه بعد',
      thisWeek:        'هفته جاری',
      thisMonth:       'ماه جاری',
      last7Days:       '۷ روز گذشته',
      last30Days:      '۳۰ روز گذشته',
      rangeStart:      'روز شروع را انتخاب کنید',
      rangeEnd:        'روز پایان را انتخاب کنید',
      rangeDone:       'بازه انتخاب شد',
      selectMonthLabel:'انتخاب ماه',
      selectYearLabel: 'انتخاب سال',
      dateFormatHint:  'فرمت تاریخ: روز/ماه/سال',
    },
  },
};

/**
 * Resolves a locale from a string key, object, or undefined.
 * - string  → look up PARDIS_LOCALES; falls back to fa-IR if unknown
 * - object  → merge with fa-IR base (fills missing fields)
 * - null/undefined → fa-IR default
 * @param {string|object|null|undefined} locale
 * @returns {PardisLocale}
 */
function resolveLocale(locale) {
  const base = PARDIS_LOCALES['fa-IR'];
  if (!locale) return base;
  if (typeof locale === 'string') return PARDIS_LOCALES[locale] || base;
  if (typeof locale === 'object') {
    return {
      code:         locale.code      || base.code,
      direction:    locale.direction || base.direction,
      months:       (Array.isArray(locale.months)      && locale.months.length      === 12) ? locale.months      : base.months,
      weekdays:     (Array.isArray(locale.weekdays)    && locale.weekdays.length    === 7)  ? locale.weekdays    : base.weekdays,
      weekdaysLong: (Array.isArray(locale.weekdaysLong)&& locale.weekdaysLong.length=== 7)  ? locale.weekdaysLong: base.weekdaysLong,
      numerals:     locale.numerals  || base.numerals,
      weekStart:    typeof locale.weekStart === 'number' ? locale.weekStart : base.weekStart,
      ui:           Object.assign({}, base.ui, locale.ui || {}),
    };
  }
  return base;
}


/* ================================================================
   PARDIS ENGINE — Headless Calendar State Manager
   ================================================================ */
class PardisEngine {
  static MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ];

  static MIN_YEAR = 1;
  static MAX_YEAR = 3177;

  static WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  static WEEKDAY_FULL = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

  constructor(options = {}) {
    // ── Calendar engine selection ──
    const calendarName = options.calendar || 'jalali';
    this._calEngine = calendarName === 'gregorian'
      ? new GregorianEngine()
      : new JalaliEngine();

    const todayTuple = this._calEngine.today();
    // Normalize today to generic year/month/day for internal use
    const today = {
      year:  this._calEngine.tupleYear(todayTuple),
      month: this._calEngine.tupleMonth(todayTuple),
      day:   this._calEngine.tupleDay(todayTuple),
    };

    this.rangeMode = options.rangeMode || false;
    this.minDate = options.minDate || null;
    this.maxDate = options.maxDate || null;
    // disabledDates: Array<{year,month,day}> | (year,month,day)=>boolean
    this.disabledDates = options.disabledDates || null;
    // highlightedDates: Array<{year,month,day,className?}>
    this.highlightedDates = options.highlightedDates || null;
    // maxRange: max number of days allowed in a range selection
    this.maxRange = options.maxRange || null;
    // outputFormat: 'jalali' | 'gregorian' | 'both' (default: 'both')
    this.outputFormat = options.outputFormat || 'both';
    // numeralType: 'persian' | 'latin' (default: 'persian')
    this.numeralType = options.numeralType || 'persian';

    // State
    this.viewYear = options.initialYear || today.year;
    this.viewMonth = options.initialMonth || today.month;
    this.viewMode = 'day'; // 'day' | 'month' | 'year'

    this._clampView();

    this.selectedDate = null;    // { year, month, day }
    this.rangeStart = null;
    this.rangeEnd = null;
    this.hoverDate = null;        // for range hover preview

    // Today reference (generic {year, month, day})
    this.today = today;

    // Event listeners
    this._listeners = {};
  }

  // ── Event System ──
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  // ── Navigation ──
  goToNextMonth() {
    if (this.viewYear === PardisEngine.MAX_YEAR && this.viewMonth === 12) return;
    if (this.viewMonth === 12) {
      this.viewMonth = 1;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
    this._clampView();
    this.emit('viewChange', this.getViewInfo());
  }

  goToPrevMonth() {
    if (this.viewYear === PardisEngine.MIN_YEAR && this.viewMonth === 1) return;
    if (this.viewMonth === 1) {
      this.viewMonth = 12;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
    this._clampView();
    this.emit('viewChange', this.getViewInfo());
  }

  goToNextYear() {
    if (this.viewYear === PardisEngine.MAX_YEAR) return;
    this.viewYear++;
    this._clampView();
    this.emit('viewChange', this.getViewInfo());
  }

  goToPrevYear() {
    if (this.viewYear === PardisEngine.MIN_YEAR) return;
    this.viewYear--;
    this._clampView();
    this.emit('viewChange', this.getViewInfo());
  }

  goToPrevDecade() {
    this.viewYear -= 12;
    this._clampView();
    this.emit('viewChange', this.getViewInfo());
  }

  goToNextDecade() {
    this.viewYear += 12;
    this._clampView();
    this.emit('viewChange', this.getViewInfo());
  }

  goToToday() {
    const t = this.today;
    this.viewYear  = t.year;
    this.viewMonth = t.month;
    this.viewMode  = 'day';
    if (!this.rangeMode && !this.isDisabled(t.year, t.month, t.day)) {
      this.selectedDate = { ...t };
      this.emit('select', this._buildPayload(t.year, t.month, t.day));
    }
    this.emit('viewChange', this.getViewInfo());
  }

  goToDate(jy, jm) {
    this.viewYear = jy;
    this.viewMonth = jm;
    this._clampView();
    this.emit('viewChange', this.getViewInfo());
  }

  _clampView() {
    const minY = this._calEngine.minYear;
    const maxY = this._calEngine.maxYear;
    if (this.viewYear < minY) this.viewYear = minY;
    if (this.viewYear > maxY) this.viewYear = maxY;
    if (this.viewMonth < 1) this.viewMonth = 1;
    if (this.viewMonth > this._calEngine.monthsInYear) this.viewMonth = this._calEngine.monthsInYear;
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.emit('viewChange', this.getViewInfo());
  }

  toggleViewMode() {
    if (this.viewMode === 'day') this.viewMode = 'month';
    else if (this.viewMode === 'month') this.viewMode = 'year';
    else this.viewMode = 'day';
    this.emit('viewChange', this.getViewInfo());
  }

  // ── Selection ──
  selectDate(year, month, day) {
    if (this.isDisabled(year, month, day)) return;
    const eng = this._calEngine;

    if (this.rangeMode) {
      if (!this.rangeStart || this.rangeEnd) {
        this.rangeStart = { year, month, day };
        this.rangeEnd = null;
        this.emit('rangeStart', this._buildPayload(year, month, day));
      } else {
        const startJdn = eng.toJDN(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day);
        const endJdn   = eng.toJDN(year, month, day);
        if (this.maxRange !== null && Math.abs(endJdn - startJdn) + 1 > this.maxRange) return;
        if (endJdn < startJdn) {
          this.rangeEnd   = { ...this.rangeStart };
          this.rangeStart = { year, month, day };
        } else {
          this.rangeEnd = { year, month, day };
        }
        this.emit('rangeSelect', {
          start: this._buildPayload(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day),
          end:   this._buildPayload(this.rangeEnd.year,   this.rangeEnd.month,   this.rangeEnd.day),
        });
      }
    } else {
      this.selectedDate = { year, month, day };
      this.viewYear  = year;
      this.viewMonth = month;
      this.emit('select', this._buildPayload(year, month, day));
    }
  }

  /**
   * Builds a date payload using the active calendar engine.
   * For Jalali: calls the existing static buildDatePayload (identical to v2 output).
   * For Gregorian: builds a Gregorian-primary payload.
   */
  _buildPayload(year, month, day) {
    if (this._calEngine.name === 'jalali') {
      return PardisEngine.buildDatePayload(year, month, day, this.outputFormat);
    }
    return PardisEngine.buildGregorianPayload(year, month, day, this.outputFormat);
  }

  clearSelection() {
    this.selectedDate = null;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.emit('clear', null);
  }

  // ── Queries ──
  isDisabled(year, month, day) {
    const eng = this._calEngine;
    if (year < eng.minYear || year > eng.maxYear) return true;
    const curJdn = eng.toJDN(year, month, day);

    if (this.minDate) {
      const mn = this._normalizeConstraintTuple(this.minDate);
      if (curJdn < eng.toJDN(mn.year, mn.month, mn.day)) return true;
    }
    if (this.maxDate) {
      const mx = this._normalizeConstraintTuple(this.maxDate);
      if (curJdn > eng.toJDN(mx.year, mx.month, mx.day)) return true;
    }
    if (this.disabledDates) {
      if (typeof this.disabledDates === 'function') {
        if (this.disabledDates(year, month, day)) return true;
      } else if (Array.isArray(this.disabledDates)) {
        if (this.disabledDates.some(d => {
          const n = this._normalizeConstraintTuple(d);
          return n.year === year && n.month === month && n.day === day;
        })) return true;
      }
    }
    return false;
  }

  /**
   * Normalizes a constraint tuple from either old {jy,jm,jd} form or new {year,month,day} form.
   * Emits a one-time deprecation warning for old-form usage.
   */
  _normalizeConstraintTuple(t) {
    if (t && typeof t.jy === 'number') {
      if (!PardisEngine._deprecatedTupleWarned) {
        PardisEngine._deprecatedTupleWarned = true;
        console.warn(
          '[PardisDatepicker] Deprecation: minDate/maxDate/disabledDates use {jy,jm,jd} keys. ' +
          'Please migrate to {year,month,day}. This form will be removed in v4.'
        );
      }
      return { year: t.jy, month: t.jm, day: t.jd };
    }
    return { year: t.year, month: t.month, day: t.day };
  }

  // Returns the highlight className for a date, or null
  getHighlightClass(year, month, day) {
    if (!this.highlightedDates || !Array.isArray(this.highlightedDates)) return null;
    const match = this.highlightedDates.find(d => {
      const n = this._normalizeConstraintTuple(d);
      return n.year === year && n.month === month && n.day === day;
    });
    return match ? (match.className || 'highlighted') : null;
  }

  isToday(year, month, day) {
    return year === this.today.year && month === this.today.month && day === this.today.day;
  }

  isSelected(year, month, day) {
    if (this.rangeMode) {
      return this._isRangeStart(year, month, day) || this._isRangeEnd(year, month, day);
    }
    return this.selectedDate &&
      this.selectedDate.year  === year &&
      this.selectedDate.month === month &&
      this.selectedDate.day   === day;
  }

  _isRangeStart(year, month, day) {
    return this.rangeStart &&
      this.rangeStart.year === year && this.rangeStart.month === month && this.rangeStart.day === day;
  }

  _isRangeEnd(year, month, day) {
    return this.rangeEnd &&
      this.rangeEnd.year === year && this.rangeEnd.month === month && this.rangeEnd.day === day;
  }

  isInRange(year, month, day) {
    const eng = this._calEngine;
    if (year < eng.minYear || year > eng.maxYear) return false;
    if (!this.rangeStart || !this.rangeEnd) return false;
    const jdn      = eng.toJDN(year, month, day);
    const startJdn = eng.toJDN(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day);
    const endJdn   = eng.toJDN(this.rangeEnd.year,   this.rangeEnd.month,   this.rangeEnd.day);
    return jdn > startJdn && jdn < endJdn;
  }

  isInHoverRange(year, month, day) {
    const eng = this._calEngine;
    if (year < eng.minYear || year > eng.maxYear) return false;
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    const jdn      = eng.toJDN(year, month, day);
    const startJdn = eng.toJDN(this.rangeStart.year, this.rangeStart.month, this.rangeStart.day);
    const hoverJdn = eng.toJDN(this.hoverDate.year,  this.hoverDate.month,  this.hoverDate.day);
    const lo = Math.min(startJdn, hoverJdn);
    const hi = Math.max(startJdn, hoverJdn);
    return jdn > lo && jdn < hi;
  }

  isHoverRangeEnd(year, month, day) {
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    return this.hoverDate.year === year && this.hoverDate.month === month && this.hoverDate.day === day;
  }

  isWeekend(dayOfWeek) {
    // In Iranian calendar, Friday (index 6) is weekend
    return dayOfWeek === 6;
  }

  // ── Data Generation ──
  getDaysOfMonth() {
    const eng = this._calEngine;
    const year  = this.viewYear;
    const month = this.viewMonth;
    const daysInMonth   = eng.getDaysInMonth(year, month);
    const weekStart     = 6; // Default: Saturday=0 for Jalali. TODO: derive from locale weekStart.
    const startOffset   = eng.getWeekdayOffset(year, month, weekStart);

    const days = [];

    // ── Previous month filler ──
    if (startOffset > 0) {
      let prevMonth = month - 1;
      let prevYear  = year;
      if (prevMonth < 1) { prevMonth = eng.monthsInYear; prevYear--; }
      const prevDays = eng.getDaysInMonth(prevYear, prevMonth);

      for (let i = startOffset - 1; i >= 0; i--) {
        const d = prevDays - i;
        const dow = (startOffset - i - 1 + 7) % 7;
        days.push(this._makeCell(prevYear, prevMonth, d, dow, false));
      }
    }

    // ── Current month days ──
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = (startOffset + d - 1) % 7;
      days.push(this._makeCell(year, month, d, dow, true));
    }

    // ── Next month filler ──
    const remainder = days.length % 7;
    if (remainder > 0) {
      let nextMonth = month + 1;
      let nextYear  = year;
      if (nextMonth > eng.monthsInYear) { nextMonth = 1; nextYear++; }
      for (let d = 1; d <= 7 - remainder; d++) {
        const dow = (startOffset + daysInMonth + d - 1) % 7;
        days.push(this._makeCell(nextYear, nextMonth, d, dow, false));
      }
    }

    return days;
  }

  /**
   * Builds a single day cell object with generic year/month/day fields
   * plus calendar-specific aliases for backward compatibility.
   */
  _makeCell(year, month, day, dayOfWeek, isCurrentMonth) {
    const eng  = this._calEngine;
    const cell = {
      year, month, day,
      dayOfWeek,
      isCurrentMonth,
      isToday:        this.isToday(year, month, day),
      isSelected:     this.isSelected(year, month, day),
      isRangeStart:   this._isRangeStart(year, month, day),
      isRangeEnd:     this._isRangeEnd(year, month, day),
      isInRange:      this.isInRange(year, month, day),
      isInHoverRange: this.isInHoverRange(year, month, day),
      isHoverRangeEnd:this.isHoverRangeEnd(year, month, day),
      isDisabled:     this.isDisabled(year, month, day),
      isWeekend:      this.isWeekend(dayOfWeek),
      highlightClass: this.getHighlightClass(year, month, day),
    };

    // Calendar-specific aliases for backward compatibility
    if (eng.name === 'jalali') {
      cell.jy = year; cell.jm = month; cell.jd = day;
    } else if (eng.name === 'gregorian') {
      cell.gy = year; cell.gm = month; cell.gd = day;
    }

    return cell;
  }

  getMonths() {
    return PardisEngine.MONTH_NAMES.map((name, i) => ({
      index: i + 1,
      name,
      isCurrent:  this.today.year === this.viewYear && this.today.month === i + 1,
      isSelected: this.selectedDate &&
                  this.selectedDate.year === this.viewYear &&
                  this.selectedDate.month === i + 1,
    }));
  }

  getYears() {
    const minY = this._calEngine.minYear;
    const maxY = this._calEngine.maxYear;
    let startYear = this.viewYear - 5;
    if (startYear < minY) startYear = minY;
    if (startYear + 11 > maxY) startYear = Math.max(minY, maxY - 11);
    const years = [];
    for (let i = 0; i < 12; i++) {
      const y = startYear + i;
      years.push({
        year:       y,
        isCurrent:  y === this.today.year,
        isSelected: this.selectedDate && this.selectedDate.year === y,
      });
    }
    return years;
  }

  // ── Preset Range Helpers ──
  // Returns {start:{year,month,day}, end:{year,month,day}} for a named preset
  getPresetRange(preset) {
    const eng        = this._calEngine;
    const t          = this.today;
    const todayJdn   = eng.toJDN(t.year, t.month, t.day);
    const fromJdn    = (jdn) => {
      const r = eng.fromJDN(jdn);
      return { year: eng.tupleYear(r), month: eng.tupleMonth(r), day: eng.tupleDay(r) };
    };

    if (preset === 'thisWeek') {
      const g   = eng.toGregorian(t.year, t.month, t.day);
      const dow = (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7; // 0=Saturday
      const minJdn = eng.toJDN(eng.minYear, 1, 1);
      const startJdn = Math.max(todayJdn - dow, minJdn);
      return { start: fromJdn(startJdn), end: fromJdn(todayJdn - dow + 6) };
    }
    if (preset === 'thisMonth') {
      const daysInMonth = eng.getDaysInMonth(t.year, t.month);
      return {
        start: { year: t.year, month: t.month, day: 1 },
        end:   { year: t.year, month: t.month, day: daysInMonth },
      };
    }
    if (preset === 'last7Days' || preset === 'last7') {
      return { start: fromJdn(todayJdn - 6), end: { ...t } };
    }
    if (preset === 'last30Days' || preset === 'last30') {
      return { start: fromJdn(todayJdn - 29), end: { ...t } };
    }
    return null;
  }

  applyPreset(preset) {
    const eng   = this._calEngine;
    const range = this.getPresetRange(preset);
    if (!range) return;
    if (this.maxRange !== null) {
      const startJdn = eng.toJDN(range.start.year, range.start.month, range.start.day);
      const endJdn   = eng.toJDN(range.end.year,   range.end.month,   range.end.day);
      if (Math.abs(endJdn - startJdn) + 1 > this.maxRange) return;
    }
    this.rangeStart = range.start;
    this.rangeEnd   = range.end;
    this.hoverDate  = null;
    this.emit('rangeSelect', {
      start: this._buildPayload(range.start.year, range.start.month, range.start.day),
      end:   this._buildPayload(range.end.year,   range.end.month,   range.end.day),
    });
    this.emit('viewChange', this.getViewInfo());
  }

  getViewInfo() {
    return {
      year: this.viewYear,
      month: this.viewMonth,
      monthName: PardisEngine.MONTH_NAMES[this.viewMonth - 1],
      viewMode: this.viewMode,
    };
  }

  // ── Date Payload Builder ──
  /**
   * Builds a rich date payload object.
   * @param {number} jy  Jalali year
   * @param {number} jm  Jalali month
   * @param {number} jd  Jalali day
   * @param {'jalali'|'gregorian'|'both'} format
   * @returns {DatePayload}
   *
   * DatePayload shape (format='both'):
   * {
   *   jalali:    { year, month, day, monthName, formatted, formattedPersian, timestamp },
   *   gregorian: { year, month, day, monthName, formatted, date, timestamp },
   *   timestamp: <unix ms>,
   *   iso:       '2025-03-21',
   * }
   */
  static buildDatePayload(jy, jm, jd, format = 'both') {
    const g = JalaaliUtil.toGregorian(jy, jm, jd);
    const gDate = new Date(g.gy, g.gm - 1, g.gd);
    const timestamp = gDate.getTime();
    const iso = `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`;

    const GREGORIAN_MONTHS = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];

    const jalaliPart = {
      year:            jy,
      month:           jm,
      day:             jd,
      monthName:       PardisEngine.MONTH_NAMES[jm - 1],
      formatted:       `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`,
      formattedPersian: PardisEngine.formatPersian(jy, jm, jd),
      timestamp,
    };

    const gregorianPart = {
      year:      g.gy,
      month:     g.gm,
      day:       g.gd,
      monthName: GREGORIAN_MONTHS[g.gm - 1],
      formatted: `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`,
      date:      gDate,
      timestamp,
    };

    if (format === 'jalali')    return { ...jalaliPart,    iso, timestamp };
    if (format === 'gregorian') return { ...gregorianPart, iso, timestamp };
    return { jalali: jalaliPart, gregorian: gregorianPart, iso, timestamp };
  }

  /**
   * Builds a payload for a Gregorian engine selection.
   * @param {number} gy  Gregorian year
   * @param {number} gm  Gregorian month
   * @param {number} gd  Gregorian day
   * @param {'jalali'|'gregorian'|'both'} format
   */
  static buildGregorianPayload(gy, gm, gd, format = 'both') {
    const gDate     = new Date(gy, gm - 1, gd);
    const timestamp = gDate.getTime();
    const iso       = `${gy}-${String(gm).padStart(2,'0')}-${String(gd).padStart(2,'0')}`;

    const GREGORIAN_MONTHS = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const jalaliPart = JalaaliUtil.toJalaali(gy, gm, gd);

    const gregorianPart = {
      year:      gy,
      month:     gm,
      day:       gd,
      monthName: GREGORIAN_MONTHS[gm - 1],
      formatted: iso,
      date:      gDate,
      timestamp,
    };

    const jalaliOut = {
      year:      jalaliPart.jy,
      month:     jalaliPart.jm,
      day:       jalaliPart.jd,
      monthName: PardisEngine.MONTH_NAMES[jalaliPart.jm - 1],
      formatted: `${jalaliPart.jy}/${String(jalaliPart.jm).padStart(2,'0')}/${String(jalaliPart.jd).padStart(2,'0')}`,
    };

    if (format === 'gregorian') return { ...gregorianPart, iso, timestamp };
    if (format === 'jalali')    return { ...jalaliOut,    iso, timestamp };
    return {
      calendar:  'gregorian',
      gregorian: gregorianPart,
      jalali:    jalaliOut,
      iso,
      timestamp,
    };
  }

  // ── Formatting Helpers ──
  static formatDate(jy, jm, jd) {
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  }

  static formatPersian(jy, jm, jd) {
    const toPersianNum = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    return toPersianNum(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
  }

  static toPersianNum(n) {
    return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  }

  static toArabicNum(n) {
    return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  // Format a number according to numeralType: 'persian' | 'latin' | 'arabic'
  static formatNum(n, numeralType) {
    if (numeralType === 'latin')  return String(n);
    if (numeralType === 'arabic') return PardisEngine.toArabicNum(n);
    return PardisEngine.toPersianNum(n);
  }

  static fromPersianNum(s) {
    return s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  }

  static parseDateString(str) {
    const normalized = PardisEngine.fromPersianNum(str).replace(/[\/\-\.]/g, '/');
    const parts = normalized.split('/').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      return { jy: parts[0], jm: parts[1], jd: parts[2] };
    }
    return null;
  }
}


/* ================================================================
   PARDIS RENDERER — Binds Engine to DOM
   ================================================================ */
class PardisRenderer {
  constructor(containerEl, engine, options = {}, locale = null) {
    this.container = containerEl;
    this.engine = engine;
    this.options = options;
    this._locale = locale || resolveLocale(null);
    this._liveRegion = document.createElement('span');
    this._liveRegion.className = 'pardis-sr-only';
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.setAttribute('aria-atomic', 'true');
    this.container.appendChild(this._liveRegion);
    this.render();
  }

  render() {
    const info = this.engine.getViewInfo();

    if (info.viewMode === 'day') {
      this._renderDayView(info);
    } else if (info.viewMode === 'month') {
      this._renderMonthView(info);
    } else if (info.viewMode === 'year') {
      this._renderYearView(info);
    }
  }

  _renderDayView(info) {
    const days = this.engine.getDaysOfMonth();
    const nt = this.engine.numeralType;
    const loc = this._locale;
    const ui = loc.ui;

    let html = `
      <div class="pardis-calendar-header" role="presentation">
        <button class="pardis-nav-btn" data-action="prevMonth" aria-label="${ui.prevMonth}">▶</button>
        <div class="pardis-header-title" id="${this.options.headingId || ''}">
          <span class="pardis-title-chip" data-action="showMonth" role="button" tabindex="0" aria-label="${ui.selectMonthLabel}">${loc.months[info.month - 1]}</span>
          <span class="pardis-title-chip" data-action="showYear" role="button" tabindex="0" aria-label="${ui.selectYearLabel}">${PardisEngine.formatNum(info.year, nt)}</span>
        </div>
        <button class="pardis-nav-btn" data-action="nextMonth" aria-label="${ui.nextMonth}">◀</button>
      </div>
      <div class="pardis-weekdays" role="row">
        ${loc.weekdays.map((name, i) =>
          `<div class="pardis-weekday${i === 6 ? ' weekend' : ''}" role="columnheader" aria-label="${loc.weekdaysLong[i]}">${name}</div>`
        ).join('')}
      </div>
      <div class="pardis-days" role="grid" aria-label="${loc.months[info.month - 1]} ${PardisEngine.formatNum(info.year, nt)}">
        ${days.map(day => {
          const classes = ['pardis-day'];
          if (!day.isCurrentMonth) classes.push('other-month');
          if (day.isToday) classes.push('today');
          if (day.isSelected) classes.push('selected');
          if (day.isRangeStart) classes.push('range-start');
          if (day.isRangeEnd) classes.push('range-end');
          if (day.isInRange) classes.push('in-range');
          if (day.isInHoverRange) classes.push('hover-range');
          if (day.isHoverRangeEnd) classes.push('hover-range-end');
          if (day.isDisabled) classes.push('disabled');
          if (day.isWeekend && !day.isSelected && !day.isRangeStart && !day.isRangeEnd) classes.push('weekend');
          if (day.highlightClass) classes.push(day.highlightClass);

          const ariaLabel = `${PardisEngine.formatNum(day.day, nt)} ${loc.months[day.month - 1]} ${PardisEngine.formatNum(day.year, nt)}`;
          const tabindex = day.isDisabled ? '-1' : '0';
          const ariaSelected = day.isSelected ? 'true' : 'false';
          const ariaDisabled = day.isDisabled ? 'true' : 'false';

          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="${tabindex}" aria-label="${ariaLabel}" aria-selected="${ariaSelected}" aria-disabled="${ariaDisabled}" data-year="${day.year}" data-month="${day.month}" data-day="${day.day}">${PardisEngine.formatNum(day.day, nt)}</div>`;
        }).join('')}
      </div>
      <div class="pardis-footer">
        ${this.engine.rangeMode
          ? `<div class="pardis-preset-ranges">
              <button class="pardis-preset-btn" data-preset="thisWeek">${ui.thisWeek}</button>
              <button class="pardis-preset-btn" data-preset="thisMonth">${ui.thisMonth}</button>
              <button class="pardis-preset-btn" data-preset="last7">${ui.last7Days}</button>
              <button class="pardis-preset-btn" data-preset="last30">${ui.last30Days}</button>
            </div>
            <span class="pardis-range-hint">${
              !this.engine.rangeStart
                ? `<span class="hint-dot"></span> ${ui.rangeStart}`
                : !this.engine.rangeEnd
                  ? `<span class="hint-dot picking"></span> ${ui.rangeEnd}`
                  : `<span class="hint-dot done"></span> ${ui.rangeDone}`
            }</span>`
          : `<button class="pardis-footer-btn today-btn" data-action="goToday">${ui.today}</button>`
        }
        <button class="pardis-footer-btn clear-btn" data-action="clear">${ui.clear}</button>
      </div>
    `;

    this._setHTML(html);
    this._liveRegion.textContent = `${loc.months[info.month - 1]} ${PardisEngine.formatNum(info.year, nt)}`;
    this._bindDayEvents();
  }

  _renderMonthView(info) {
    const months = this.engine.getMonths();
    const nt = this.engine.numeralType;
    const loc = this._locale;
    const ui = loc.ui;

    let html = `
      <div class="pardis-calendar-header" role="presentation">
        <button class="pardis-nav-btn" data-action="prevYear" aria-label="${ui.prevYear}">▶</button>
        <div class="pardis-header-title" id="${this.options.headingId || ''}">
          <span class="pardis-title-chip active-view" data-action="showMonth" role="button" tabindex="0">${ui.selectMonth}</span>
          <span class="pardis-title-chip" data-action="showYear" role="button" tabindex="0" aria-label="${ui.selectYearLabel}">${PardisEngine.formatNum(info.year, nt)}</span>
        </div>
        <button class="pardis-nav-btn" data-action="nextYear" aria-label="${ui.nextYear}">◀</button>
      </div>
      <div class="pardis-grid-view" role="grid" aria-label="${ui.selectMonthLabel}">
        ${months.map(m => {
          const classes = ['pardis-grid-cell'];
          if (m.isCurrent) classes.push('current');
          if (m.isSelected) classes.push('selected-period');
          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="0" aria-selected="${m.isSelected ? 'true' : 'false'}" data-month="${m.index}">${loc.months[m.index - 1]}</div>`;
        }).join('')}
      </div>
    `;

    this._setHTML(html);
    this._liveRegion.textContent = `${ui.selectMonthLabel} — ${PardisEngine.formatNum(info.year, nt)}`;
    this._bindMonthEvents();
  }

  _renderYearView(_info) {
    const years = this.engine.getYears();
    const nt = this.engine.numeralType;
    const loc = this._locale;
    const ui = loc.ui;

    let html = `
      <div class="pardis-calendar-header" role="presentation">
        <button class="pardis-nav-btn" data-action="prevDecade" aria-label="${ui.prevDecade}">▶</button>
        <div class="pardis-header-title" id="${this.options.headingId || ''}">
          <span class="pardis-title-chip" data-action="showMonth" role="button" tabindex="0">${ui.selectMonth}</span>
          <span class="pardis-title-chip active-view" data-action="showYear" role="button" tabindex="0">${PardisEngine.formatNum(years[0].year, nt)}–${PardisEngine.formatNum(years[years.length - 1].year, nt)}</span>
        </div>
        <button class="pardis-nav-btn" data-action="nextDecade" aria-label="${ui.nextDecade}">◀</button>
      </div>
      <div class="pardis-grid-view" role="grid" aria-label="${ui.selectYearLabel}">
        ${years.map(y => {
          const classes = ['pardis-grid-cell'];
          if (y.isCurrent) classes.push('current');
          if (y.isSelected) classes.push('selected-period');
          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="0" aria-selected="${y.isSelected ? 'true' : 'false'}" data-year="${y.year}">${PardisEngine.formatNum(y.year, nt)}</div>`;
        }).join('')}
      </div>
    `;

    this._setHTML(html);
    this._liveRegion.textContent = `${ui.selectYearLabel} — ${PardisEngine.formatNum(years[0].year, nt)}–${PardisEngine.formatNum(years[years.length - 1].year, nt)}`;
    this._bindYearEvents();
  }

  _setHTML(html) {
    // Preserve handle in bottom sheet
    const handle = this.container.querySelector('.pardis-sheet-handle');
    if (handle) {
      // We're in bottom sheet
      this.container.innerHTML = '';
      this.container.appendChild(handle);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      while (wrapper.firstChild) {
        this.container.appendChild(wrapper.firstChild);
      }
    } else {
      this.container.innerHTML = html;
    }
    // Re-attach persistent aria-live region (innerHTML replacement destroys it)
    if (this._liveRegion) this.container.appendChild(this._liveRegion);
  }

  _bindDayEvents() {
    this.container.querySelectorAll('.pardis-day:not(.empty):not(.disabled)').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const year  = +el.dataset.year;
        const month = +el.dataset.month;
        const day   = +el.dataset.day;
        this.engine.selectDate(year, month, day);
        this.render();
      });

      if (this.engine.rangeMode) {
        el.addEventListener('mouseenter', () => {
          if (!this.engine.rangeStart || this.engine.rangeEnd) return;
          this.engine.hoverDate = { year: +el.dataset.year, month: +el.dataset.month, day: +el.dataset.day };
          this._updateHoverClasses();
        });
      }
    });

    if (this.engine.rangeMode) {
      this.container.querySelector('.pardis-days').addEventListener('mouseleave', (e) => {
        e.stopPropagation();
        if (!this.engine.rangeStart || this.engine.rangeEnd) return;
        this.engine.hoverDate = null;
        this._updateHoverClasses();
      });
    }

    // Preset range buttons
    this.container.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.engine.applyPreset(btn.dataset.preset);
        this.render();
      });
    });

    this._bindHeaderActions();
  }

  _updateHoverClasses() {
    if (!this.engine.rangeMode) return;
    const eng = this.engine._calEngine;
    const startJdn = this.engine.rangeStart
      ? eng.toJDN(this.engine.rangeStart.year, this.engine.rangeStart.month, this.engine.rangeStart.day)
      : null;
    const hoverJdn = this.engine.hoverDate
      ? eng.toJDN(this.engine.hoverDate.year, this.engine.hoverDate.month, this.engine.hoverDate.day)
      : null;
    const lo = (startJdn && hoverJdn) ? Math.min(startJdn, hoverJdn) : null;
    const hi = (startJdn && hoverJdn) ? Math.max(startJdn, hoverJdn) : null;

    this.container.querySelectorAll('.pardis-day').forEach(el => {
      const jdn = eng.toJDN(+el.dataset.year, +el.dataset.month, +el.dataset.day);
      const isHoverEnd = hoverJdn !== null && jdn === hoverJdn;
      const isInHover = lo !== null && hi !== null && jdn > lo && jdn < hi;
      el.classList.toggle('hover-range', isInHover);
      el.classList.toggle('hover-range-end', isHoverEnd);
    });

    // update hint text
    const hint = this.container.querySelector('.pardis-range-hint');
    if (hint) {
      const ui = this._locale.ui;
      if (this.engine.rangeStart && !this.engine.rangeEnd) {
        hint.innerHTML = `<span class="hint-dot picking"></span> ${ui.rangeEnd}`;
      } else if (!this.engine.rangeStart) {
        hint.innerHTML = `<span class="hint-dot"></span> ${ui.rangeStart}`;
      } else {
        hint.innerHTML = `<span class="hint-dot done"></span> ${ui.rangeDone}`;
      }
    }
  }

  _bindMonthEvents() {
    this.container.querySelectorAll('.pardis-grid-cell').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const month = +el.dataset.month;
        this.engine.viewMonth = month;
        this.engine.viewMode = 'day';
        this.engine.emit('viewChange', this.engine.getViewInfo());
        this.render();
      });
    });
    this._bindHeaderActions();
  }

  _bindYearEvents() {
    this.container.querySelectorAll('.pardis-grid-cell').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const year = +el.dataset.year;
        this.engine.viewYear = year;
        this.engine.viewMode = 'month';
        this.engine.emit('viewChange', this.engine.getViewInfo());
        this.render();
      });
    });
    this._bindHeaderActions();
  }

  _bindHeaderActions() {
    this.container.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = el.dataset.action;
        switch (action) {
          case 'prevMonth': this.engine.goToPrevMonth(); break;
          case 'nextMonth': this.engine.goToNextMonth(); break;
          case 'prevYear': this.engine.goToPrevYear(); break;
          case 'nextYear': this.engine.goToNextYear(); break;
          case 'prevDecade': this.engine.goToPrevDecade(); break;
          case 'nextDecade': this.engine.goToNextDecade(); break;
          case 'toggleView': this.engine.toggleViewMode(); break;
          case 'showMonth': this.engine.setViewMode('month'); break;
          case 'showYear': this.engine.setViewMode('year'); break;
          case 'goToday': this.engine.goToToday(); break;
          case 'clear': this.engine.clearSelection(); break;
        }
        this.render();
      });
    });
  }
}


/* ================================================================
   INPUT MASK — Auto-format Persian date as user types
   ================================================================ */
class PardisInputMask {
  constructor(inputEl, engine) {
    this.input  = inputEl;
    this.engine = engine;
    this._calEngine = engine._calEngine; // calendar engine for validation
    this._bind();
  }

  _bind() {
    this._handleInput = (e) => this._onInput(e);
    this._handleKeydown = (e) => this._onKeydown(e);
    this.input.addEventListener('input', this._handleInput);
    this.input.addEventListener('keydown', this._handleKeydown);
  }

  destroy() {
    this.input.removeEventListener('input', this._handleInput);
    this.input.removeEventListener('keydown', this._handleKeydown);
  }

  _onInput(_e) {
    let val = this.input.value;
    // Normalize: convert Persian digits to latin for processing
    let latin = PardisEngine.fromPersianNum(val);
    // Remove anything that's not digit or slash
    latin = latin.replace(/[^\d\/]/g, '');
    // Remove extra slashes
    const parts = latin.split('/');
    if (parts.length > 3) {
      latin = parts.slice(0, 3).join('/');
    }

    // Auto-insert slashes
    const digits = latin.replace(/\//g, '');
    let formatted = '';
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 4 || i === 6) formatted += '/';
      formatted += digits[i];
    }

    // Convert back to Persian
    const persian = PardisEngine.toPersianNum(formatted).replace(/\//g, '/');
    this.input.value = persian;

    // Try parse complete date
    if (digits.length === 8) {
      const parsed = PardisEngine.parseDateString(persian);
      if (parsed) {
        // parsed returns {jy, jm, jd} — use as generic year/month/day (same digit positions)
        const year  = parsed.jy;
        const month = parsed.jm;
        const day   = parsed.jd;
        const eng   = this._calEngine;
        if (year >= eng.minYear && year <= eng.maxYear && month >= 1 && month <= eng.monthsInYear) {
          const maxDay = eng.getDaysInMonth(year, month);
          if (day >= 1 && day <= maxDay) {
            this.engine.viewYear  = year;
            this.engine.viewMonth = month;
            this.engine.selectDate(year, month, day);
          }
        }
      }
    }
  }

  _onKeydown(e) {
    // Allow backspace, delete, arrows, tab
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowed.includes(e.key)) return;

    // Allow digits (latin and Persian)
    if (/[\d۰-۹]/.test(e.key)) return;
    if (e.key === '/') return;

    // Block everything else
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  setValue(year, month, day) {
    const nt = this.engine.numeralType;
    const formatted = `${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
    if (nt === 'persian') {
      this.input.value = PardisEngine.formatPersian(year, month, day);
    } else if (nt === 'arabic') {
      this.input.value = PardisEngine.toArabicNum(formatted).replace(/\//g, '/');
    } else {
      this.input.value = formatted;
    }
  }

  setRangeValue(start, end) {
    // start/end are {year, month, day}
    const fmt = (y, m, d) => {
      const nt = this.engine.numeralType;
      const s  = `${y}/${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
      if (nt === 'persian') return PardisEngine.formatPersian(y, m, d);
      if (nt === 'arabic')  return PardisEngine.toArabicNum(s).replace(/\//g, '/');
      return s;
    };
    this.input.value = `${fmt(start.year, start.month, start.day)}  ←  ${fmt(end.year, end.month, end.day)}`;
  }

  clear() {
    this.input.value = '';
  }
}


/* ================================================================
   PardisDatepicker — Public API (multi-instance + inline support)
   ================================================================
   Usage — Popover (input-bound):
     const dp = new PardisDatepicker('#myInput', {
       rangeMode: false,
       outputFormat: 'both',
       onChange: (payload) => console.log(payload),
       onRangeSelect: ({ start, end }) => console.log(start, end),
     });

   Usage — Inline (always visible, no input needed):
     const dp = new PardisDatepicker('#myContainer', {
       inline: true,
       rangeMode: true,
       onChange: (payload) => console.log(payload),
     });

   Methods:
     dp.open()            // open popover (ignored in inline mode)
     dp.close()           // close popover (ignored in inline mode)
     dp.getValue()        // returns current payload (or null)
     dp.setValue(jy,jm,jd) // programmatically select a date
     dp.clear()           // clear selection
     dp.destroy()         // remove all listeners and DOM
   ================================================================ */
class PardisDatepicker {
  constructor(target, options = {}) {
    this.options = Object.assign({
      inline: false,
      rangeMode: false,
      outputFormat: 'both',
      minDate: null,
      maxDate: null,
      initialYear: null,
      initialMonth: null,
      disabledDates: null,
      highlightedDates: null,
      maxRange: null,
      numeralType: null,   // null = derive from locale
      locale: null,        // string | LocaleObject | null → defaults to fa-IR
      calendar: null,      // 'jalali' | 'gregorian' — null defaults to 'jalali'
      onChange: null,
      onRangeStart: null,
      onRangeSelect: null,
      onClear: null,
    }, options);

    // Resolve locale (string → built-in lookup, object → merge, null → fa-IR)
    this._locale = resolveLocale(this.options.locale);

    // Effective numeralType: explicit user option wins, otherwise use locale default.
    // Track whether the user explicitly set numeralType so setOption('locale') respects it.
    this.options._numeralTypeOverridden = (this.options.numeralType !== null);
    if (!this.options.numeralType) {
      this.options.numeralType = this._locale.numerals;
    }

    // Resolve target element
    this._target = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    if (!this._target) throw new Error(`PardisDatepicker: target not found — "${target}"`);

    this._isOpen = false;
    this._currentPayload = null;
    this._headingId = 'pardis-heading-' + (++PardisDatepicker._counter);

    this._buildEngine();
    this._buildDOM();
    this._bindEngineEvents();
    if (!this.options.inline) this._bindPopoverEvents();
    this._bindSwipe(this._calEl);
    this._bindCalendarKeyboard(this._calEl);
  }

  // ── Engine ──
  _buildEngine() {
    this.engine = new PardisEngine({
      rangeMode:        this.options.rangeMode,
      outputFormat:     this.options.outputFormat,
      minDate:          this.options.minDate,
      maxDate:          this.options.maxDate,
      initialYear:      this.options.initialYear,
      initialMonth:     this.options.initialMonth,
      disabledDates:    this.options.disabledDates,
      highlightedDates: this.options.highlightedDates,
      maxRange:         this.options.maxRange,
      numeralType:      this.options.numeralType,
      calendar:         this.options.calendar || 'jalali',
    });
  }

  // ── DOM ──
  _buildDOM() {
    if (this.options.inline) {
      // Inline: render calendar directly inside target
      this._target.classList.add('pardis-inline-host');
      this._calEl = document.createElement('div');
      this._calEl.className = 'pardis-calendar pardis-inline';
      this._calEl.setAttribute('dir', this._locale.direction);
      this._target.appendChild(this._calEl);
      this._renderer = new PardisRenderer(this._calEl, this.engine, { headingId: this._headingId }, this._locale);
      this._renderer.render();
    } else {
      // Popover: target must be an <input>
      this._input = this._target;
      this._inputMask = new PardisInputMask(this._input, this.engine);

      // Wrap input if not already wrapped
      let anchor = this._input.closest('.pardis-popover-anchor');
      if (!anchor) {
        anchor = document.createElement('div');
        anchor.className = 'pardis-popover-anchor';
        this._input.parentNode.insertBefore(anchor, this._input);
        anchor.appendChild(this._input);
      }
      this._anchor = anchor;

      // ARIA: mark input with describedby hint and expanded state
      const hintId = `pardis-hint-${Math.random().toString(36).slice(2, 8)}`;
      const hint = document.createElement('span');
      hint.id = hintId;
      hint.className = 'pardis-sr-only';
      hint.textContent = this._locale.ui.dateFormatHint;
      anchor.appendChild(hint);
      this._input.setAttribute('aria-describedby', hintId);
      this._input.setAttribute('aria-expanded', 'false');
      this._input.setAttribute('aria-haspopup', 'dialog');
      this._input.setAttribute('autocomplete', 'off');

      // Create popover
      this._popover = document.createElement('div');
      this._popover.className = 'pardis-calendar-popover';
      this._popover.setAttribute('role', 'dialog');
      this._popover.setAttribute('aria-modal', 'true');
      this._popover.setAttribute('aria-labelledby', this._headingId);
      this._calEl = document.createElement('div');
      this._calEl.className = 'pardis-calendar';
      this._calEl.setAttribute('dir', this._locale.direction);
      this._popover.appendChild(this._calEl);
      anchor.appendChild(this._popover);

      this._renderer = new PardisRenderer(this._calEl, this.engine, { headingId: this._headingId }, this._locale);
      this._renderer.render();
    }
  }

  // ── Engine Events ──
  _bindEngineEvents() {
    const engine = this.engine;

    this._offSelect = engine.on('select', (payload) => {
      this._currentPayload = payload;
      if (!this.options.inline) {
        // For Jalali: payload.jalali.year/month/day (or legacy format)
        // For Gregorian: payload.gregorian.year/month/day
        const calName = engine._calEngine.name;
        const part = calName === 'gregorian'
          ? payload.gregorian
          : (payload.jalali || payload);
        if (part && this._inputMask) this._inputMask.setValue(part.year, part.month, part.day);
        this.close();
      }
      if (typeof this.options.onChange === 'function') this.options.onChange(payload);
    });

    this._offRangeStart = engine.on('rangeStart', (payload) => {
      if (!this.options.inline && this._input) {
        const calName = engine._calEngine.name;
        const part = calName === 'gregorian'
          ? payload.gregorian
          : (payload.jalali || payload);
        if (part) {
          const formatted = `${part.year}/${String(part.month).padStart(2,'0')}/${String(part.day).padStart(2,'0')}`;
          if (engine.numeralType === 'persian') {
            this._input.value = PardisEngine.formatPersian(part.year, part.month, part.day) + '  ←  ...';
          } else {
            this._input.value = formatted + '  ←  ...';
          }
        }
      }
      if (typeof this.options.onRangeStart === 'function') this.options.onRangeStart(payload);
    });

    this._offRangeSelect = engine.on('rangeSelect', ({ start, end }) => {
      this._currentPayload = { start, end };
      if (!this.options.inline && this._inputMask) {
        const calName = engine._calEngine.name;
        const extractPart = (p) => calName === 'gregorian'
          ? p.gregorian
          : (p.jalali || p);
        const startPart = extractPart(start);
        const endPart   = extractPart(end);
        if (startPart && endPart) {
          this._inputMask.setRangeValue(
            { year: startPart.year, month: startPart.month, day: startPart.day },
            { year: endPart.year,   month: endPart.month,   day: endPart.day }
          );
        }
      }
      engine.hoverDate = null;
      this._renderer.render();
      if (typeof this.options.onRangeSelect === 'function') this.options.onRangeSelect({ start, end });
    });

    this._offClear = engine.on('clear', () => {
      this._currentPayload = null;
      if (!this.options.inline && this._inputMask) this._inputMask.clear();
      if (typeof this.options.onClear === 'function') this.options.onClear();
    });

    this._offViewChange = engine.on('viewChange', () => this._renderer.render());
  }

  // ── Popover Events ──
  _bindPopoverEvents() {
    this._onFocus = () => this.open();
    this._input.addEventListener('focus', this._onFocus);

    // In range mode, clear selection on focus so user can pick a fresh range
    if (this.options.rangeMode) {
      this._onRangeFocusClear = () => {
        this.engine.clearSelection();
        this._inputMask.clear();
        this._renderer.render();
      };
      this._input.addEventListener('focus', this._onRangeFocusClear);
    }

    this._onDocClick = (e) => {
      if (!this._isOpen) return;
      if (!this._anchor.contains(e.target) && !this._popover.contains(e.target)) this.close();
    };
    document.addEventListener('click', this._onDocClick);

    this._onKeydown = (e) => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', this._onKeydown);
  }

  // ── Swipe Gestures (touch month navigation) ──
  _bindSwipe(el) {
    let startX = null;
    let startY = null;

    this._onPointerDown = (e) => {
      startX = e.clientX;
      startY = e.clientY;
    };
    this._onPointerUp = (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Only handle horizontal swipes wider than 40px that are more horizontal than vertical
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (this.engine.viewMode === 'day') {
          // Direction-aware swipe: RTL → swipe left(dx<0) = next month; LTR → swipe right(dx>0) = next month
          const isRTL = this._locale.direction === 'rtl';
          if (isRTL ? dx < 0 : dx > 0) this.engine.goToNextMonth();
          else                          this.engine.goToPrevMonth();
          this._renderer.render();
        }
      }
      startX = null;
      startY = null;
    };

    el.addEventListener('pointerdown', this._onPointerDown);
    el.addEventListener('pointerup',   this._onPointerUp);
  }

  // ── Calendar Keyboard Navigation ──
  _bindCalendarKeyboard(el) {
    this._onCalKeydown = (e) => {
      const focused = el.querySelector('[role="gridcell"]:focus, .pardis-grid-cell:focus');
      if (!focused) return;

      const engine = this.engine;
      const mode = engine.viewMode;

      if (mode === 'day') {
        const year  = +focused.dataset.year;
        const month = +focused.dataset.month;
        const day   = +focused.dataset.day;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          engine.selectDate(year, month, day);
          this._renderer.render();
          return;
        }
        // Direction-aware: RTL → right=back(-1), left=forward(+1); LTR → right=forward(+1), left=back(-1)
        const isRTL = this._locale.direction === 'rtl';
        if (e.key === 'ArrowRight') { e.preventDefault(); this._focusDayOffset(el, year, month, day, isRTL ? -1 : +1); return; }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); this._focusDayOffset(el, year, month, day, isRTL ? +1 : -1); return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); this._focusDayOffset(el, year, month, day, -7); return; }
        if (e.key === 'ArrowDown')  { e.preventDefault(); this._focusDayOffset(el, year, month, day, +7); return; }
        if (e.key === 'PageUp' && e.shiftKey)  { e.preventDefault(); engine.goToPrevYear();  this._renderer.render(); return; }
        if (e.key === 'PageDown' && e.shiftKey){ e.preventDefault(); engine.goToNextYear();  this._renderer.render(); return; }
        if (e.key === 'PageUp')   { e.preventDefault(); engine.goToPrevMonth(); this._renderer.render(); return; }
        if (e.key === 'PageDown') { e.preventDefault(); engine.goToNextMonth(); this._renderer.render(); return; }
        if (e.key === 'Home') {
          e.preventDefault();
          const cells = Array.from(el.querySelectorAll('.pardis-days [role="gridcell"]'));
          const idx = cells.indexOf(focused);
          const rowStart = idx - (idx % 7);
          if (cells[rowStart]) cells[rowStart].focus();
          return;
        }
        if (e.key === 'End') {
          e.preventDefault();
          const cells = Array.from(el.querySelectorAll('.pardis-days [role="gridcell"]'));
          const idx = cells.indexOf(focused);
          const rowEnd = idx - (idx % 7) + 6;
          if (cells[rowEnd]) cells[rowEnd].focus();
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          engine.goToToday();
          this._renderer.render();
          return;
        }
      }

      if (mode === 'month' || mode === 'year') {
        const cells = Array.from(el.querySelectorAll('.pardis-grid-cell'));
        const idx = cells.indexOf(focused);
        const gridIsRTL = this._locale.direction === 'rtl';
        // ArrowUp always goes backward; ArrowRight goes backward in RTL, forward in LTR
        if (e.key === 'ArrowUp' || (e.key === 'ArrowRight' && gridIsRTL) || (e.key === 'ArrowLeft' && !gridIsRTL)) {
          e.preventDefault();
          if (idx > 0) cells[idx - 1].focus();
        }
        // ArrowDown always goes forward; ArrowLeft goes forward in RTL, backward in LTR
        if (e.key === 'ArrowDown' || (e.key === 'ArrowLeft' && gridIsRTL) || (e.key === 'ArrowRight' && !gridIsRTL)) {
          e.preventDefault();
          if (idx < cells.length - 1) cells[idx + 1].focus();
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          focused.click();
        }
      }
    };

    el.addEventListener('keydown', this._onCalKeydown);
  }

  // Focus a day cell offset days away from (year,month,day); navigates month if needed
  _focusDayOffset(el, year, month, day, offset) {
    const eng       = this.engine._calEngine;
    const targetJdn = eng.toJDN(year, month, day) + offset;
    const minJdn    = eng.toJDN(eng.minYear, 1, 1);
    const maxJdn    = eng.toJDN(eng.maxYear, eng.monthsInYear, eng.getDaysInMonth(eng.maxYear, eng.monthsInYear));
    if (targetJdn < minJdn || targetJdn > maxJdn) return;

    const rawTarget   = eng.fromJDN(targetJdn);
    const targetYear  = eng.tupleYear(rawTarget);
    const targetMonth = eng.tupleMonth(rawTarget);
    const targetDay   = eng.tupleDay(rawTarget);

    if (targetYear !== this.engine.viewYear || targetMonth !== this.engine.viewMonth) {
      this.engine.viewYear  = targetYear;
      this.engine.viewMonth = targetMonth;
      this.engine.emit('viewChange', this.engine.getViewInfo());
      this._renderer.render();
    }
    const cell = el.querySelector(`[data-year="${targetYear}"][data-month="${targetMonth}"][data-day="${targetDay}"]`);
    if (cell) cell.focus();
  }

  // ── Public API ──
  open() {
    if (this.options.inline || this._isOpen) return;
    this._isOpen = true;
    this._popover.classList.add('open');
    this._input.setAttribute('aria-expanded', 'true');
  }

  close() {
    if (this.options.inline || !this._isOpen) return;
    this._isOpen = false;
    this._popover.classList.remove('open');
    this._input.setAttribute('aria-expanded', 'false');
    this._input.focus();
    this._renderer.render();
  }

  getValue() {
    return this._currentPayload;
  }

  setValue(jy, jm, jd) {
    this.engine.selectDate(jy, jm, jd);
    this._renderer.render();
  }

  clear() {
    this.engine.clearSelection();
    this._renderer.render();
  }

  goToToday() {
    this.engine.goToToday();
    this._renderer.render();
  }

  getPresetRange(name) {
    return this.engine.getPresetRange(name);
  }

  setOption(key, value) {
    this.options[key] = value;

    // Locale change: re-resolve locale, update direction, re-render
    if (key === 'locale') {
      this._locale = resolveLocale(value);
      this._renderer._locale = this._locale;
      this._calEl.setAttribute('dir', this._locale.direction);
      // Re-apply effective numeralType from new locale unless user explicitly overrode it
      if (!this.options._numeralTypeOverridden) {
        this.engine.numeralType = this._locale.numerals;
      }
      this._renderer.render();
      return;
    }

    // Keys that map directly to an engine property and require a re-render
    const renderKeys = ['minDate', 'maxDate', 'disabledDates', 'highlightedDates', 'maxRange', 'numeralType'];
    if (renderKeys.includes(key)) {
      this.engine[key] = value;
      if (key === 'numeralType') this.options._numeralTypeOverridden = true;
      this._renderer.render();
      return;
    }

    if (key === 'rangeMode') {
      this.engine.rangeMode = value;
      this.engine.clearSelection();
      this._renderer.render();
      return;
    }

    if (key === 'outputFormat') {
      this.engine.outputFormat = value;
      // no re-render needed: only affects payload shape
    }
  }

  destroy() {
    if (this._onFocus)          this._input.removeEventListener('focus', this._onFocus);
    if (this._onRangeFocusClear) this._input.removeEventListener('focus', this._onRangeFocusClear);
    if (this._onDocClick) document.removeEventListener('click', this._onDocClick);
    if (this._onKeydown)  document.removeEventListener('keydown', this._onKeydown);
    if (this._offSelect)      this._offSelect();
    if (this._offRangeStart)  this._offRangeStart();
    if (this._offRangeSelect) this._offRangeSelect();
    if (this._offClear)       this._offClear();
    if (this._offViewChange)  this._offViewChange();
    if (this._inputMask) this._inputMask.destroy();
    if (this._onPointerDown) this._calEl.removeEventListener('pointerdown', this._onPointerDown);
    if (this._onPointerUp)   this._calEl.removeEventListener('pointerup',   this._onPointerUp);
    if (this._onCalKeydown)  this._calEl.removeEventListener('keydown',     this._onCalKeydown);
    if (this.options.inline) {
      this._target.removeChild(this._calEl);
      this._target.classList.remove('pardis-inline-host');
    } else {
      this._popover.remove();
    }
  }
}

PardisDatepicker._counter = 0;
PardisEngine._deprecatedTupleWarned = false;

// ── Named exports (ESM — esbuild treats this file as an ES module) ──
export { PardisDatepicker, PardisEngine, JalaaliUtil, PARDIS_LOCALES, resolveLocale };
