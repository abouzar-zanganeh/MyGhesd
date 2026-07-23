import * as XLSX from 'xlsx';
import { AppState, Debt, MonthRecord, PaymentLog } from '../types';
import { toEnglishDigits, getJalaliBackupFileName } from './persian';

/**
 * Clean numeric string from Persian/English formatted numbers
 * e.g. "۱,۵۰۰,۰۰۰ تومان" -> 1500000
 */
export function parseAmountNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  
  const str = String(val);
  const englishDigits = toEnglishDigits(str);
  const cleaned = englishDigits.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Export full application state into a multi-sheet Excel (.xlsx) workbook
 */
export function exportFullStateToExcel(appState: AppState): void {
  const wb = XLSX.utils.book_new();

  // 1. Debts Sheet
  const debtsData = appState.debts.map((d) => ({
    'شناسه': d.id,
    'عنوان بدهی': d.title,
    'مبلغ قسط (تومان)': d.amount,
    'شماره کارت': d.cardNumber || '',
    'شماره شبا': d.iban || '',
    'لینک پرداخت': d.paymentUrl || '',
    'یادداشت': d.notes || '',
    'بایگانی شده': d.isArchived ? 'بله' : 'خیر',
    'تاریخ ایجاد': d.createdAt || '',
  }));
  const debtsWs = XLSX.utils.json_to_sheet(debtsData);
  XLSX.utils.book_append_sheet(wb, debtsWs, 'لیست اقساط');

  // 2. Payments Sheet
  const paymentsData = appState.payments.map((p) => {
    const debt = appState.debts.find((d) => d.id === p.debtId);
    const month = appState.months.find((m) => m.id === p.monthId);
    return {
      'کد ماه': p.monthId,
      'عنوان ماه': month ? month.label : p.monthId,
      'شناسه بدهی': p.debtId,
      'عنوان بدهی': debt ? debt.title : '',
      'وضعیت پرداخت': p.paid ? 'پرداخت شده' : 'پرداخت نشده',
      'تاریخ پرداخت': p.paidAt || '',
    };
  });
  const paymentsWs = XLSX.utils.json_to_sheet(paymentsData);
  XLSX.utils.book_append_sheet(wb, paymentsWs, 'سوابق پرداخت');

  // 3. Months Sheet
  const monthsData = appState.months.map((m) => ({
    'کد ماه': m.id,
    'سال': m.year,
    'اندیس ماه': m.monthIndex,
    'عنوان ماه': m.label,
  }));
  const monthsWs = XLSX.utils.json_to_sheet(monthsData);
  XLSX.utils.book_append_sheet(wb, monthsWs, 'ماه‌ها');

  const fileName = getJalaliBackupFileName('MyGhesd_Backup', 'xlsx');
  XLSX.writeFile(wb, fileName);
}

/**
 * Export current active month report to Excel (.xlsx)
 */
