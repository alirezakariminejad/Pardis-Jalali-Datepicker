export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface DateRange {
  start: JalaliDate | null;
  end: JalaliDate | null;
}

export interface PardisOptions {
  inline?: boolean;
  rangeMode?: boolean;
  outputFormat?: 'jalali' | 'gregorian' | 'both';
  mobileMode?: boolean;
  minDate?: JalaliDate | null;
  maxDate?: JalaliDate | null;
  initialYear?: number | null;
  initialMonth?: number | null;
  disabledDates?: JalaliDate[] | ((jy: number, jm: number, jd: number) => boolean) | null;
  highlightedDates?: (JalaliDate & { className?: string })[] | null;
  maxRange?: number | null;
  numeralType?: 'persian' | 'latin';
  onChange?: ((payload: object) => void) | null;
  onRangeStart?: ((payload: object) => void) | null;
  onRangeSelect?: ((range: DateRange) => void) | null;
  onClear?: (() => void) | null;
}

export declare class PardisDatepicker {
  constructor(target: string | HTMLElement, options?: PardisOptions);
  getValue(): object | null;
  setValue(date: JalaliDate): void;
  setOption(key: keyof PardisOptions, value: unknown): void;
  open(): void;
  close(): void;
  destroy(): void;
  goToToday(): void;
  getPresetRange(name: 'thisWeek' | 'thisMonth' | 'last7Days' | 'last30Days'): DateRange;
}
