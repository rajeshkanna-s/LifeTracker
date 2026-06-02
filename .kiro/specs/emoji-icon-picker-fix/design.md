# Emoji Icon Picker Fix — Bugfix Design

## Overview

The "Emoji Icon" field in Expense → Settings → Quick Add Templates is currently a plain `<input type="text">` that forces users to manually type or paste emoji characters. This fix replaces that input with a visible, browsable emoji picker component rendered inline within the template form. The picker displays emojis grouped by all 23 expense categories defined in `DEFAULT_CATEGORIES`, with at least 3 representative emojis per group. Clicking an emoji selects it, the selection is visually highlighted, and in edit mode the template's existing icon is pre-selected.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the emoji icon field renders as a free-text input with no picker or selectable emoji list
- **Property (P)**: The desired behavior — a visible emoji picker grouped by category is rendered, click-to-select works, and the selection is visually indicated
- **Preservation**: All existing template CRUD behavior, form validation, persistence, and other settings sections remain functionally unchanged
- **`ExpenseSettingsTab`**: The React component in `src/components/expenses/ExpenseSettings.tsx` that renders the settings UI including the Quick Add Templates form
- **`newQuickAdd.icon`**: The state field holding the currently chosen emoji for the template being added or edited
- **`DEFAULT_CATEGORIES`**: The 23 expense categories defined in `src/data/constants.ts`
- **`CATEGORY_EMOJIS`**: A new constant mapping each category to an array of representative emojis (to be created in `src/data/constants.ts`)

## Bug Details

### Bug Condition

The bug manifests when the user opens the "Add New Template" or "Edit Template" form in the Quick Add Templates section of Expense Settings. The icon field is rendered as a plain text `<input>` element with placeholder "Emoji Icon (e.g. ☕)". There is no picker, no list of emojis to browse, and no way to discover appropriate emojis for any category.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type FormRenderContext
         input.formMode ∈ {"AddNewTemplate", "EditTemplate"}
         input.iconControl: the rendered DOM element for emoji selection
  OUTPUT: boolean

  RETURN input.formMode ∈ {"AddNewTemplate", "EditTemplate"}
         AND input.iconControl.type = "text-input"
         AND NOT hasVisibleEmojiPicker(input.iconControl)
END FUNCTION

FUNCTION hasVisibleEmojiPicker(control)
  RETURN control renders a visible grid/list of clickable emojis
         AND emojis are grouped by expense category
         AND every category in DEFAULT_CATEGORIES has a group
         AND each group contains >= 3 emojis
         AND clicking an emoji sets newQuickAdd.icon to that emoji
END FUNCTION
```

### Examples

- **Add mode, no picker**: User clicks "Add New Template", sees a text input for icon with placeholder "Emoji Icon (e.g. ☕)". No emojis are shown to browse. Expected: a scrollable picker with 23 category groups.
- **Edit mode, no pre-selection**: User clicks pencil on "Tea ☕" template. The text input shows "☕" as text. No picker is visible. Expected: picker is shown with "☕" visually highlighted under the "Office" category group.
- **Obscure category, no discovery**: User wants an emoji for "Savings / Investments". The text input gives no guidance. Expected: picker shows a "Savings / Investments" group with emojis like 💰, 📈, 🏦.
- **Mobile usability**: On a small screen, the text input works fine but a full emoji picker could overflow. Expected: picker is contained within a scrollable bounded-height container.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Form validation: submissions with missing name, amount, or category are still rejected
- Template add flow: valid submissions append a new `QuickAddTemplate` with generated id, numeric amount, and chosen icon
- Template edit flow: "Update Template" modifies only the matching template by id
- Cancel button: clears editing state and resets form without modifying templates
- Delete button: removes the template and resets form if it was being edited
- Template list rendering: existing templates display their `icon` in the 10×10 rounded box
- Supabase persistence: `expense_settings.settings_json` read/write is unaffected
- `DEFAULT_QUICK_ADD` seeded templates display their original emojis (☕, 🍽️, 🛺, ⛽, 🛒, 🍪)
- All other settings sections (Currency, Family, Payment Methods, Categories, Platforms, Category Budgets, Savings Goals) behave identically
- `ExpenseForm.tsx` and all other tracker modules are unaffected

**Scope:**
All inputs that do NOT involve the emoji icon selection control in the Quick Add Template form should be completely unaffected by this fix. This includes:
- Mouse clicks on Add/Update/Cancel/Delete buttons (logic unchanged, only icon value source changes)
- Keyboard interactions with name, amount, category, platform fields
- Any interaction outside the Quick Add Templates section
- Any interaction in other tracker modules

## Hypothesized Root Cause

Based on the bug description, the root cause is straightforward:

1. **Missing UI Component**: The original implementation used a plain `<input>` element for the icon field rather than building an emoji picker component. This was likely a placeholder during initial development that was never replaced with a proper picker.

2. **No Emoji Data Source**: There is no mapping of categories to representative emojis anywhere in the codebase (`src/data/constants.ts` has categories but no emoji associations). Without this data, a picker cannot be rendered.

3. **No Selection State Visualization**: Since the field is a text input, there is no mechanism to visually highlight a "selected" emoji within a grid — the concept of selection-from-a-list doesn't exist in the current implementation.

4. **No Scrollable Container**: The form layout doesn't account for a picker that could contain 69+ emojis (23 categories × 3 minimum), so no bounded scrollable area exists.

## Correctness Properties

Property 1: Bug Condition - Emoji Picker Renders With Full Category Coverage

_For any_ form render context where the Quick Add Template form is open (add or edit mode), the fixed component SHALL render a visible emoji picker displaying clickable emojis grouped by every category in `DEFAULT_CATEGORIES` (23 categories), with at least 3 emojis per group, and clicking any emoji SHALL set `newQuickAdd.icon` to that emoji's character.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Template CRUD and Other Settings Unchanged

_For any_ interaction that does NOT involve selecting an emoji from the picker (form validation, add/update/cancel/delete flows, other settings sections, other modules), the fixed component SHALL produce exactly the same behavior as the original component, preserving all template management logic, persistence, and rendering.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/data/constants.ts`

