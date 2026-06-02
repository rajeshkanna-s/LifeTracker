# Bugfix Requirements Document

## Introduction

In the Expense tracker's Settings tab, the "Quick Add Templates" section provides an "Add New Template" / "Edit Template" form. The field labeled "Emoji Icon (e.g. ☕)" is currently a plain free-text `<input>` (see `src/components/expenses/ExpenseSettings.tsx`), which forces the user to manually type or paste an emoji character. No picker or scrollable list of emojis is presented, so users cannot browse and select an icon for their template.

The user reported: "When I try to edit emoji icon list not coming. Please check" and clarified the expectation as "Add all categories emojies" - meaning the picker should expose a comprehensive set of emojis covering every expense category supported by the app (Food, Grocery, Vegetables, Petrol / Fuel, Travel / Transport, Mobile Recharge, Internet Bill, Electricity Bill, Rent / Home Loan, EMIs / Loans, Education, Health / Medical, Entertainment, Cinema / Movies, Dress / Clothing, Shopping, Office, Kids / Family, Gifts / Donations, Home Maintenance, Savings / Investments, Social / Events, Miscellaneous), not only one example emoji.

This bug affects both the "Add New Template" and "Edit Template" flows because both reuse the same input control. The fix must let the user pick an emoji from a visible list grouped by category, while keeping the existing template add/edit/delete behavior intact.

## Bug Analysis

### Current Behavior (Defect)

When the user opens the "Quick Add Templates" section in Expense Settings and clicks the pencil icon on an existing template (or starts adding a new template), the icon field is rendered as a free-text input with no list of selectable emojis. The user cannot browse or pick from the available emojis for their category.

1.1 WHEN the user opens the "Edit Template" form for an existing Quick Add template THEN the system renders the emoji icon field as a plain text input with no picker or list of selectable emojis
1.2 WHEN the user opens the "Add New Template" form THEN the system renders the emoji icon field as a plain text input with no picker or list of selectable emojis
1.3 WHEN the user wants to choose an emoji for a category such as "Health / Medical", "Internet Bill", "Rent / Home Loan", or any other category that is not pre-seeded in `DEFAULT_QUICK_ADD` THEN the system provides no in-app way to discover or select an appropriate emoji
1.4 WHEN the user attempts to interact with the emoji icon field expecting a picker THEN the system requires the user to manually type or paste an emoji character from outside the app

### Expected Behavior (Correct)

The emoji icon control in both the "Add New Template" and "Edit Template" forms must present a visible, browsable picker showing emojis grouped by category. The picker must cover every expense category defined in `DEFAULT_CATEGORIES` (in `src/data/constants.ts`). Selecting an emoji from the picker must set it as the template's icon. The currently selected emoji must be visually indicated.

2.1 WHEN the user opens the "Edit Template" form for an existing Quick Add template THEN the system SHALL render an emoji picker that displays a list of selectable emojis grouped by expense category
2.2 WHEN the user opens the "Add New Template" form THEN the system SHALL render an emoji picker that displays a list of selectable emojis grouped by expense category
2.3 WHEN the emoji picker is rendered THEN the system SHALL include at least one emoji group for every category in `DEFAULT_CATEGORIES` (Food, Grocery, Vegetables, Petrol / Fuel, Travel / Transport, Mobile Recharge, Internet Bill, Electricity Bill, Rent / Home Loan, EMIs / Loans, Education, Health / Medical, Entertainment, Cinema / Movies, Dress / Clothing, Shopping, Office, Kids / Family, Gifts / Donations, Home Maintenance, Savings / Investments, Social / Events, Miscellaneous)
2.4 WHEN the emoji picker is rendered THEN the system SHALL provide at least 3 representative emojis per category group so the user has meaningful choice
2.5 WHEN the user clicks an emoji in the picker THEN the system SHALL set that emoji as the value of `newQuickAdd.icon` for the form
2.6 WHEN an emoji is selected THEN the system SHALL visually highlight the selected emoji in the picker (for example, with a ring, background, or border) so the user can see the current choice
2.7 WHEN the "Edit Template" form is opened for an existing template THEN the system SHALL pre-select the template's current `icon` in the picker
2.8 WHEN the user submits the form via "Add Template" or "Update Template" THEN the system SHALL persist the emoji chosen from the picker as the template's `icon` field
2.9 WHEN the picker contains many emojis THEN the system SHALL keep the picker usable on small screens (for example, scrollable within a bounded height) without breaking the surrounding settings layout

### Unchanged Behavior (Regression Prevention)

All existing template management behavior outside of the icon-selection mechanism must continue to work exactly as before. This includes form validation, add/edit/delete flows, persistence to Supabase via `expense_settings`, and other unrelated settings sections.

