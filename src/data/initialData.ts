import { Debt, MonthRecord, PaymentLog } from '../types';
import { getCurrentJalaliMonthRecord } from '../utils/persian';

export const INITIAL_DEBTS: Debt[] = [];

// Current Month dynamically detected based on system date
export const initialCurrentMonth = getCurrentJalaliMonthRecord();

export const INITIAL_MONTHS: MonthRecord[] = [
  initialCurrentMonth,
];

export const INITIAL_PAYMENTS: PaymentLog[] = INITIAL_DEBTS
  .filter((d) => !d.isArchived)
  .map((d) => ({
    monthId: initialCurrentMonth.id,
    debtId: d.id,
    paid: false,
  }));

