export interface Debt {
  id: string;
  title: string;
  amount: number; // In Tomans
  cardNumber: string; // 16-digit card number
  iban: string; // IBAN string starting with IR...
  paymentUrl: string; // Payment portal or web URL
  notes: string; // Contract # or custom notes
  isArchived: boolean; // Transferred to "تمام شده‌ها"
  archivedAt?: string;
  createdAt: string;
}

export interface MonthRecord {
  id: string; // Format e.g. "1402-04"
  year: number; // e.g. 1402
  monthIndex: number; // 0: فروردین, 1: اردیبهشت, ..., 3: تیر, ..., 11: اسفند
  label: string; // e.g. "تیر ۱۴۰۲"
  createdAt: string;
}

export interface PaymentLog {
  monthId: string; // e.g. "1402-04"
  debtId: string;
  paid: boolean; // true = پرداخت شده, false = پرداخت نشده
  paidAt?: string;
  note?: string; // Monthly specific note (e.g. "این ماه به دلیل خرید ماشین، این قسط معوق شد")
}

export interface UnpaidMonthInfo {
  monthId: string;
  label: string;
  isCurrentMonth: boolean;
  note?: string;
}

export type DebtFilter = 'all' | 'unpaid' | 'paid' | 'overdue';
export type DebtSort = 'amount-desc' | 'amount-asc' | 'title';

export interface AppState {
  debts: Debt[];
  months: MonthRecord[];
  activeMonthId: string;
  payments: PaymentLog[]; // Keyed by monthId + debtId or list
}
