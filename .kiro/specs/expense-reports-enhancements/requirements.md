# Requirements Document

## Introduction

The Expense Reports Enhancements feature expands the in-app Expense Reports page (`src/components/expenses/ExpenseReports.tsx`) from a single category pie chart and CSV export into a richer analytics view. It adds spending trends over time, period-over-period comparison, additional breakdowns (platform, payment method, person, tags), top expenses, budget-vs-actual analysis, expanded summary statistics, and additional export formats (PDF and Excel) for the currently filtered expense set.

This feature operates entirely on the in-memory `Expense[]` already loaded by `ExpenseTracker` and the user's `ExpenseSettings`. It is scoped to the Expenses module's own Reports tab and is distinct from the separate `monthly-reports-download` feature, which produces a consolidated cross-module report. All existing functionality (filters, total card, category pie, expense history list with edit/delete) is preserved.

## Glossary

- **Expense_Reports**: The Expenses module Reports tab component that displays analytics and export controls for filtered expenses.
- **Filtered_Set**: The subset of expenses remaining after the active filters (date range, category, platform, payment method) are applied.
- **Report_Period**: The date range defined by the active "From" and "To" filters.
- **Comparison_Period**: A second date range of equal length immediately preceding the Report_Period, used for period-over-period comparison.
- **Trend_Series**: A time-ordered series of total spending amounts grouped by a selected time granularity (day, week, or month).
- **Time_Granularity**: The grouping interval for the Trend_Series, one of: day, week, or month.
- **Breakdown_Dimension**: A field by which spending is grouped and summed, one of: category, platform, payment method, person, or tag.
- **Summary_Statistics**: A set of computed aggregate values for the Filtered_Set (total, transaction count, average per transaction, average per day, largest expense, smallest expense, number of active spending days).
- **Budget_Comparison**: A comparison of actual spending against the configured budget, computed for the overall monthly budget and per-category budgets.
- **PDF_Exporter**: The component that formats the Filtered_Set and its summaries into a styled PDF document using jsPDF and jspdf-autotable.
- **Excel_Exporter**: The component that formats the Filtered_Set and its summaries into an Excel workbook using the xlsx library.
- **Currency_Settings**: The user-configured currency symbol (`settings.currencySymbol`) used to format monetary values.
- **Top_Expenses**: The largest individual expenses in the Filtered_Set, ordered by amount in descending order.

## Requirements

### Requirement 1: Spending Trend Over Time

**User Story:** As a user, I want to see how my spending changes over time, so that I can identify spending trends and spikes.

#### Acceptance Criteria

1. THE Expense_Reports SHALL display a Trend_Series chart of total spending for the Filtered_Set grouped by the selected Time_Granularity.
2. THE Expense_Reports SHALL provide a control to switch the Time_Granularity between day, week, and month.
3. WHEN the user changes the Time_Granularity, THE Expense_Reports SHALL recompute and redraw the Trend_Series chart using the new granularity.
4. THE Expense_Reports SHALL order the Trend_Series points chronologically from earliest to latest.
5. WHERE a time interval within the Report_Period contains no expenses, THE Expense_Reports SHALL represent that interval with a total of zero.
6. IF the Filtered_Set is empty, THEN THE Expense_Reports SHALL display an empty-state message in place of the Trend_Series chart.

### Requirement 2: Period-Over-Period Comparison

**User Story:** As a user, I want to compare my spending in the selected period against the previous period of equal length, so that I can tell whether my spending is increasing or decreasing.

#### Acceptance Criteria