export function exportActiveMonthToExcel(appState: AppState): void {
  const activeMonthObj = appState.months.find((m) => m.id === appState.activeMonthId);
  const monthLabel = activeMonthObj ? activeMonthObj.label : appState.activeMonthId;

  const paidSet = new Set(
    appState.payments
      .filter((p) => p.monthId === appState.activeMonthId && p.paid)
      .map((p) => p.debtId)
  );

  const reportData = appState.debts
    .filter((d) => !d.isArchived)
    .map((debt) => ({
      'عنوان بدهی': debt.title,
      'مبلغ قسط (تومان)': debt.amount,
      'شماره کارت': debt.cardNumber || '',
      'شماره شبا': debt.iban || '',
      'وضعیت پرداخت این ماه': paidSet.has(debt.id) ? 'پرداخت شده' : 'پرداخت نشده',
      'یادداشت': debt.notes || '',
      'لینک پرداخت': debt.paymentUrl || '',
    }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(reportData);
  XLSX.utils.book_append_sheet(wb, ws, `اقساط ${monthLabel}`);

  const cleanMonthLabel = monthLabel.replace(/\s+/g, '_');
  XLSX.writeFile(wb, `گزارش_اقساط_${cleanMonthLabel}.xlsx`);
}

/**
 * Result structure for file restore
 */
export interface ImportResult {
  success: boolean;
  newState?: AppState;
  message: string;
  importedCount?: number;
}

/**
 * Parses and restores data from a uploaded file (.json, .xlsx, .xls, .csv)
 */
export async function restoreDataFromFile(
  file: File,
  currentAppState: AppState,
  mode: 'merge' | 'replace' = 'merge'
): Promise<ImportResult> {
  const fileName = file.name.toLowerCase();

  // 1. JSON file handling
  if (fileName.endsWith('.json')) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (json && Array.isArray(json.debts) && Array.isArray(json.months)) {
        return {
          success: true,
          newState: json as AppState,
          message: 'فایل پشتیبان JSON با موفقیت بازیابی شد.',
          importedCount: json.debts.length,
        };
      } else if (Array.isArray(json)) {
        // Standard array of debts
        const newDebts = parseDebtsFromRawObjects(json, currentAppState.debts);
        const newState = buildUpdatedStateWithDebts(currentAppState, newDebts, mode);
        return {
          success: true,
          newState,
          message: `${newDebts.length} قسط از فایل JSON بازیابی شد.`,
          importedCount: newDebts.length,
        };
      } else {
        return {
          success: false,
          message: 'فرمت ساختار فایل پشتیبان JSON معتبر نیست.',
        };
      }
    } catch (err) {
      return {
        success: false,
        message: 'خطا در خواندن و تحلیل فایل JSON.',
      };
    }
  }

  // 2. Excel / CSV file handling (.xlsx, .xls, .csv)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        message: 'فایل اکسل انتخابی خالی است یا برگه‌ای ندارد.',
      };
    }

    // Check if this is a Full Multi-Sheet Backup exported from this app
    const hasDebtsSheet = wb.SheetNames.some((name) =>
      ['لیست اقساط', 'debts', 'اقساط'].includes(name.trim().toLowerCase())
    );
    const hasMonthsSheet = wb.SheetNames.some((name) =>
      ['ماه‌ها', 'months', 'ماه ها'].includes(name.trim().toLowerCase())
    );

    if (hasDebtsSheet && hasMonthsSheet) {
      const fullState = parseFullStateFromWorkbook(wb, currentAppState);
      if (fullState) {
        return {
          success: true,
          newState: fullState,
          message: 'پشتیبان کامل اکسل با تمام ماه‌ها و اقساط با موفقیت بازیابی شد.',
          importedCount: fullState.debts.length,
        };
      }
    }

    // Otherwise, parse first sheet (or Debts sheet) as list of debts
    const mainSheetName =
      wb.SheetNames.find((name) =>
        ['لیست اقساط', 'debts', 'اقساط'].includes(name.trim().toLowerCase())
      ) || wb.SheetNames[0];

    const ws = wb.Sheets[mainSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        message: 'هیچ داده‌ای در برگه اکسل پیدا نشد.',
      };
    }

    const { debts: parsedDebts, paidDebtTitles } = parseDebtsFromExcelRows(rawRows, currentAppState.debts);

    if (parsedDebts.length === 0) {
      return {
        success: false,
        message: 'ستون‌های معتبر اقساط (مانند عنوان بدهی، مبلغ) در فایل اکسل یافت نشد.',
      };
    }

    // Combine with current app state based on mode
    const newState = buildUpdatedStateWithDebts(currentAppState, parsedDebts, mode, paidDebtTitles);

    return {
      success: true,
      newState,
      message: `${parsedDebts.length} قسط با موفقیت از فایل اکسل بازیابی شد.`,
      importedCount: parsedDebts.length,
    };
  } catch (err) {
    console.error('Excel Restore Error:', err);
    return {
      success: false,
      message: 'خطا در پردازش فایل اکسل. لطفاً از سلامت فایل مطمئن شوید.',
    };
  }
}

/**
 * Parse full multi-sheet backup workbook
 */
