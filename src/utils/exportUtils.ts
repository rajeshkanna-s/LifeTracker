import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Debt, DebtSettings, JobApplication, Expense, ExpenseSettings } from '../types';

const getPDFCurrencySymbol = (symbol: string): string => {
  const map: Record<string, string> = { "₹": "Rs.", "€": "EUR", "£": "GBP", "¥": "JPY", "$": "USD" };
  return map[symbol] || symbol;
};

// ── Expense Report Exports ──
export interface ExpenseReportSummary {
  total: number;
  count: number;
  avgPerTxn: number;
  avgPerDay: number;
  largest: number;
  smallest: number;
  activeDays: number;
}

export interface CategoryBreakdownRow {
  category: string;
  amount: number;
  percentage: number;
}

export const exportExpensesToExcel = (
  expenses: Expense[],
  breakdown: CategoryBreakdownRow[],
  settings: ExpenseSettings,
  fromDate: string,
  toDate: string,
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Expense detail
  const detail = expenses.map((e, i) => ({
    "S.No": i + 1,
    "Date": e.date,
    "Time": e.time || "-",
    "Category": e.category,
    "Platform": e.platform || "-",
    "Payment Method": e.payment_method || "-",
    [`Amount (${settings.currencySymbol})`]: Number(e.amount),
    "Person": e.person || "-",
    "Tags": e.tags || "-",
    "Description": e.description || "-",
  }));
  const ws1 = XLSX.utils.json_to_sheet(detail);
  ws1["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Expenses");

  // Sheet 2: Category breakdown
  const cat = breakdown.map((b, i) => ({
    "S.No": i + 1,
    "Category": b.category,
    [`Amount (${settings.currencySymbol})`]: b.amount,
    "Percentage (%)": b.percentage,
  }));
  const ws2 = XLSX.utils.json_to_sheet(cat);
  ws2["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "By Category");

  XLSX.writeFile(wb, `expense-report-${fromDate}-to-${toDate}.xlsx`);
};

export const exportExpensesToPDF = (
  expenses: Expense[],
  summary: ExpenseReportSummary,
  breakdown: CategoryBreakdownRow[],
  settings: ExpenseSettings,
  fromDate: string,
  toDate: string,
) => {
  const doc = new jsPDF();
  const cur = getPDFCurrencySymbol(settings.currencySymbol);
  const money = (n: number) => `${cur} ${Number(n).toLocaleString()}`;

  // Header
  doc.setFillColor(16, 185, 129); doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text("EXPENSE REPORT", 105, 18, { align: "center" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`Period: ${fromDate} to ${toDate}  |  Generated: ${format(new Date(), "yyyy-MM-dd")}`, 105, 27, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Summary
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Summary", 15, 48);
  autoTable(doc, {
    startY: 52,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
    head: [["Total", "Transactions", "Avg / Txn", "Avg / Day", "Largest", "Smallest", "Active Days"]],
    body: [[
      money(summary.total), summary.count.toString(), money(summary.avgPerTxn),
      money(summary.avgPerDay), money(summary.largest), money(summary.smallest), summary.activeDays.toString(),
    ]],
  });

  // Category breakdown
  const afterSummary = (doc as any).lastAutoTable?.finalY ?? 70;
  doc.setFont("helvetica", "bold"); doc.text("By Category", 15, afterSummary + 10);
  autoTable(doc, {
    startY: afterSummary + 14,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
    head: [["#", "Category", "Amount", "%"]],
    body: breakdown.map((b, i) => [(i + 1).toString(), b.category, money(b.amount), `${b.percentage}%`]),
  });

  // Expense detail
  const afterCat = (doc as any).lastAutoTable?.finalY ?? afterSummary + 30;
  doc.setFont("helvetica", "bold"); doc.text("Expense Details", 15, afterCat + 10);
  autoTable(doc, {
    startY: afterCat + 14,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
    head: [["Date", "Category", "Platform", "Payment", "Amount"]],
    body: expenses.map((e) => [
      e.date,
      (e.category || "-").substring(0, 18),
      (e.platform || "-").substring(0, 14),
      (e.payment_method || "-").substring(0, 14),
      money(e.amount),
    ]),
  });

  doc.save(`expense-report-${fromDate}-to-${toDate}.pdf`);
};

// ── Debt Exports ──
export const exportDebtToExcel = (debts: Debt[], settings: DebtSettings, filename = "debt-report") => {
  const summary = debts.map((d, i) => ({
    "S.No": i + 1,
    "Debt ID": d.id,
    "Source": d.source,
    "Type": d.type,
    "Closing Month": d.closing_month || "-",
    [`Original Amount (${settings.currencySymbol})`]: d.original_amount,
    [`Paid Amount (${settings.currencySymbol})`]: d.paid_amount,
    [`Current Balance (${settings.currencySymbol})`]: d.current_balance,
    [`Monthly EMI (${settings.currencySymbol})`]: d.emi_amount || "-",
    "Notes": d.notes || "-",
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(summary);
  ws1["!cols"] = Array(10).fill({ wch: 15 });
  XLSX.utils.book_append_sheet(wb, ws1, "Debt Summary");
  XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportDebtToPDF = (debts: Debt[], settings: DebtSettings) => {
  const doc = new jsPDF();
  const safeCurrency = getPDFCurrencySymbol(settings.currencySymbol);

  // Header
  doc.setFillColor(220, 38, 38); doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text("DEBT TRACKING REPORT", 105, 22, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Summary
  const totalDebt = debts.reduce((s, d) => s + d.original_amount, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paid_amount, 0);
  const outstanding = debts.reduce((s, d) => s + d.current_balance, 0);
  
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Summary", 15, 50);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, 55, 55, 25, 3, 3, "F"); doc.roundedRect(77, 55, 55, 25, 3, 3, "F"); doc.roundedRect(139, 55, 55, 25, 3, 3, "F");
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Original Debt", 20, 65); doc.setFont("helvetica", "bold"); doc.text(`${safeCurrency} ${totalDebt.toLocaleString()}`, 20, 75);
  doc.setFont("helvetica", "normal"); doc.text("Total Paid", 82, 65);
  doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74); doc.text(`${safeCurrency} ${totalPaid.toLocaleString()}`, 82, 75);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.text("Outstanding", 144, 65);
  doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38); doc.text(`${safeCurrency} ${outstanding.toLocaleString()}`, 144, 75);
  doc.setTextColor(0, 0, 0);

  // Table
  doc.setFont("helvetica", "bold"); doc.text("Debt Details", 15, 95);
  const tableData = debts.map((d, i) => [
    (i + 1).toString(), d.source.substring(0, 14), d.type.substring(0, 12) || "-",
    `${safeCurrency} ${d.original_amount.toLocaleString()}`, `${safeCurrency} ${d.paid_amount.toLocaleString()}`,
    `${safeCurrency} ${d.current_balance.toLocaleString()}`
  ]);
  
  autoTable(doc, {
    head: [["#", "Source", "Type", "Original", "Paid", "Balance"]], body: tableData, startY: 100,
    theme: "striped", styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: "bold" },
  });
  doc.save(`debt-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

// ── Job Exports ──
export const exportJobsToExcel = (jobs: JobApplication[], filename = "job-applications") => {
  const summary = jobs.map((j, i) => ({
    "S.No": i + 1,
    "Company": j.company,
    "Role": j.role || "-",
    "Applied Date": j.applied_date ? format(new Date(j.applied_date), "dd-MM-yyyy") : "-",
    "Source": j.source || "-",
    "Status": j.status,
    "Job Type": j.job_type || "-",
    "Interview Date": j.interview_date ? format(new Date(j.interview_date), "dd-MM-yyyy") : "-",
    "Offer Amount": j.offer_amount || "-",
    "Notes": j.notes || "-",
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(summary);
  ws1["!cols"] = Array(10).fill({ wch: 15 });
  XLSX.utils.book_append_sheet(wb, ws1, "Job Applications");
  XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportJobsToPDF = (jobs: JobApplication[]) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(79, 70, 229); doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text("JOB APPLICATIONS REPORT", 105, 22, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Summary
  const totalApplied = jobs.length;
  const interviews = jobs.filter(j => j.status === 'Interview').length;
  const offers = jobs.filter(j => j.status === 'Offer').length;
  const rejected = jobs.filter(j => j.status === 'Rejected').length;
  
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Summary", 15, 50);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, 55, 40, 25, 3, 3, "F"); doc.roundedRect(60, 55, 40, 25, 3, 3, "F"); 
  doc.roundedRect(105, 55, 40, 25, 3, 3, "F"); doc.roundedRect(150, 55, 40, 25, 3, 3, "F");
  
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Applied", 20, 65); doc.setFont("helvetica", "bold"); doc.text(`${totalApplied}`, 20, 75);
  doc.setFont("helvetica", "normal"); doc.text("Interviews", 65, 65); doc.setFont("helvetica", "bold"); doc.text(`${interviews}`, 65, 75);
  doc.setFont("helvetica", "normal"); doc.text("Offers", 110, 65); doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74); doc.text(`${offers}`, 110, 75);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.text("Rejected", 155, 65); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38); doc.text(`${rejected}`, 155, 75);
  doc.setTextColor(0, 0, 0);

  // Table
  doc.setFont("helvetica", "bold"); doc.text("Application Details", 15, 95);
  const tableData = jobs.map((j, i) => [
    (i + 1).toString(), j.company.substring(0, 14), j.role.substring(0, 14) || "-",
    j.applied_date ? format(new Date(j.applied_date), "dd-MM-yy") : "-",
    j.status,
    j.interview_date ? format(new Date(j.interview_date), "dd-MM-yy") : "-"
  ]);
  
  autoTable(doc, {
    head: [["#", "Company", "Role", "Applied", "Status", "Interview"]], body: tableData, startY: 100,
    theme: "striped", styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
  });
  doc.save(`jobs-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
