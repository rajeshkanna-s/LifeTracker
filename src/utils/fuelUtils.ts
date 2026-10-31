import type { Expense } from '../types';

export interface FuelDetails {
  odometer: number | null;
  prevOdometer: number | null;
  distance: number | null;
  liters: number | null;
  mileage: number | null;
  costPerKm: number | null;
  cleanNotes: string;
}

export interface FuelMetrics {
  distance: number;
  mileage: number | null;
  costPerKm: number | null;
}

export const DEFAULT_FUEL_PRICE_PER_LITER = 102.5;

/**
 * Checks if a category or text is related to Fuel / Petrol / Diesel
 */
export function isFuelCategory(category?: string | null): boolean {
  if (!category) return false;
  return /petrol|fuel|diesel/i.test(category);
}

/**
 * Robustly parses fuel information out of expense notes, tags, and description
 */
export function parseFuelDetails(expense?: Partial<Expense> | null): FuelDetails {
  if (!expense) {
    return {
      odometer: null,
      prevOdometer: null,
      distance: null,
      liters: null,
      mileage: null,
      costPerKm: null,
      cleanNotes: '',
    };
  }

  const rawNotes = expense.notes || '';
  const rawTags = expense.tags || '';
  const rawDesc = expense.description || '';
  const fullText = `${rawNotes} ${rawTags} ${rawDesc}`;

  // Current Odometer: "Odometer: 27003.39 km" or "Odo: 27003" or "KM: 27003"
  let odometer: number | null = null;
  const odoMatch = fullText.match(/(?:odometer|odo)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (odoMatch) {
    odometer = parseFloat(odoMatch[1]);
  } else {
    // Fallback: match 4-6 digit number followed by km e.g. "27003.4 km"
    const kmMatch = fullText.match(/\b([0-9]{4,6}(?:\.[0-9]+)?)\s*km\b/i);
    if (kmMatch) odometer = parseFloat(kmMatch[1]);
  }

  // Previous Odometer: "Prev: 26811.45 km" or "Previous: 26811" or "Last KM: 26811"
  let prevOdometer: number | null = null;
  const prevMatch = fullText.match(/(?:prev(?:ious)?|last\s*km)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (prevMatch) {
    prevOdometer = parseFloat(prevMatch[1]);
  }

  // Distance: "Distance: 191.9 km" or "Diff: 191.9"
  let distance: number | null = null;
  const distMatch = fullText.match(/(?:distance|diff|dist)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (distMatch) {
    distance = parseFloat(distMatch[1]);
  } else if (odometer !== null && prevOdometer !== null && odometer > prevOdometer) {
    distance = Number((odometer - prevOdometer).toFixed(2));
  }

  // Fuel Liters: "Fuel: 4.3 L" or "Liters: 4.3" or "4.3 Litres"
  let liters: number | null = null;
  const litersMatch = fullText.match(/(?:fuel|liters?|ltrs?|vol(?:ume)?)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (litersMatch) {
    liters = parseFloat(litersMatch[1]);
  } else if (expense.amount && expense.amount > 0 && isFuelCategory(expense.category)) {
    // Calculated estimate if not explicitly present
    liters = Number((expense.amount / DEFAULT_FUEL_PRICE_PER_LITER).toFixed(2));
  }

  // Mileage: "Mileage: 44.6 km/l" or "44.6 kmpl" or "44.6 km/L"
  let mileage: number | null = null;
  const mileageMatch = fullText.match(/(?:mileage|average|avg)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (mileageMatch) {
    mileage = parseFloat(mileageMatch[1]);
  } else {
    const kmplMatch = fullText.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:km\/l|kmpl|km\/ltr)/i);
    if (kmplMatch) {
      mileage = parseFloat(kmplMatch[1]);
    } else if (distance !== null && liters !== null && liters > 0) {
      mileage = Number((distance / liters).toFixed(2));
    }
  }

  // Cost per KM
  let costPerKm: number | null = null;
  if (expense.amount && distance && distance > 0) {
    costPerKm = Number((expense.amount / distance).toFixed(2));
  }

  // Extract clean custom notes (strip out our auto-generated Odometer: ... string)
  let cleanNotes = rawNotes
    .replace(/Odometer:\s*[0-9]+(?:\.[0-9]+)?\s*km(?:\s*\(Prev:\s*[0-9]+(?:\.[0-9]+)?\s*km\))?(?:\s*\|\s*Distance:\s*[0-9]+(?:\.[0-9]+)?\s*km)?(?:\s*\|\s*(?:Fuel|Liters?):\s*[0-9]+(?:\.[0-9]+)?\s*L)?(?:\s*\|\s*Mileage:\s*[0-9]+(?:\.[0-9]+)?\s*km\/l)?/gi, '')
    .trim();

  return {
    odometer,
    prevOdometer,
    distance,
    liters,
    mileage,
    costPerKm,
    cleanNotes,
  };
}

/**
 * Searches past expenses to find the most recent valid odometer reading.
 */
export function getLastOdometerReading(expenses: Expense[], excludeExpenseId?: string): number | null {
  if (!expenses || expenses.length === 0) return null;

  // Filter fuel expenses, sorted chronologically (newest first)
  const fuelExpenses = expenses
    .filter(e => isFuelCategory(e.category) && (!excludeExpenseId || e.id !== excludeExpenseId))
    .sort((a, b) => {
      const cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (cmp !== 0) return cmp;
      return (b.time || '').localeCompare(a.time || '');
    });

  for (const exp of fuelExpenses) {
    const parsed = parseFuelDetails(exp);
    if (parsed.odometer !== null && parsed.odometer > 0) {
      return parsed.odometer;
    }
  }

  // Fallback: check all expenses in case odometer was saved in a different category
  for (const exp of expenses) {
    if (excludeExpenseId && exp.id === excludeExpenseId) continue;
    const parsed = parseFuelDetails(exp);
    if (parsed.odometer !== null && parsed.odometer > 0) {
      return parsed.odometer;
    }
  }

  return null;
}

/**
 * Calculates distance, mileage, and cost per KM from given metrics
 */
export function calculateFuelMetrics(
  prevKm: number | null,
  currentKm: number | null,
  liters: number | null,
  amount?: number
): FuelMetrics {
  const pKm = Number(prevKm) || 0;
  const cKm = Number(currentKm) || 0;
  const l = Number(liters) || 0;
  const amt = Number(amount) || 0;

  const distance = cKm > pKm ? Number((cKm - pKm).toFixed(2)) : 0;
  const mileage = (distance > 0 && l > 0) ? Number((distance / l).toFixed(2)) : null;
  const costPerKm = (distance > 0 && amt > 0) ? Number((amt / distance).toFixed(2)) : null;

  return {
    distance,
    mileage,
    costPerKm,
  };
}

/**
 * Formats a clean, structured notes string for fuel expenses
 */
export function formatFuelNotes(params: {
  currentKm: number;
  prevKm?: number | null;
  distance?: number | null;
  liters?: number | null;
  mileage?: number | null;
  customNotes?: string;
}): string {
  const parts: string[] = [];

  let odoStr = `Odometer: ${params.currentKm} km`;
  if (params.prevKm && params.prevKm > 0) {
    odoStr += ` (Prev: ${params.prevKm} km)`;
  }
  parts.push(odoStr);

  if (params.distance && params.distance > 0) {
    parts.push(`Distance: ${params.distance} km`);
  }

  if (params.liters && params.liters > 0) {
    parts.push(`Fuel: ${params.liters} L`);
  }

  if (params.mileage && params.mileage > 0) {
    parts.push(`Mileage: ${params.mileage} km/l`);
  }

  const structured = parts.join(' | ');
  if (params.customNotes && params.customNotes.trim()) {
    return `${structured}\n${params.customNotes.trim()}`;
  }
  return structured;
}

/**
 * Quick extraction of fuel badge data for badges in list items
 */
export function getFuelBadge(expense?: Partial<Expense> | null): {
  mileage: number | null;
  distance: number | null;
  odometer: number | null;
} | null {
  if (!expense) return null;
  if (!isFuelCategory(expense.category) && !expense.notes?.includes('Odometer') && !expense.tags?.includes('Mileage')) {
    return null;
  }
  const parsed = parseFuelDetails(expense);
  if (!parsed.mileage && !parsed.odometer && !parsed.distance) {
    return null;
  }
  return {
    mileage: parsed.mileage,
    distance: parsed.distance,
    odometer: parsed.odometer,
  };
}