function parseFullStateFromWorkbook(wb: XLSX.WorkBook, currentState: AppState): AppState | null {
  try {
    const debtsSheetName = wb.SheetNames.find((n) =>
      ['لیست اقساط', 'debts', 'اقساط'].includes(n.trim().toLowerCase())
    )!;
    const monthsSheetName = wb.SheetNames.find((n) =>
      ['ماه‌ها', 'months', 'ماه ها'].includes(n.trim().toLowerCase())
    )!;
    const paymentsSheetName = wb.SheetNames.find((n) =>
      ['سوابق پرداخت', 'payments', 'پرداخت‌ها', 'پرداخت ها'].includes(n.trim().toLowerCase())
    );

    const debtsRows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[debtsSheetName]);
    const monthsRows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[monthsSheetName]);
    const paymentsRows = paymentsSheetName
      ? XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[paymentsSheetName])
      : [];

    const debts: Debt[] = debtsRows.map((row, idx) => ({
      id: String(row['شناسه'] || row['id'] || `debt-${Date.now()}-${idx}`),
      title: String(row['عنوان بدهی'] || row['title'] || row['عنوان'] || `قسط ${idx + 1}`).trim(),
      amount: parseAmountNumber(row['مبلغ قسط (تومان)'] || row['amount'] || row['مبلغ']),
      cardNumber: String(row['شماره کارت'] || row['cardNumber'] || '').trim(),
      iban: String(row['شماره شبا'] || row['iban'] || '').trim(),
      paymentUrl: String(row['لینک پرداخت'] || row['paymentUrl'] || '').trim(),
      notes: String(row['یادداشت'] || row['notes'] || '').trim(),
      isArchived: String(row['بایگانی شده'] || row['isArchived'] || '').includes('بله') || row['isArchived'] === true,
      createdAt: String(row['تاریخ ایجاد'] || row['createdAt'] || new Date().toISOString()),
    }));

    const months: MonthRecord[] = monthsRows.map((row, idx) => ({
      id: String(row['کد ماه'] || row['id'] || `1403-0${idx + 1}`),
      year: Number(row['سال'] || row['year'] || 1403),
      monthIndex: Number(row['اندیس ماه'] || row['monthIndex'] || 0),
      label: String(row['عنوان ماه'] || row['label'] || ''),
      createdAt: new Date().toISOString(),
    }));

    const payments: PaymentLog[] = paymentsRows.map((row) => ({
      monthId: String(row['کد ماه'] || row['monthId'] || ''),
      debtId: String(row['شناسه بدهی'] || row['debtId'] || ''),
      paid: String(row['وضعیت پرداخت'] || row['paid'] || '').includes('پرداخت شده') || row['paid'] === true,
      paidAt: String(row['تاریخ پرداخت'] || row['paidAt'] || ''),
    })).filter((p) => p.monthId && p.debtId);

    const activeMonthId = months.length > 0 ? months[months.length - 1].id : currentState.activeMonthId;

    return {
      debts: debts.length > 0 ? debts : currentState.debts,
      months: months.length > 0 ? months : currentState.months,
      activeMonthId,
      payments,
    };
  } catch {
    return null;
  }
}

/**
 * Intelligent field matcher for excel row objects
 */
function parseDebtsFromExcelRows(
  rows: Record<string, any>[],
  existingDebts: Debt[]
): { debts: Debt[]; paidDebtTitles: Set<string> } {
  const parsedDebts: Debt[] = [];
  const paidDebtTitles = new Set<string>();

  rows.forEach((row, index) => {
    let title = '';
    let amount = 0;
    let cardNumber = '';
    let iban = '';
    let paymentUrl = '';
    let notes = '';
    let isPaid = false;

    // Iterate through all key-value pairs in row to match column names
    Object.entries(row).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      const valStr = String(value).trim();
      const cleanKey = key.trim().toLowerCase();

      // Title matching
      if (
        cleanKey.includes('عنوان') ||
        cleanKey.includes('نام بدهی') ||
        cleanKey.includes('نام قسط') ||
        cleanKey.includes('title') ||
        cleanKey === 'نام' ||
        cleanKey === 'بدهی'
      ) {
        title = valStr;
      }
      // Amount matching
      else if (
        cleanKey.includes('مبلغ') ||
        cleanKey.includes('amount') ||
        cleanKey.includes('قیمت') ||
        cleanKey.includes('تومان') ||
        cleanKey.includes('قسط')
      ) {
        amount = parseAmountNumber(value);
      }
      // Card number matching
      else if (cleanKey.includes('کارت') || cleanKey.includes('card')) {
        cardNumber = valStr;
      }
      // IBAN matching
      else if (cleanKey.includes('شبا') || cleanKey.includes('iban')) {
        iban = valStr;
      }
      // Payment URL matching
      else if (cleanKey.includes('لینک') || cleanKey.includes('url') || cleanKey.includes('درگاه')) {
        paymentUrl = valStr;
      }
      // Notes matching
      else if (
        cleanKey.includes('یادداشت') ||
        cleanKey.includes('توضیحات') ||
        cleanKey.includes('notes') ||
        cleanKey.includes('توضیح')
      ) {
        notes = valStr;
      }
      // Paid status matching
      else if (cleanKey.includes('وضعیت') || cleanKey.includes('status') || cleanKey.includes('پرداخت')) {
        if (
          valStr.includes('پرداخت شده') ||
          valStr === 'بله' ||
          valStr.toLowerCase() === 'paid' ||
          valStr === '1' ||
          valStr.toLowerCase() === 'true'
        ) {
          isPaid = true;
        }
      }
    });

    // If title was not found via specific header key, pick first non-numeric text column
    if (!title) {
      const firstTextKey = Object.keys(row).find((k) => {
        const v = String(row[k]).trim();
        return v && isNaN(Number(v)) && !v.startsWith('IR') && v.length < 100;
      });
      if (firstTextKey) {
        title = String(row[firstTextKey]).trim();
      }
    }

    if (title) {
      const debtId = `debt-imp-${Date.now()}-${index}`;
      parsedDebts.push({
        id: debtId,
        title,
        amount,
        cardNumber,
        iban,
        paymentUrl,
        notes,
        isArchived: false,
        createdAt: new Date().toISOString(),
      });

      if (isPaid) {
        paidDebtTitles.add(title);
      }
    }
  });

  return { debts: parsedDebts, paidDebtTitles };
}