1. THE Expense_Reports SHALL compute total spending for the Report_Period and total spending for the Comparison_Period.
2. THE Expense_Reports SHALL define the Comparison_Period as the date range of equal day-length immediately preceding the Report_Period.
3. THE Expense_Reports SHALL display the absolute difference and the percentage change between the Report_Period total and the Comparison_Period total.
4. WHEN the Report_Period total is greater than the Comparison_Period total, THE Expense_Reports SHALL indicate an increase.
5. WHEN the Report_Period total is less than the Comparison_Period total, THE Expense_Reports SHALL indicate a decrease.
6. IF the Comparison_Period total is zero, THEN THE Expense_Reports SHALL display the absolute difference and suppress the percentage change to avoid division by zero.
7. WHILE the percentage change is suppressed due to a zero Comparison_Period total, THE Expense_Reports SHALL still indicate whether the Report_Period total represents an increase or a decrease.

### Requirement 3: Summary Statistics

**User Story:** As a user, I want richer summary numbers for my filtered expenses, so that I can understand my spending at a glance beyond just the total.

#### Acceptance Criteria

1. THE Expense_Reports SHALL display the total spending amount for the Filtered_Set.
2. THE Expense_Reports SHALL display the transaction count of the Filtered_Set.
3. THE Expense_Reports SHALL display the average amount per transaction for the Filtered_Set.
4. THE Expense_Reports SHALL display the average spending per day across the Report_Period.
5. THE Expense_Reports SHALL display the largest single expense amount in the Filtered_Set.
6. THE Expense_Reports SHALL display the count of distinct dates on which at least one expense occurred in the Filtered_Set.
7. THE Expense_Reports SHALL format every monetary value in the Summary_Statistics using the Currency_Settings.
8. IF the Filtered_Set is empty, THEN THE Expense_Reports SHALL display zero for each numeric statistic.

### Requirement 4: Spending Breakdown by Multiple Dimensions

**User Story:** As a user, I want to break down my spending by platform, payment method, person, and tags in addition to category, so that I can understand where and how my money is spent.

#### Acceptance Criteria

1. THE Expense_Reports SHALL display a spending breakdown grouped by the selected Breakdown_Dimension showing each group's total amount and percentage of the Filtered_Set total.
2. THE Expense_Reports SHALL provide a control to switch the Breakdown_Dimension between category, platform, payment method, person, and tag.
3. THE Expense_Reports SHALL order breakdown groups by total amount in descending order.
4. WHERE an expense has an empty value for the selected Breakdown_Dimension, THE Expense_Reports SHALL assign that expense to a group labeled "Uncategorized".
5. WHEN the selected Breakdown_Dimension is tag and an expense has multiple comma-separated tags, THE Expense_Reports SHALL attribute the expense amount to each of the expense's tags.
6. IF the Filtered_Set is empty, THEN THE Expense_Reports SHALL display an empty-state message in place of the breakdown.

### Requirement 5: Top Expenses

**User Story:** As a user, I want to see my largest individual expenses for the selected period, so that I can identify high-impact transactions.

#### Acceptance Criteria

1. THE Expense_Reports SHALL display the Top_Expenses from the Filtered_Set, limited to at most 10 entries.
2. THE Expense_Reports SHALL order the Top_Expenses by amount in descending order.
3. THE Expense_Reports SHALL display the amount, description or category, and date for each entry in the Top_Expenses.
4. WHERE the Filtered_Set contains fewer than 10 expenses, THE Expense_Reports SHALL display all expenses in the Filtered_Set.
5. THE Expense_Reports SHALL format each monetary value in the Top_Expenses using the Currency_Settings.
6. IF no expenses in the Filtered_Set qualify as Top_Expenses, THEN THE Expense_Reports SHALL display nothing in the Top_Expenses area even when the Filtered_Set is non-empty.

### Requirement 6: Budget vs Actual Comparison

**User Story:** As a user, I want to compare my actual spending against my budgets, so that I can tell whether I am within budget.

#### Acceptance Criteria

