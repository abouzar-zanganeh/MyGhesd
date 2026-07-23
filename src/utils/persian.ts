import { MonthRecord } from '../types';

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const strVal = String(str);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return strVal
    .replace(/\d/g, (d) => persianDigits[parseInt(d, 10)])
    .replace(/[٠-٩]/g, (d) => persianDigits['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
}

/**
 * Convert Persian/Arabic digits to English digits for input parsing
 */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * Format a number to Tomans string with commas and Persian digits
 * e.g., 3500000 -> ۳,۵۰۰,۰۰۰ تومان
 */
export function formatToman(amount: number): string {
  if (isNaN(amount)) return '۰ تومان';
  const formatted = amount.toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

/**
 * Formats card number into 4-digit groups e.g., 6037-9971-1234-5678
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = toEnglishDigits(cardNumber).replace(/\D/g, '');
  if (!cleaned) return '';
  const chunks = cleaned.match(/.{1,4}/g);
  if (!chunks) return cardNumber;
  const formattedStr = chunks.join(' - ');
  return '\u200E' + toPersianDigits(formattedStr) + '\u200E';
}

/**
 * Formats IBAN string nicely e.g., IR12 0170 0000 0001 2345 6789 01
 */
export function formatIBAN(iban: string): string {
  if (!iban) return '';
  const cleaned = toEnglishDigits(iban).trim().toUpperCase().replace(/\s+/g, '');
  const chunks = cleaned.match(/.{1,4}/g);
  if (!chunks) return toPersianDigits(iban);
  return '\u200E' + toPersianDigits(chunks.join(' ')) + '\u200E';
}

/**
 * Helper to generate a MonthRecord object from year and monthIndex
 */
export function createMonthRecord(year: number, monthIndex: number): MonthRecord {
  const monthPad = String(monthIndex + 1).padStart(2, '0');
  const id = `${year}-${monthPad}`;
  const label = `${JALALI_MONTH_NAMES[monthIndex]} ${toPersianDigits(year)}`;
  return {
    id,
    year,
    monthIndex,
    label,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Detect current Jalali (Shamsi) month record based on current system date
 */
export function getCurrentJalaliMonthRecord(): MonthRecord {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    let year = 1405;
    let monthIndex = 0; // 0-indexed

    for (const part of parts) {
      if (part.type === 'year') {
        const match = part.value.match(/\d+/);
        if (match) year = parseInt(match[0], 10);
      }
      if (part.type === 'month') {
        const match = part.value.match(/\d+/);
        if (match) monthIndex = parseInt(match[0], 10) - 1; // 1-indexed to 0-indexed
      }
    }

    if (monthIndex < 0 || monthIndex > 11) monthIndex = 0;
    return createMonthRecord(year, monthIndex);
  } catch {
    // Fallback if Intl Persian calendar fails
    const now = new Date();
    const gYear = now.getFullYear();
    const jYear = gYear - 621;
    return createMonthRecord(jYear, 0);
  }
}

/**
 * Gets the next month record after the given month
 */
export function getNextMonthRecord(currentMonth: MonthRecord): MonthRecord {
  let nextYear = currentMonth.year;
  let nextMonthIndex = currentMonth.monthIndex + 1;

  if (nextMonthIndex > 11) {
    nextMonthIndex = 0;
    nextYear += 1;
  }

  return createMonthRecord(nextYear, nextMonthIndex);
}

/**
 * Compare two month IDs (e.g., "1402-04" < "1402-05")
 */
export function compareMonthIds(idA: string, idB: string): number {
  return idA.localeCompare(idB);
}

/**
 * Get the previous month ID relative to activeMonthId
 */
export function getPreviousMonthId(activeMonth: MonthRecord, allMonths: MonthRecord[]): string | null {
  const sortedMonths = [...allMonths].sort((a, b) => compareMonthIds(a.id, b.id));
  const currentIndex = sortedMonths.findIndex((m) => m.id === activeMonth.id);
  if (currentIndex > 0) {
    return sortedMonths[currentIndex - 1].id;
  }
  
  // Calculate mathematically if not in history array
  let prevYear = activeMonth.year;
  let prevMonthIndex = activeMonth.monthIndex - 1;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear -= 1;
  }
  const monthPad = String(prevMonthIndex + 1).padStart(2, '0');
  return `${prevYear}-${monthPad}`;
}

/**
 * Clipboard copy function with fallback for non-HTTPS or iframe constraints
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const cleanedText = text.trim();
  if (!cleanedText) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(cleanedText);
      return true;
    }
  } catch {
    // Fallback below
  }

  // Fallback using textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = cleanedText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Generates a filename with Persian/Jalali date and time stamp
 * e.g. MyGhesd_Backup_1405-05-01_21-30.json
 */
export function getJalaliBackupFileName(prefix: string = 'MyGhesd_Backup', ext: string = 'json'): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);

    let year = '';
    let month = '';
    let day = '';
    let hour = String(now.getHours()).padStart(2, '0');
    let minute = String(now.getMinutes()).padStart(2, '0');

    for (const part of parts) {
      if (part.type === 'year') year = part.value.replace(/\D/g, '');
      if (part.type === 'month') month = part.value.replace(/\D/g, '').padStart(2, '0');
      if (part.type === 'day') day = part.value.replace(/\D/g, '').padStart(2, '0');
      if (part.type === 'hour') {
        const hVal = parseInt(part.value.replace(/\D/g, ''), 10);
        if (!isNaN(hVal)) hour = String(hVal % 24).padStart(2, '0');
      }
      if (part.type === 'minute') {
        const mVal = parseInt(part.value.replace(/\D/g, ''), 10);
        if (!isNaN(mVal)) minute = String(mVal).padStart(2, '0');
      }
    }

    // Fallback default year/month/day if formatter didn't yield clean numeric strings
    if (!year) year = '1405';
    if (!month) month = '01';
    if (!day) day = '01';

    return `${prefix}_${year}-${month}-${day}_${hour}-${minute}.${ext}`;
  } catch {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${prefix}_1405-01-01_${h}-${m}.${ext}`;
  }
}