/**
 * Fallback raw objects parser
 */
function parseDebtsFromRawObjects(rawList: any[], existingDebts: Debt[]): Debt[] {
  return rawList.map((item, idx) => ({
    id: item.id || `debt-imp-${Date.now()}-${idx}`,
    title: item.title || item.عنوان || `قسط ${idx + 1}`,
    amount: parseAmountNumber(item.amount || item.مبلغ || 0),
    cardNumber: item.cardNumber || item.شماره_کارت || item['شماره کارت'] || '',
    iban: item.iban || item.شماره_شبا || item['شماره شبا'] || '',
    paymentUrl: item.paymentUrl || item.لینک_پرداخت || item['لینک پرداخت'] || '',
    notes: item.notes || item.یادداشت || item.توضیحات || '',
    isArchived: Boolean(item.isArchived),
    createdAt: item.createdAt || new Date().toISOString(),
  }));
}

/**
 * Merge or Replace imported debts into AppState
 */
function buildUpdatedStateWithDebts(
  currentState: AppState,
  newDebts: Debt[],
  mode: 'merge' | 'replace',
  paidDebtTitles?: Set<string>
): AppState {
  let updatedDebts: Debt[] = [];

  if (mode === 'replace') {
    updatedDebts = newDebts;
  } else {
    // Merge: update existing debts if title matches, otherwise append new debts
    const existingMap = new Map<string, Debt>();
    currentState.debts.forEach((d) => existingMap.set(d.title.trim(), d));

    newDebts.forEach((nd) => {
      const key = nd.title.trim();
      if (existingMap.has(key)) {
        const existing = existingMap.get(key)!;
        existingMap.set(key, {
          ...existing,
          amount: nd.amount || existing.amount,
          cardNumber: nd.cardNumber || existing.cardNumber,
          iban: nd.iban || existing.iban,
          paymentUrl: nd.paymentUrl || existing.paymentUrl,
          notes: nd.notes || existing.notes,
        });
      } else {
        existingMap.set(key, nd);
      }
    });

    updatedDebts = Array.from(existingMap.values());
  }

  // Update payments log for active month if any debts were marked paid
  let updatedPayments = [...currentState.payments];
  if (paidDebtTitles && paidDebtTitles.size > 0) {
    const activeMonthId = currentState.activeMonthId;
    updatedDebts.forEach((debt) => {
      if (paidDebtTitles.has(debt.title.trim())) {
        const existingIdx = updatedPayments.findIndex(
          (p) => p.monthId === activeMonthId && p.debtId === debt.id
        );
        if (existingIdx >= 0) {
          updatedPayments[existingIdx] = {
            ...updatedPayments[existingIdx],
            paid: true,
            paidAt: new Date().toISOString(),
          };
        } else {
          updatedPayments.push({
            monthId: activeMonthId,
            debtId: debt.id,
            paid: true,
            paidAt: new Date().toISOString(),
          });
        }
      }
    });
  }

  return {
    ...currentState,
    debts: updatedDebts,
    payments: updatedPayments,
  };
}
