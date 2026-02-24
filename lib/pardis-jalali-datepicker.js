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
    const today = JalaaliUtil.todayJalaali();

    this.rangeMode = options.rangeMode || false;
    this.minDate = options.minDate || null; // { jy, jm, jd }
    this.maxDate = options.maxDate || null;
    // disabledDates: Array<{jy,jm,jd}> | (jy,jm,jd)=>boolean
    this.disabledDates = options.disabledDates || null;
    // highlightedDates: Array<{jy,jm,jd,className?}>
    this.highlightedDates = options.highlightedDates || null;
    // maxRange: max number of days allowed in a range selection
    this.maxRange = options.maxRange || null;
    // outputFormat: 'jalali' | 'gregorian' | 'both' (default: 'both')
    this.outputFormat = options.outputFormat || 'both';
    // numeralType: 'persian' | 'latin' (default: 'persian')
    this.numeralType = options.numeralType || 'persian';

    // State
    this.viewYear = options.initialYear || today.jy;
    this.viewMonth = options.initialMonth || today.jm;
    this.viewMode = 'day'; // 'day' | 'month' | 'year'

    this._clampView();

    this.selectedDate = null;    // { jy, jm, jd }
    this.rangeStart = null;
    this.rangeEnd = null;
    this.hoverDate = null;        // for range hover preview

    // Today reference
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
    this.viewYear = this.today.jy;
    this.viewMonth = this.today.jm;
    this.viewMode = 'day';
    if (!this.rangeMode) {
      this.selectedDate = { ...this.today };
      this.emit('select', PardisEngine.buildDatePayload(this.today.jy, this.today.jm, this.today.jd, this.outputFormat));
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
    if (this.viewYear < PardisEngine.MIN_YEAR) this.viewYear = PardisEngine.MIN_YEAR;
    if (this.viewYear > PardisEngine.MAX_YEAR) this.viewYear = PardisEngine.MAX_YEAR;
    if (this.viewMonth < 1) this.viewMonth = 1;
    if (this.viewMonth > 12) this.viewMonth = 12;
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
  selectDate(jy, jm, jd) {
    if (this.isDisabled(jy, jm, jd)) return;

    if (this.rangeMode) {
      if (!this.rangeStart || this.rangeEnd) {
        // Start new range
        this.rangeStart = { jy, jm, jd };
        this.rangeEnd = null;
        this.emit('rangeStart', PardisEngine.buildDatePayload(jy, jm, jd, this.outputFormat));
      } else {
        // Set end
        const startJdn = JalaaliUtil.j2d(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd);
        const endJdn = JalaaliUtil.j2d(jy, jm, jd);
        // Enforce maxRange: if selection exceeds max days, reject silently
        if (this.maxRange !== null) {
          const diff = Math.abs(endJdn - startJdn) + 1;
          if (diff > this.maxRange) return;
        }
        if (endJdn < startJdn) {
          this.rangeEnd = { ...this.rangeStart };
          this.rangeStart = { jy, jm, jd };
        } else {
          this.rangeEnd = { jy, jm, jd };
        }
        this.emit('rangeSelect', {
          start: PardisEngine.buildDatePayload(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd, this.outputFormat),
          end:   PardisEngine.buildDatePayload(this.rangeEnd.jy,   this.rangeEnd.jm,   this.rangeEnd.jd,   this.outputFormat),
        });
      }
    } else {
      this.selectedDate = { jy, jm, jd };
      this.viewYear = jy;
      this.viewMonth = jm;
      this.emit('select', PardisEngine.buildDatePayload(jy, jm, jd, this.outputFormat));
    }
  }

  clearSelection() {
    this.selectedDate = null;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.emit('clear', null);
  }

  // ── Queries ──
  isDisabled(jy, jm, jd) {
    const curJdn = JalaaliUtil.j2d(jy, jm, jd);
    if (this.minDate) {
      if (curJdn < JalaaliUtil.j2d(this.minDate.jy, this.minDate.jm, this.minDate.jd)) return true;
    }
    if (this.maxDate) {
      if (curJdn > JalaaliUtil.j2d(this.maxDate.jy, this.maxDate.jm, this.maxDate.jd)) return true;
    }
    if (this.disabledDates) {
      if (typeof this.disabledDates === 'function') {
        if (this.disabledDates(jy, jm, jd)) return true;
      } else if (Array.isArray(this.disabledDates)) {
        if (this.disabledDates.some(d => d.jy === jy && d.jm === jm && d.jd === jd)) return true;
      }
    }
    return false;
  }

  // Returns the highlight className for a date, or null
  getHighlightClass(jy, jm, jd) {
    if (!this.highlightedDates || !Array.isArray(this.highlightedDates)) return null;
    const match = this.highlightedDates.find(d => d.jy === jy && d.jm === jm && d.jd === jd);
    return match ? (match.className || 'highlighted') : null;
  }

  isToday(jy, jm, jd) {
    return jy === this.today.jy && jm === this.today.jm && jd === this.today.jd;
  }

  isSelected(jy, jm, jd) {
    if (this.rangeMode) {
      return this._isRangeStart(jy, jm, jd) || this._isRangeEnd(jy, jm, jd);
    }
    return this.selectedDate &&
      this.selectedDate.jy === jy &&
      this.selectedDate.jm === jm &&
      this.selectedDate.jd === jd;
  }

  _isRangeStart(jy, jm, jd) {
    return this.rangeStart &&
      this.rangeStart.jy === jy && this.rangeStart.jm === jm && this.rangeStart.jd === jd;
  }

  _isRangeEnd(jy, jm, jd) {
    return this.rangeEnd &&
      this.rangeEnd.jy === jy && this.rangeEnd.jm === jm && this.rangeEnd.jd === jd;
  }

  isInRange(jy, jm, jd) {
    if (!this.rangeStart || !this.rangeEnd) return false;
    const jdn = JalaaliUtil.j2d(jy, jm, jd);
    const startJdn = JalaaliUtil.j2d(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd);
    const endJdn = JalaaliUtil.j2d(this.rangeEnd.jy, this.rangeEnd.jm, this.rangeEnd.jd);
    return jdn > startJdn && jdn < endJdn;
  }

  isInHoverRange(jy, jm, jd) {
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    const jdn = JalaaliUtil.j2d(jy, jm, jd);
    const startJdn = JalaaliUtil.j2d(this.rangeStart.jy, this.rangeStart.jm, this.rangeStart.jd);
    const hoverJdn = JalaaliUtil.j2d(this.hoverDate.jy, this.hoverDate.jm, this.hoverDate.jd);
    const lo = Math.min(startJdn, hoverJdn);
    const hi = Math.max(startJdn, hoverJdn);
    return jdn > lo && jdn < hi;
  }

  isHoverRangeEnd(jy, jm, jd) {
    if (!this.rangeStart || this.rangeEnd || !this.hoverDate) return false;
    return this.hoverDate.jy === jy && this.hoverDate.jm === jm && this.hoverDate.jd === jd;
  }

  isWeekend(dayOfWeek) {
    // In Iranian calendar, Friday (index 6) is weekend
    return dayOfWeek === 6;
  }

  // ── Data Generation ──
  getDaysOfMonth() {
    const jy = this.viewYear;
    const jm = this.viewMonth;
    const daysInMonth = JalaaliUtil.jalaaliMonthLength(jy, jm);

    // What day of week does the 1st of month fall on?
    const g = JalaaliUtil.toGregorian(jy, jm, 1);
    const firstDate = new Date(g.gy, g.gm - 1, g.gd);
    // Saturday = 0, Sunday = 1, ... Friday = 6
    let dow = firstDate.getDay(); // 0=Sun ... 6=Sat
    // Convert to Shamsi week: Shanbe=0
    const shamsiDow = (dow + 1) % 7;

    const days = [];

    // Previous month filler
    if (shamsiDow > 0) {
      let prevMonth = jm - 1;
      let prevYear = jy;
      if (prevMonth < 1) { prevMonth = 12; prevYear--; }
      const prevDays = JalaaliUtil.jalaaliMonthLength(prevYear, prevMonth);
      for (let i = shamsiDow - 1; i >= 0; i--) {
        const d = prevDays - i;
        days.push({
          jy: prevYear, jm: prevMonth, jd: d,
          dayOfWeek: (shamsiDow - i - 1 + 7) % 7,
          isCurrentMonth: false,
          isToday: this.isToday(prevYear, prevMonth, d),
          isSelected: this.isSelected(prevYear, prevMonth, d),
          isRangeStart: this._isRangeStart(prevYear, prevMonth, d),
          isRangeEnd: this._isRangeEnd(prevYear, prevMonth, d),
          isInRange: this.isInRange(prevYear, prevMonth, d),
          isInHoverRange: this.isInHoverRange(prevYear, prevMonth, d),
          isHoverRangeEnd: this.isHoverRangeEnd(prevYear, prevMonth, d),
          isDisabled: this.isDisabled(prevYear, prevMonth, d),
          isWeekend: this.isWeekend((shamsiDow - i - 1 + 7) % 7),
          highlightClass: this.getHighlightClass(prevYear, prevMonth, d),
        });
      }
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayIndex = (shamsiDow + d - 1) % 7;
      days.push({
        jy, jm, jd: d,
        dayOfWeek: dayIndex,
        isCurrentMonth: true,
        isToday: this.isToday(jy, jm, d),
        isSelected: this.isSelected(jy, jm, d),
        isRangeStart: this._isRangeStart(jy, jm, d),
        isRangeEnd: this._isRangeEnd(jy, jm, d),
        isInRange: this.isInRange(jy, jm, d),
        isInHoverRange: this.isInHoverRange(jy, jm, d),
        isHoverRangeEnd: this.isHoverRangeEnd(jy, jm, d),
        isDisabled: this.isDisabled(jy, jm, d),
        isWeekend: this.isWeekend(dayIndex),
        highlightClass: this.getHighlightClass(jy, jm, d),
      });
    }

    // Next month filler (fill to complete last row)
    const remainder = days.length % 7;
    if (remainder > 0) {
      let nextMonth = jm + 1;
      let nextYear = jy;
      if (nextMonth > 12) { nextMonth = 1; nextYear++; }
      for (let d = 1; d <= 7 - remainder; d++) {
        const dayIndex = (shamsiDow + daysInMonth + d - 1) % 7;
        days.push({
          jy: nextYear, jm: nextMonth, jd: d,
          dayOfWeek: dayIndex,
          isCurrentMonth: false,
          isToday: this.isToday(nextYear, nextMonth, d),
          isSelected: this.isSelected(nextYear, nextMonth, d),
          isRangeStart: this._isRangeStart(nextYear, nextMonth, d),
          isRangeEnd: this._isRangeEnd(nextYear, nextMonth, d),
          isInRange: this.isInRange(nextYear, nextMonth, d),
          isInHoverRange: this.isInHoverRange(nextYear, nextMonth, d),
          isHoverRangeEnd: this.isHoverRangeEnd(nextYear, nextMonth, d),
          isDisabled: this.isDisabled(nextYear, nextMonth, d),
          isWeekend: this.isWeekend(dayIndex),
          highlightClass: this.getHighlightClass(nextYear, nextMonth, d),
        });
      }
    }

    return days;
  }

  getMonths() {
    return PardisEngine.MONTH_NAMES.map((name, i) => ({
      index: i + 1,
      name,
      isCurrent: this.today.jy === this.viewYear && this.today.jm === i + 1,
      isSelected: this.selectedDate && this.selectedDate.jy === this.viewYear && this.selectedDate.jm === i + 1,
    }));
  }

  getYears() {
    let startYear = this.viewYear - 5;
    if (startYear < PardisEngine.MIN_YEAR) startYear = PardisEngine.MIN_YEAR;
    if (startYear + 11 > PardisEngine.MAX_YEAR) startYear = Math.max(PardisEngine.MIN_YEAR, PardisEngine.MAX_YEAR - 11);
    const years = [];
    for (let i = 0; i < 12; i++) {
      const y = startYear + i;
      years.push({
        year: y,
        isCurrent: y === this.today.jy,
        isSelected: this.selectedDate && this.selectedDate.jy === y,
      });
    }
    return years;
  }

  // ── Preset Range Helpers ──
  // Returns {start:{jy,jm,jd}, end:{jy,jm,jd}} for a named preset
  getPresetRange(preset) {
    const todayJdn = JalaaliUtil.j2d(this.today.jy, this.today.jm, this.today.jd);
    const fromJdn = (jdn) => JalaaliUtil.d2j(jdn);

    if (preset === 'thisWeek') {
      // Shamsi week: شنبه=0 … جمعه=6; dow computed same way as renderer
      const g = JalaaliUtil.toGregorian(this.today.jy, this.today.jm, this.today.jd);
      const dow = (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7; // 0=شنبه
      const start = fromJdn(todayJdn - dow);
      const end   = fromJdn(todayJdn - dow + 6);
      return { start, end };
    }
    if (preset === 'thisMonth') {
      const daysInMonth = JalaaliUtil.jalaaliMonthLength(this.today.jy, this.today.jm);
      return {
        start: { jy: this.today.jy, jm: this.today.jm, jd: 1 },
        end:   { jy: this.today.jy, jm: this.today.jm, jd: daysInMonth },
      };
    }
    if (preset === 'last7') {
      return { start: fromJdn(todayJdn - 6), end: { ...this.today } };
    }
    if (preset === 'last30') {
      return { start: fromJdn(todayJdn - 29), end: { ...this.today } };
    }
    return null;
  }

  applyPreset(preset) {
    const range = this.getPresetRange(preset);
    if (!range) return;
    // Respect maxRange
    if (this.maxRange !== null) {
      const startJdn = JalaaliUtil.j2d(range.start.jy, range.start.jm, range.start.jd);
      const endJdn   = JalaaliUtil.j2d(range.end.jy,   range.end.jm,   range.end.jd);
      if (Math.abs(endJdn - startJdn) + 1 > this.maxRange) return;
    }
    this.rangeStart = range.start;
    this.rangeEnd   = range.end;
    this.hoverDate  = null;
    this.emit('rangeSelect', {
      start: PardisEngine.buildDatePayload(range.start.jy, range.start.jm, range.start.jd, this.outputFormat),
      end:   PardisEngine.buildDatePayload(range.end.jy,   range.end.jm,   range.end.jd,   this.outputFormat),
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

  // Format a number according to numeralType: 'persian' | 'latin'
  static formatNum(n, numeralType) {
    return numeralType === 'latin' ? String(n) : PardisEngine.toPersianNum(n);
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
  constructor(containerEl, engine, options = {}) {
    this.container = containerEl;
    this.engine = engine;
    this.options = options;
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

    let html = `
      <div class="pardis-calendar-header" role="presentation">
        <button class="pardis-nav-btn" data-action="prevMonth" aria-label="ماه قبل">▶</button>
        <div class="pardis-header-title">
          <span class="pardis-title-chip" data-action="showMonth" role="button" tabindex="0" aria-label="انتخاب ماه">${PardisEngine.MONTH_NAMES[info.month - 1]}</span>
          <span class="pardis-title-chip" data-action="showYear" role="button" tabindex="0" aria-label="انتخاب سال">${PardisEngine.formatNum(info.year, nt)}</span>
        </div>
        <button class="pardis-nav-btn" data-action="nextMonth" aria-label="ماه بعد">◀</button>
      </div>
      <div class="pardis-weekdays" role="row">
        ${PardisEngine.WEEKDAY_NAMES.map((name, i) =>
          `<div class="pardis-weekday${i === 6 ? ' weekend' : ''}" role="columnheader" aria-label="${PardisEngine.WEEKDAY_FULL[i]}">${name}</div>`
        ).join('')}
      </div>
      <div class="pardis-days" role="grid" aria-label="${PardisEngine.MONTH_NAMES[info.month - 1]} ${PardisEngine.formatNum(info.year, nt)}">
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

          const ariaLabel = `${PardisEngine.formatNum(day.jd, nt)} ${PardisEngine.MONTH_NAMES[day.jm - 1]} ${PardisEngine.formatNum(day.jy, nt)}`;
          const tabindex = day.isDisabled ? '-1' : '0';
          const ariaSelected = day.isSelected ? 'true' : 'false';
          const ariaDisabled = day.isDisabled ? 'true' : 'false';

          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="${tabindex}" aria-label="${ariaLabel}" aria-selected="${ariaSelected}" aria-disabled="${ariaDisabled}" data-jy="${day.jy}" data-jm="${day.jm}" data-jd="${day.jd}">${PardisEngine.formatNum(day.jd, nt)}</div>`;
        }).join('')}
      </div>
      <div class="pardis-footer">
        ${this.engine.rangeMode
          ? `<div class="pardis-preset-ranges">
              <button class="pardis-preset-btn" data-preset="thisWeek">هفته جاری</button>
              <button class="pardis-preset-btn" data-preset="thisMonth">ماه جاری</button>
              <button class="pardis-preset-btn" data-preset="last7">۷ روز گذشته</button>
              <button class="pardis-preset-btn" data-preset="last30">۳۰ روز گذشته</button>
            </div>
            <span class="pardis-range-hint">${
              !this.engine.rangeStart
                ? '<span class="hint-dot"></span> روز شروع را انتخاب کنید'
                : !this.engine.rangeEnd
                  ? '<span class="hint-dot picking"></span> روز پایان را انتخاب کنید'
                  : '<span class="hint-dot done"></span> بازه انتخاب شد'
            }</span>`
          : '<button class="pardis-footer-btn today-btn" data-action="goToday">امروز</button>'
        }
        <button class="pardis-footer-btn clear-btn" data-action="clear">پاک کردن</button>
      </div>
    `;

    this._setHTML(html);
    this._bindDayEvents();
  }

  _renderMonthView(info) {
    const months = this.engine.getMonths();
    const nt = this.engine.numeralType;

    let html = `
      <div class="pardis-calendar-header" role="presentation">
        <button class="pardis-nav-btn" data-action="prevYear" aria-label="سال قبل">▶</button>
        <div class="pardis-header-title">
          <span class="pardis-title-chip active-view" data-action="showMonth" role="button" tabindex="0">ماه</span>
          <span class="pardis-title-chip" data-action="showYear" role="button" tabindex="0" aria-label="انتخاب سال">${PardisEngine.formatNum(info.year, nt)}</span>
        </div>
        <button class="pardis-nav-btn" data-action="nextYear" aria-label="سال بعد">◀</button>
      </div>
      <div class="pardis-grid-view" role="grid" aria-label="انتخاب ماه">
        ${months.map(m => {
          const classes = ['pardis-grid-cell'];
          if (m.isCurrent) classes.push('current');
          if (m.isSelected) classes.push('selected-period');
          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="0" aria-selected="${m.isSelected ? 'true' : 'false'}" data-month="${m.index}">${m.name}</div>`;
        }).join('')}
      </div>
    `;

    this._setHTML(html);
    this._bindMonthEvents();
  }

  _renderYearView(_info) {
    const years = this.engine.getYears();
    const nt = this.engine.numeralType;

    let html = `
      <div class="pardis-calendar-header" role="presentation">
        <button class="pardis-nav-btn" data-action="prevDecade" aria-label="دهه قبل">▶</button>
        <div class="pardis-header-title">
          <span class="pardis-title-chip" data-action="showMonth" role="button" tabindex="0">ماه</span>
          <span class="pardis-title-chip active-view" data-action="showYear" role="button" tabindex="0">${PardisEngine.formatNum(years[0].year, nt)}–${PardisEngine.formatNum(years[years.length - 1].year, nt)}</span>
        </div>
        <button class="pardis-nav-btn" data-action="nextDecade" aria-label="دهه بعد">◀</button>
      </div>
      <div class="pardis-grid-view" role="grid" aria-label="انتخاب سال">
        ${years.map(y => {
          const classes = ['pardis-grid-cell'];
          if (y.isCurrent) classes.push('current');
          if (y.isSelected) classes.push('selected-period');
          return `<div class="${classes.join(' ')}" role="gridcell" tabindex="0" aria-selected="${y.isSelected ? 'true' : 'false'}" data-year="${y.year}">${PardisEngine.formatNum(y.year, nt)}</div>`;
        }).join('')}
      </div>
    `;

    this._setHTML(html);
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
  }

  _bindDayEvents() {
    this.container.querySelectorAll('.pardis-day:not(.empty):not(.disabled)').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const jy = +el.dataset.jy;
        const jm = +el.dataset.jm;
        const jd = +el.dataset.jd;
        this.engine.selectDate(jy, jm, jd);
        this.render();
      });

      if (this.engine.rangeMode) {
        el.addEventListener('mouseenter', () => {
          if (!this.engine.rangeStart || this.engine.rangeEnd) return;
          this.engine.hoverDate = { jy: +el.dataset.jy, jm: +el.dataset.jm, jd: +el.dataset.jd };
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
    const startJdn = this.engine.rangeStart
      ? JalaaliUtil.j2d(this.engine.rangeStart.jy, this.engine.rangeStart.jm, this.engine.rangeStart.jd)
      : null;
    const hoverJdn = this.engine.hoverDate
      ? JalaaliUtil.j2d(this.engine.hoverDate.jy, this.engine.hoverDate.jm, this.engine.hoverDate.jd)
      : null;
    const lo = (startJdn && hoverJdn) ? Math.min(startJdn, hoverJdn) : null;
    const hi = (startJdn && hoverJdn) ? Math.max(startJdn, hoverJdn) : null;

    this.container.querySelectorAll('.pardis-day').forEach(el => {
      const jdn = JalaaliUtil.j2d(+el.dataset.jy, +el.dataset.jm, +el.dataset.jd);
      const isHoverEnd = hoverJdn !== null && jdn === hoverJdn;
      const isInHover = lo !== null && hi !== null && jdn > lo && jdn < hi;
      el.classList.toggle('hover-range', isInHover);
      el.classList.toggle('hover-range-end', isHoverEnd);
    });

    // update hint text
    const hint = this.container.querySelector('.pardis-range-hint');
    if (hint) {
      if (this.engine.rangeStart && !this.engine.rangeEnd) {
        hint.innerHTML = '<span class="hint-dot picking"></span> روز پایان را انتخاب کنید';
      } else if (!this.engine.rangeStart) {
        hint.innerHTML = '<span class="hint-dot"></span> روز شروع را انتخاب کنید';
      } else {
        hint.innerHTML = '<span class="hint-dot done"></span> بازه انتخاب شد';
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
    this.input = inputEl;
    this.engine = engine;
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
      if (parsed && parsed.jy >= PardisEngine.MIN_YEAR && parsed.jy <= PardisEngine.MAX_YEAR && parsed.jm >= 1 && parsed.jm <= 12) {
        const maxDay = JalaaliUtil.jalaaliMonthLength(parsed.jy, parsed.jm);
        if (parsed.jd >= 1 && parsed.jd <= maxDay) {
          this.engine.viewYear = parsed.jy;
          this.engine.viewMonth = parsed.jm;
          this.engine.selectDate(parsed.jy, parsed.jm, parsed.jd);
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

  setValue(jy, jm, jd) {
    this.input.value = PardisEngine.formatPersian(jy, jm, jd);
  }

  setRangeValue(start, end) {
    const s = PardisEngine.formatPersian(start.jy, start.jm, start.jd);
    const e = PardisEngine.formatPersian(end.jy, end.jm, end.jd);
    this.input.value = `${s}  ←  ${e}`;
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
      mobileMode: false,
      minDate: null,
      maxDate: null,
      initialYear: null,
      initialMonth: null,
      disabledDates: null,
      highlightedDates: null,
      maxRange: null,
      numeralType: 'persian',
      onChange: null,
      onRangeStart: null,
      onRangeSelect: null,
      onClear: null,
    }, options);

    // Resolve target element
    this._target = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    if (!this._target) throw new Error(`PardisDatepicker: target not found — "${target}"`);

    this._isOpen = false;
    this._currentPayload = null;

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
    });
  }

  // ── DOM ──
  _buildDOM() {
    if (this.options.inline) {
      // Inline: render calendar directly inside target
      this._target.classList.add('pardis-inline-host');
      this._calEl = document.createElement('div');
      this._calEl.className = 'pardis-calendar pardis-inline';
      this._target.appendChild(this._calEl);
      this._renderer = new PardisRenderer(this._calEl, this.engine);
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
      hint.textContent = 'فرمت تاریخ: سال/ماه/روز';
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
      this._popover.setAttribute('aria-label', 'تقویم تاریخ');
      this._calEl = document.createElement('div');
      this._calEl.className = 'pardis-calendar';
      this._popover.appendChild(this._calEl);
      anchor.appendChild(this._popover);

      this._renderer = new PardisRenderer(this._calEl, this.engine);
      this._renderer.render();
    }
  }

  // ── Engine Events ──
  _bindEngineEvents() {
    const engine = this.engine;

    this._offSelect = engine.on('select', (payload) => {
      this._currentPayload = payload;
      if (!this.options.inline) {
        const j = payload.jalali || (payload.year !== undefined ? payload : null);
        if (j && this._inputMask) this._inputMask.setValue(j.year, j.month, j.day);
        this.close();
      }
      if (typeof this.options.onChange === 'function') this.options.onChange(payload);
    });

    this._offRangeStart = engine.on('rangeStart', (payload) => {
      if (!this.options.inline && this._input) {
        const j = payload.jalali || (payload.year !== undefined ? payload : null);
        if (j) this._input.value = PardisEngine.formatPersian(j.year, j.month, j.day) + '  ←  ...';
      }
      if (typeof this.options.onRangeStart === 'function') this.options.onRangeStart(payload);
    });

    this._offRangeSelect = engine.on('rangeSelect', ({ start, end }) => {
      this._currentPayload = { start, end };
      if (!this.options.inline && this._inputMask) {
        const js = start.jalali || (start.year !== undefined ? start : null);
        const je = end.jalali   || (end.year   !== undefined ? end   : null);
        if (js && je) this._inputMask.setRangeValue(
          { jy: js.year, jm: js.month, jd: js.day },
          { jy: je.year, jm: je.month, jd: je.day }
        );
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
          // RTL layout: swipe right = next month (visually ◀), swipe left = prev month (visually ▶)
          if (dx < 0) this.engine.goToNextMonth();
          else        this.engine.goToPrevMonth();
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
        const jy = +focused.dataset.jy;
        const jm = +focused.dataset.jm;
        const jd = +focused.dataset.jd;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          engine.selectDate(jy, jm, jd);
          this._renderer.render();
          return;
        }
        if (e.key === 'ArrowRight') { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, -1); return; }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, +1); return; }
        if (e.key === 'ArrowUp')    { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, -7); return; }
        if (e.key === 'ArrowDown')  { e.preventDefault(); this._focusDayOffset(el, jy, jm, jd, +7); return; }
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
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (idx > 0) cells[idx - 1].focus();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
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

  // Focus a day cell offset days away from (jy,jm,jd); navigates month if needed
  _focusDayOffset(el, jy, jm, jd, offset) {
    const targetJdn = JalaaliUtil.j2d(jy, jm, jd) + offset;
    const target = JalaaliUtil.d2j(targetJdn);
    // Navigate view if target is outside current month
    if (target.jy !== this.engine.viewYear || target.jm !== this.engine.viewMonth) {
      this.engine.viewYear  = target.jy;
      this.engine.viewMonth = target.jm;
      this.engine.emit('viewChange', this.engine.getViewInfo());
      this._renderer.render();
    }
    // Focus the target cell
    const cell = el.querySelector(`[data-jy="${target.jy}"][data-jm="${target.jm}"][data-jd="${target.jd}"]`);
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

  setOption(key, value) {
    this.options[key] = value;
    if (key === 'rangeMode') {
      this.engine.rangeMode = value;
      this.engine.clearSelection();
      this._renderer.render();
    }
    if (key === 'outputFormat') this.engine.outputFormat = value;
  }

  destroy() {
    if (this._onFocus)    this._input.removeEventListener('focus', this._onFocus);
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
