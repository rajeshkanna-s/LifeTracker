# Requirements Document

## Introduction

The Monthly Reports Download feature enables users to generate and download comprehensive monthly summary reports across all modules of the MyLifeTracker app. Users can select a specific month and year, choose which modules to include, and download the consolidated report as a PDF or Excel file. This provides a single, unified view of monthly activity across Expenses, Debts, Jobs, Habits, Fitness, Routines, and Notes.

## Glossary

- **Report_Generator**: The system component responsible for aggregating data from selected modules and producing downloadable report files
- **Module**: A functional area of the app (Expenses, Debts, Jobs, Habits, Fitness, Notes, Routines)
- **Monthly_Report**: A downloadable document summarizing a user's activity for a selected calendar month
- **Report_Period**: A specific calendar month and year selected by the user (e.g., January 2025)
- **PDF_Exporter**: The component that formats report data into a styled PDF document using jsPDF
- **Excel_Exporter**: The component that formats report data into an Excel workbook using the xlsx library
- **Currency_Settings**: The user-configured currency symbol and code used for monetary values

## Requirements

### Requirement 1: Month and Year Selection

**User Story:** As a user, I want to select a specific month and year for my report, so that I can review my activity for any past month.

#### Acceptance Criteria

1. THE Report_Generator SHALL display a month-year picker defaulting to the current month
2. WHEN the user selects a Report_Period, THE Report_Generator SHALL update the report preview to reflect data from that month
3. THE Report_Generator SHALL allow selection of any month from the earliest recorded data up to the current month

### Requirement 2: Module Selection

**User Story:** As a user, I want to choose which modules to include in my monthly report, so that I can customize the report to my needs.

#### Acceptance Criteria

1. THE Report_Generator SHALL display checkboxes for each available Module (Expenses, Debts, Jobs, Habits, Fitness, Routines, Notes)
2. THE Report_Generator SHALL select all modules by default
3. WHEN the user deselects a Module, THE Report_Generator SHALL exclude that module's data from the generated report
4. IF no modules are selected, THEN THE Report_Generator SHALL disable the download button and display a message indicating at least one module is required

### Requirement 3: Expense Module Summary

**User Story:** As a user, I want my monthly report to include an expense summary, so that I can see my spending patterns for the month.

#### Acceptance Criteria

1. WHEN the Expenses module is selected, THE Report_Generator SHALL include total spending for the Report_Period
2. WHEN the Expenses module is selected, THE Report_Generator SHALL include a category-wise breakdown of expenses with amounts and percentages
3. WHEN the Expenses module is selected, THE Report_Generator SHALL include the top 5 largest expenses for the month
4. WHEN the Expenses module is selected, THE Report_Generator SHALL display all monetary values using the user's configured Currency_Settings

### Requirement 4: Debt Module Summary

**User Story:** As a user, I want my monthly report to include a debt summary, so that I can track my repayment progress.

#### Acceptance Criteria

1. WHEN the Debts module is selected, THE Report_Generator SHALL include total outstanding balance as of the end of the Report_Period
2. WHEN the Debts module is selected, THE Report_Generator SHALL include total payments made during the Report_Period
3. WHEN the Debts module is selected, THE Report_Generator SHALL include a per-debt breakdown showing source, paid amount, and remaining balance
4. WHEN the Debts module is selected, THE Report_Generator SHALL display all monetary values using the user's configured Currency_Settings

### Requirement 5: Jobs Module Summary

**User Story:** As a user, I want my monthly report to include a job applications summary, so that I can review my job search progress.

#### Acceptance Criteria

1. WHEN the Jobs module is selected, THE Report_Generator SHALL include the count of applications submitted during the Report_Period
2. WHEN the Jobs module is selected, THE Report_Generator SHALL include a status breakdown (Applied, Interview, Offer, Rejected) for applications active during the Report_Period
3. WHEN the Jobs module is selected, THE Report_Generator SHALL list companies and roles applied to during the Report_Period

### Requirement 6: Habits Module Summary