1. WHERE the monthly budget is greater than zero, THE Expense_Reports SHALL display the monthly budget amount, the actual spending for the current calendar month, and the remaining or overspent amount.
2. WHERE the monthly budget is greater than zero, THE Expense_Reports SHALL display the percentage of the monthly budget consumed by the current calendar month's spending.
3. IF the monthly budget is zero or negative, THEN THE Expense_Reports SHALL hide the monthly Budget_Comparison display.
4. WHERE per-category budgets are configured, THE Expense_Reports SHALL display, for each budgeted category, the budget amount, the actual spending for that category, and the percentage consumed.
5. WHEN actual spending for a budgeted item meets or exceeds its budget amount, THE Expense_Reports SHALL visually distinguish that item as over budget.
6. WHERE no monthly budget and no per-category budgets are configured, THE Expense_Reports SHALL display a message indicating that no budgets are set.

### Requirement 7: PDF Export of Filtered Report

**User Story:** As a user, I want to export my filtered expense report as a PDF, so that I can save or print a formatted document.

#### Acceptance Criteria

1. WHEN the user activates the PDF export control, THE PDF_Exporter SHALL generate a styled PDF document for the Filtered_Set.
2. THE PDF_Exporter SHALL include a header containing the report title, the Report_Period, and the generation date.
3. THE PDF_Exporter SHALL include the Summary_Statistics in the PDF document.
4. THE PDF_Exporter SHALL include a category breakdown table and an expense detail table in the PDF document.
5. THE PDF_Exporter SHALL format monetary values using a PDF-safe representation of the Currency_Settings.
6. THE PDF_Exporter SHALL name the downloaded file using the pattern `expense-report-{fromDate}-to-{toDate}.pdf`.
7. IF the Filtered_Set is empty, THEN THE PDF_Exporter SHALL NOT generate a PDF document and SHALL display a message indicating there is no data to export.
8. IF PDF generation fails, THEN THE PDF_Exporter SHALL display an error message and SHALL NOT trigger a file download.

### Requirement 8: Excel Export of Filtered Report

**User Story:** As a user, I want to export my filtered expense report as an Excel file, so that I can further analyze my data in a spreadsheet.

#### Acceptance Criteria

1. WHEN the user activates the Excel export control, THE Excel_Exporter SHALL generate an Excel workbook for the Filtered_Set.
2. THE Excel_Exporter SHALL include a worksheet listing each expense in the Filtered_Set with columns for date, time, category, platform, payment method, amount, person, tags, and description.
3. THE Excel_Exporter SHALL include a worksheet containing the category breakdown with amounts and percentages.
4. THE Excel_Exporter SHALL include column headers in each worksheet.
5. THE Excel_Exporter SHALL name the downloaded file using the pattern `expense-report-{fromDate}-to-{toDate}.xlsx`.
6. IF Excel generation fails, THEN THE Excel_Exporter SHALL display an error message and SHALL NOT trigger a file download.

### Requirement 9: Preserve Existing Reporting Functionality

**User Story:** As a user, I want my existing reports controls to keep working, so that the enhancements add value without removing what I already use.

#### Acceptance Criteria

1. THE Expense_Reports SHALL retain the existing filters for date range, category, platform, and payment method.
2. THE Expense_Reports SHALL retain the existing category pie chart.
3. THE Expense_Reports SHALL retain the existing CSV export control.
4. THE Expense_Reports SHALL retain the existing expense history list with its edit and delete actions.
5. WHEN the user changes any filter, THE Expense_Reports SHALL recompute all charts, statistics, breakdowns, and comparisons from the updated Filtered_Set.

### Requirement 10: Responsive Layout

**User Story:** As a user on a phone, I want the enhanced reports to be readable on small screens, so that I can review my spending on any device.

#### Acceptance Criteria

1. WHILE the viewport width is below the small-screen breakpoint, THE Expense_Reports SHALL arrange report cards in a single-column layout.
2. WHILE the viewport width is at or above the large-screen breakpoint, THE Expense_Reports SHALL arrange report cards in a multi-column layout.
3. THE Expense_Reports SHALL render charts within a responsive container that adapts to the available width.