**Change**: Add `CATEGORY_EMOJIS` constant

**Specific Changes**:
1. **Add emoji mapping**: Create a `CATEGORY_EMOJIS` constant of type `Record<string, string[]>` that maps each of the 23 `DEFAULT_CATEGORIES` entries to an array of at least 3 representative emojis. Example:
   - `'Food'`: `['🍕', '🍔', '🍜', '🍛', '🌮', '🍱']`
   - `'Grocery'`: `['🛒', '🧺', '🥫', '🧴', '🫙']`
   - `'Vegetables'`: `['🥬', '🥕', '🍅', '🥦', '🌽', '🧅']`
   - `'Petrol / Fuel'`: `['⛽', '🛢️', '🚗', '🏍️']`
   - `'Travel / Transport'`: `['🚌', '🚇', '🛺', '✈️', '🚕', '🚂']`
   - `'Mobile Recharge'`: `['📱', '📶', '💳', '🔋']`
   - `'Internet Bill'`: `['🌐', '📡', '💻', '🖥️']`
   - `'Electricity Bill'`: `['💡', '⚡', '🔌', '🏠']`
   - `'Rent / Home Loan'`: `['🏠', '🏡', '🔑', '🏢']`
   - `'EMIs / Loans'`: `['🏦', '💸', '📋', '🤝']`
   - `'Education'`: `['📚', '🎓', '✏️', '🏫', '📖']`
   - `'Health / Medical'`: `['🏥', '💊', '🩺', '🩹', '🧬']`
   - `'Entertainment'`: `['🎮', '🎬', '🎵', '🎭', '🎪']`
   - `'Cinema / Movies'`: `['🎬', '🍿', '🎥', '📽️']`
   - `'Dress / Clothing'`: `['👕', '👗', '👟', '🧥', '👔']`
   - `'Shopping'`: `['🛍️', '🏪', '🛒', '💳', '📦']`
   - `'Office'`: `['☕', '💼', '🖊️', '📎', '🖨️']`
   - `'Kids / Family'`: `['👶', '🧸', '🎒', '🍼', '👨‍👩‍👧']`
   - `'Gifts / Donations'`: `['🎁', '💝', '🤲', '🎀', '💐']`
   - `'Home Maintenance'`: `['🔧', '🪛', '🧹', '🪣', '🔨']`
   - `'Savings / Investments'`: `['💰', '📈', '🏦', '🪙', '💎']`
   - `'Social / Events'`: `['🎉', '🥂', '🎊', '👥', '🍾']`
   - `'Miscellaneous'`: `['📌', '🔖', '📝', '🗂️', '🏷️']`

---

**File**: `src/components/expenses/ExpenseSettings.tsx`

**Function**: `ExpenseSettingsTab` component, within the Quick Add Templates section

**Specific Changes**:

2. **Import `CATEGORY_EMOJIS`**: Add the new constant to the import from `../../data/constants`.

