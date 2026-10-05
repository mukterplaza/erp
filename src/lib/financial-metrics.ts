type MoneyValue = string | number | null | undefined;

type AccountRow = { code: string; balance: MoneyValue };
type InvoiceRow = {
  status: string;
  totalAmount: MoneyValue;
  paidAmount: MoneyValue;
  outstandingAmount: MoneyValue;
};
type ExpenseRow = { approvalStatus: string; amount: MoneyValue };
type PayrollRow = { status: string; netSalary: MoneyValue };
type PaymentRow = { isVoid: boolean; paymentType: string; amount: MoneyValue };
type SupplierRow = { outstandingPayable: MoneyValue };
type ContractorRow = { outstandingDue: MoneyValue };
type SupplierBillRow = { status: string; outstandingAmount: MoneyValue };

function amount(value: MoneyValue) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateFinancialDashboardMetrics(data: {
  accounts?: AccountRow[];
  invoices?: InvoiceRow[];
  expenses?: ExpenseRow[];
  payrolls?: PayrollRow[];
  payments?: PaymentRow[];
  suppliers?: SupplierRow[];
  contractors?: ContractorRow[];
  supplierBills?: SupplierBillRow[];
} = {}) {
  const accounts = data.accounts || [];
  const cash = amount(accounts.find((account) => account.code === "1010")?.balance);
  const bank = amount(accounts.find((account) => account.code === "1020")?.balance);
  const invoices = (data.invoices || []).filter((invoice) => invoice.status !== "Void");
  const expenses = (data.expenses || []).filter((expense) => expense.approvalStatus === "Approved");
  const paidPayrolls = (data.payrolls || []).filter((payroll) => payroll.status === "Paid");
  const payments = (data.payments || []).filter((payment) => !payment.isVoid);
  const clientReceipts = payments.filter((payment) => payment.paymentType === "Client Receipt");
  const supplierBills = (data.supplierBills || []).filter((bill) => bill.status !== "Void");
  const revenue = invoices.reduce((sum, invoice) => sum + amount(invoice.totalAmount), 0);
  const receivables = invoices.reduce((sum, invoice) => sum + amount(invoice.outstandingAmount), 0);
  const collected = clientReceipts.reduce((sum, payment) => sum + amount(payment.amount), 0);
  const projectCosts = expenses.reduce((sum, expense) => sum + amount(expense.amount), 0);
  const payrollDisbursed = paidPayrolls.reduce((sum, payroll) => sum + amount(payroll.netSalary), 0);
  const supplierDue = (data.suppliers || []).reduce((sum, supplier) => sum + amount(supplier.outstandingPayable), 0);
  const contractorDue = (data.contractors || []).reduce((sum, contractor) => sum + amount(contractor.outstandingDue), 0);
  const hasFinancialActivity =
    accounts.some((account) => amount(account.balance) !== 0) ||
    invoices.length > 0 ||
    expenses.length > 0 ||
    paidPayrolls.length > 0 ||
    payments.length > 0 ||
    supplierBills.length > 0 ||
    supplierDue !== 0 ||
    contractorDue !== 0;

  return {
    cash,
    bank,
    revenue,
    netProfit: revenue - projectCosts - payrollDisbursed,
    receivables,
    collected,
    supplierDue,
    contractorDue,
    projectCosts,
    payrollDisbursed,
    hasFinancialActivity,
  };
}
