import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Debt, DebtSettings, JobApplication } from '../types';

const getPDFCurrencySymbol = (symbol: string): string => {
  const map: Record<string, string> = { "₹": "Rs.", "€": "EUR", "£": "GBP", "¥": "JPY", "$": "USD" };
  return map[symbol] || symbol;
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