3. **Replace the text input with an inline emoji picker**: Remove the `<input placeholder="Emoji Icon (e.g. ☕)" ...>` element. Replace it with a new inline `EmojiPicker` component (or inline JSX) that:
   - Renders a scrollable container (max-height ~200px, overflow-y auto) spanning the full width of the form grid area
   - Iterates over `DEFAULT_CATEGORIES` and for each category renders:
     - A small category label (text-xs, muted color)
     - A flex-wrap row of emoji buttons
   - Each emoji button is a `<button>` with the emoji character, `onClick` sets `newQuickAdd.icon` to that emoji
   - The currently selected emoji (`newQuickAdd.icon`) gets a visual highlight (e.g., `ring-2 ring-violet-400 bg-violet-50 scale-110`)

4. **Show current selection preview**: Above or beside the picker, display the currently selected emoji in a larger preview (the existing 10×10 box style) so the user can confirm their choice at a glance.

5. **Pre-selection in edit mode**: When `editingTemplateId` is set and `setNewQuickAdd` populates the form with the template's existing icon, the picker automatically highlights that emoji because the highlight logic checks `newQuickAdd.icon === emoji`.

6. **Layout adjustment**: Move the emoji picker to span the full width below the 2-column grid of name/amount/category/platform inputs, or place it in its own row within the form. Ensure it doesn't break the responsive grid on small screens.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Render the `ExpenseSettingsTab` component in a test environment, open the Quick Add Templates section, and assert that the emoji icon control is a picker (not a text input). Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Add Mode — No Picker Present**: Render component, expand Quick Add section, query for an emoji grid/picker element → will fail on unfixed code (only finds `<input>`)
2. **Edit Mode — No Picker Present**: Render component, click edit on a template, query for emoji grid → will fail on unfixed code
3. **Category Coverage Missing**: Assert that the rendered picker contains groups for all 23 categories → will fail on unfixed code (no picker exists)
4. **Click-to-Select Missing**: Simulate clicking an emoji element and assert `newQuickAdd.icon` updates → will fail on unfixed code (no clickable emoji elements)

**Expected Counterexamples**:
- No element matching `[role="group"]` or emoji grid container is found in the DOM
- The icon field is an `<input type="text">` with no associated picker
- Possible causes: the picker component simply doesn't exist yet

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL formMode IN {"AddNewTemplate", "EditTemplate"} DO
  rendered := renderFixed(ExpenseSettingsTab, { formMode })
  picker := rendered.querySelector(".emoji-picker")
  ASSERT picker IS NOT NULL
  ASSERT picker.categoryGroups.length = 23
  FOR EACH group IN picker.categoryGroups DO
    ASSERT group.emojis.length >= 3
  END FOR
  FOR EACH emoji IN picker.allEmojis DO
    simulate.click(emoji)
    ASSERT newQuickAdd.icon = emoji.textContent
    ASSERT emoji.classList.contains("selected-highlight")
  END FOR
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) = fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many template configurations automatically (random names, amounts, categories)
- It catches edge cases in form validation that manual tests might miss
- It provides strong guarantees that add/edit/delete/cancel flows are unchanged

**Test Plan**: Observe behavior on UNFIXED code first for template CRUD operations, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Form Validation Preservation**: Generate random form states with missing fields, verify submission is still rejected
2. **Add Template Preservation**: Generate valid template data, verify the resulting `QuickAddTemplate` object shape is identical
3. **Edit Template Preservation**: Generate edit scenarios, verify only the target template is modified
4. **Delete Template Preservation**: Verify deletion removes exactly one template and resets form if needed
5. **Other Sections Preservation**: Verify Currency, Family, Payment Methods, Categories, Platforms, Budgets, and Goals sections render and behave identically

### Unit Tests

- Test that `CATEGORY_EMOJIS` has an entry for every category in `DEFAULT_CATEGORIES`
- Test that each entry in `CATEGORY_EMOJIS` has at least 3 emojis
- Test that clicking an emoji in the picker updates `newQuickAdd.icon`
- Test that the selected emoji receives the highlight CSS class
- Test that edit mode pre-selects the template's existing icon
- Test that form submission still uses `newQuickAdd.icon` as the template's `icon` field

### Property-Based Tests

- Generate random category selections and verify the picker always shows emojis for that category
- Generate random emoji selections and verify the state always updates correctly
- Generate random template CRUD sequences and verify the fix doesn't alter outcomes vs. original behavior
- Generate random screen widths and verify the picker container stays within bounds (no overflow)

### Integration Tests

- Test full add-template flow: open form → select emoji from picker → fill other fields → submit → verify template appears in list with chosen emoji
- Test full edit-template flow: click edit → verify pre-selection → change emoji → submit → verify template updated
- Test that switching between add and edit mode correctly resets/pre-selects the picker
- Test that the picker scrolls correctly when many categories are visible