**User Story:** As a user, I want my monthly report to include a habits summary, so that I can see my consistency for the month.

#### Acceptance Criteria

1. WHEN the Habits module is selected, THE Report_Generator SHALL include the overall completion rate across all habits for the Report_Period
2. WHEN the Habits module is selected, THE Report_Generator SHALL include per-habit completion counts and rates
3. WHEN the Habits module is selected, THE Report_Generator SHALL highlight the top 3 most consistent habits for the month

### Requirement 7: Fitness Module Summary

**User Story:** As a user, I want my monthly report to include a fitness summary, so that I can review my workout activity.

#### Acceptance Criteria

1. WHEN the Fitness module is selected, THE Report_Generator SHALL include total workouts logged during the Report_Period
2. WHEN the Fitness module is selected, THE Report_Generator SHALL include total duration in minutes and total calories burned
3. WHEN the Fitness module is selected, THE Report_Generator SHALL include a breakdown by workout type

### Requirement 8: Routines Module Summary

**User Story:** As a user, I want my monthly report to include a routines summary, so that I can see how well I followed my routines.

#### Acceptance Criteria

1. WHEN the Routines module is selected, THE Report_Generator SHALL include total routine completions for the Report_Period
2. WHEN the Routines module is selected, THE Report_Generator SHALL include per-routine completion rate compared to the expected frequency
3. WHEN the Routines module is selected, THE Report_Generator SHALL identify routines with completion rate below 50% as needing attention

### Requirement 9: Notes Module Summary

**User Story:** As a user, I want my monthly report to include a notes summary, so that I can see my journaling activity.

#### Acceptance Criteria

1. WHEN the Notes module is selected, THE Report_Generator SHALL include the count of notes created during the Report_Period
2. WHEN the Notes module is selected, THE Report_Generator SHALL list note dates for the Report_Period

### Requirement 10: PDF Download

**User Story:** As a user, I want to download my monthly report as a PDF, so that I can save or print a formatted document.

#### Acceptance Criteria

1. WHEN the user clicks the PDF download button, THE PDF_Exporter SHALL generate a styled PDF document containing all selected module summaries
2. THE PDF_Exporter SHALL include a report header with the app name, Report_Period, and generation date
3. THE PDF_Exporter SHALL organize each module summary in a separate section with clear headings
4. THE PDF_Exporter SHALL use tables for tabular data (expenses breakdown, debt details, job applications)
5. THE PDF_Exporter SHALL name the downloaded file using the pattern "monthly-report-YYYY-MM.pdf"

### Requirement 11: Excel Download

**User Story:** As a user, I want to download my monthly report as an Excel file, so that I can further analyze my data in a spreadsheet.

#### Acceptance Criteria

1. WHEN the user clicks the Excel download button, THE Excel_Exporter SHALL generate an Excel workbook containing all selected module summaries
2. THE Excel_Exporter SHALL create a separate worksheet for each selected Module
3. THE Excel_Exporter SHALL include column headers in each worksheet
4. THE Excel_Exporter SHALL name the downloaded file using the pattern "monthly-report-YYYY-MM.xlsx"

### Requirement 12: Report Access Point

**User Story:** As a user, I want to easily access the monthly reports feature, so that I can generate reports without navigating through multiple screens.

#### Acceptance Criteria

1. THE Report_Generator SHALL be accessible from a dedicated "Monthly Reports" navigation item or button in the app
2. WHEN the user navigates to the Monthly Reports section, THE Report_Generator SHALL display the month selector, module checkboxes, and download buttons on a single page

### Requirement 13: Empty State Handling

**User Story:** As a user, I want clear feedback when no data exists for a selected month, so that I understand why the report is empty.

#### Acceptance Criteria

1. IF no data exists for any selected module in the chosen Report_Period, THEN THE Report_Generator SHALL display a message indicating no data is available for that month
2. IF a specific module has no data for the Report_Period, THEN THE Report_Generator SHALL indicate "No data" for that module section in the generated report rather than omitting the section entirely
