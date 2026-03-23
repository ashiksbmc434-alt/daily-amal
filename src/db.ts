export interface DailyRecord {
  date: string; // YYYY-MM-DD
  prayers: {
    fajr: { fard: boolean; sunnah_before: boolean };
    dhuhr: { fard: boolean; sunnah_before: boolean; sunnah_after: boolean };
    asr: { fard: boolean; sunnah_before: boolean };
    maghrib: { fard: boolean; sunnah_after: boolean };
    isha: { fard: boolean; sunnah_after: boolean };
    witr: boolean;
    nafl: boolean;
  };
  notes: string[];
}

export const DEFAULT_RECORD = (date: string): DailyRecord => ({
  date,
  prayers: {
    fajr: { fard: false, sunnah_before: false },
    dhuhr: { fard: false, sunnah_before: false, sunnah_after: false },
    asr: { fard: false, sunnah_before: false },
    maghrib: { fard: false, sunnah_after: false },
    isha: { fard: false, sunnah_after: false },
    witr: false,
    nafl: false,
  },
  notes: [],
});
