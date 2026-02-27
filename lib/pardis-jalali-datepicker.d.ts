export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface DateRange {
  start: JalaliDate | null;
  end: JalaliDate | null;
}

/** UI string labels for a locale. All fields are optional — missing keys fall back to fa-IR defaults. */
export interface PardisLocaleUI {
  today?: string;
  clear?: string;
  selectMonth?: string;
  selectYear?: string;
  prevMonth?: string;
  nextMonth?: string;
  prevYear?: string;
  nextYear?: string;
  prevDecade?: string;
  nextDecade?: string;
  thisWeek?: string;
  thisMonth?: string;
  last7Days?: string;
  last30Days?: string;
  rangeStart?: string;
  rangeEnd?: string;
  rangeDone?: string;
  selectMonthLabel?: string;
  selectYearLabel?: string;
  dateFormatHint?: string;
}

/**
 * A locale object that controls display language, numeral style, and text direction.
 * Pass a built-in locale code ('fa-IR' | 'en-US') or supply a custom object.
 */
export interface PardisLocale {
  /** BCP 47 locale code, e.g. 'fa-IR', 'en-US', 'fa-AF' */
  code?: string;
  /** Text direction applied to the calendar root element */
  direction?: 'rtl' | 'ltr';
  /** Exactly 12 Jalali month names (index 0 = Farvardin) */
  months?: string[];
  /** Exactly 7 short weekday names starting with Saturday (index 0 = شنبه / Sat) */
  weekdays?: string[];
  /** Exactly 7 full weekday names starting with Saturday */
  weekdaysLong?: string[];
  /** Digit style for numbers displayed in the calendar */
  numerals?: 'persian' | 'latin' | 'arabic';
  /** First day of week (0 = Sunday … 6 = Saturday). Jalali default: 6 */
  weekStart?: number;
  /** UI label overrides — any missing key falls back to the fa-IR default */
  ui?: PardisLocaleUI;
}

export interface PardisOptions {
  inline?: boolean;
  rangeMode?: boolean;
  outputFormat?: 'jalali' | 'gregorian' | 'both';
  minDate?: JalaliDate | null;
  maxDate?: JalaliDate | null;
  initialYear?: number | null;
  initialMonth?: number | null;
  disabledDates?: JalaliDate[] | ((jy: number, jm: number, jd: number) => boolean) | null;
  highlightedDates?: (JalaliDate & { className?: string })[] | null;
  maxRange?: number | null;
  /** Digit style. When omitted, defaults to the active locale's numeral setting. */
  numeralType?: 'persian' | 'latin' | 'arabic';
  /**
   * Locale to use for month names, weekday names, UI labels, numeral style,
   * and text direction.
   *   - string  → load a built-in locale ('fa-IR' | 'en-US')
   *   - object  → use as a custom locale (missing fields fall back to fa-IR)
   *   - null/undefined → default to 'fa-IR'
   */
  locale?: string | PardisLocale | null;
  onChange?: ((payload: object) => void) | null;
  onRangeStart?: ((payload: object) => void) | null;
  onRangeSelect?: ((range: DateRange) => void) | null;
  onClear?: (() => void) | null;
}

/** Built-in locale registry. Keys are BCP 47 locale codes. */
export declare const PARDIS_LOCALES: Record<string, Required<PardisLocale>>;

/**
 * Resolve a locale from a string key, partial object, or null/undefined.
 * Returns a fully-populated PardisLocale (all fields present).
 */
export declare function resolveLocale(locale: string | PardisLocale | null | undefined): Required<PardisLocale>;

export declare const JalaaliUtil: {
  isLeapJalaaliYear(jy: number): boolean;
  jalaaliMonthLength(jy: number, jm: number): number;
  toJalaali(gy: number, gm: number, gd: number): JalaliDate;
  toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number };
  todayJalaali(): JalaliDate;
  j2d(jy: number, jm: number, jd: number): number;
  d2j(jdn: number): JalaliDate;
};

export declare class PardisEngine {
  static MIN_YEAR: number;
  static MAX_YEAR: number;
  static buildDatePayload(jy: number, jm: number, jd: number, format?: 'jalali' | 'gregorian' | 'both'): object;
  static formatNum(n: number, numeralType: 'persian' | 'latin' | 'arabic'): string;
  static toPersianNum(n: number): string;
  static toArabicNum(n: number): string;
}

export declare class PardisDatepicker {
  constructor(target: string | HTMLElement, options?: PardisOptions);
  getValue(): object | null;
  setValue(jy: number, jm: number, jd: number): void;
  clear(): void;
  setOption(key: keyof PardisOptions, value: unknown): void;
  open(): void;
  close(): void;
  destroy(): void;
  goToToday(): void;
  getPresetRange(name: 'thisWeek' | 'thisMonth' | 'last7Days' | 'last30Days'): DateRange;
}