3.1 WHEN the user submits the form with a missing name, amount, or category THEN the system SHALL CONTINUE TO reject the submission (no template added or updated), matching the existing guard `if (!newQuickAdd.name || !newQuickAdd.amount || !newQuickAdd.category) return;`
3.2 WHEN the user clicks "Add Template" with valid name, amount, category, and a selected emoji THEN the system SHALL CONTINUE TO append a new `QuickAddTemplate` to `settings.quickAddTemplates` with a generated id, numeric amount, and the chosen icon
3.3 WHEN the user clicks "Update Template" while editing an existing template THEN the system SHALL CONTINUE TO update only the matching template (by id) in `settings.quickAddTemplates` and leave all other templates unchanged
3.4 WHEN the user clicks "Cancel" while editing a template THEN the system SHALL CONTINUE TO clear the editing state and reset the form to its empty defaults without modifying any template
3.5 WHEN the user clicks the trash icon on a template row THEN the system SHALL CONTINUE TO remove that template from `settings.quickAddTemplates` and, if it was being edited, reset the form
3.6 WHEN templates are loaded from Supabase via `expense_settings.settings_json` THEN the system SHALL CONTINUE TO render their existing `icon` value in the template list using the same visual treatment
3.7 WHEN the seeded `DEFAULT_QUICK_ADD` templates are present THEN the system SHALL CONTINUE TO display their original emojis (☕, 🍽️, 🛺, ⛽, 🛒, 🍪) unchanged
3.8 WHEN the user interacts with any other settings section (Currency, Family Members, Payment Methods, Categories, Platforms, Category Budgets, Savings Goals) THEN the system SHALL CONTINUE TO behave exactly as before with no functional change
3.9 WHEN the user opens the main Expense `Add` / `Edit Expense` form (`ExpenseForm.tsx`) THEN the system SHALL CONTINUE TO behave exactly as before, since this bug only concerns the Quick Add Template emoji field in Settings
3.10 WHEN any other tracker module (Debts, Jobs, Habits, Fitness, Notes, Routines, Vault) is used THEN the system SHALL CONTINUE TO behave exactly as before

## Deriving the Bug Condition

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type FormRenderState
         X.location ∈ {"AddNewTemplate", "EditTemplate"}  // form within ExpenseSettings → quickadd section
         X.iconControl                                    // the rendered control for choosing an emoji
  OUTPUT: boolean

  // The bug is present when the icon control is a free-text input
  // and does NOT expose a list/picker of selectable emojis grouped by category.
  RETURN X.location ∈ {"AddNewTemplate", "EditTemplate"}
         AND NOT hasEmojiPicker(X.iconControl)
END FUNCTION

FUNCTION hasEmojiPicker(control)
  RETURN control renders a visible list of selectable emojis
         AND the list is grouped by expense category
         AND the list covers every category in DEFAULT_CATEGORIES
         AND clicking an emoji sets it as the form's icon value
END FUNCTION
```

### Property Specification — Fix Checking

```pascal
// Property: Fix Checking - Emoji Picker Available and Functional
FOR ALL X WHERE isBugCondition(X) DO
  rendered ← render'(X)                                  // F'(X), the fixed render
  ASSERT rendered.iconControl shows a visible emoji picker
  ASSERT for every category C in DEFAULT_CATEGORIES,
         rendered.iconControl contains at least one emoji group labeled with C
         AND that group contains at least 3 emojis
  ASSERT clicking any emoji E in the picker results in
         newQuickAdd.icon = E
  ASSERT when X.location = "EditTemplate" with template T,
         rendered.iconControl visually marks T.icon as selected
END FOR
```

### Property Specification — Preservation Checking

```pascal
// Property: Preservation Checking - All Other Behavior Unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR

// Specifically:
// - Submitting Add/Edit with valid inputs produces the same QuickAddTemplate
//   shape as before (id, name, amount, category, platform, icon).
// - Validation guard still rejects missing name/amount/category.
// - Template list rendering, Cancel, Delete, and Supabase persistence
//   produce identical results before and after the fix.
// - All other settings sections and other tracker modules render and
//   behave identically to F.
```

### Counterexample (Concrete Bug Demonstration)

1. Open the app, go to Expenses → Settings.
2. Expand "Quick Add Templates".
3. Click the pencil (Edit) icon on any template (e.g. "Tea ☕").
4. Observe the "Edit Template" panel: the icon control is a plain text input pre-filled with the current emoji. No list/grid of selectable emojis is shown.
5. There is no in-app way to browse emojis for categories such as "Internet Bill", "Rent / Home Loan", "Health / Medical", "Education", "Entertainment", or "Savings / Investments".

Expected: a visible emoji picker grouped by every category in `DEFAULT_CATEGORIES`, with the current template emoji pre-selected.
