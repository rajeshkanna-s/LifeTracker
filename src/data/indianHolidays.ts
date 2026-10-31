export interface IndianHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'National Holiday' | 'Gazetted Holiday' | 'Festive Holiday';
  description: string;
}

// Curated Gazetted & National Indian Government Holidays for years 2023-2030
const CURATED_HOLIDAYS: Record<number, { month: number; day: number; name: string; type: IndianHoliday['type']; description: string }[]> = {
  2023: [
    { month: 1, day: 14, name: 'Makar Sankranti / Pongal', type: 'Festive Holiday', description: 'Harvest festival celebrated across India' },
    { month: 1, day: 26, name: 'Republic Day', type: 'National Holiday', description: 'Constitution of India came into effect' },
    { month: 2, day: 18, name: 'Maha Shivratri', type: 'Gazetted Holiday', description: 'Great night of Lord Shiva' },
    { month: 3, day: 8, name: 'Holi', type: 'Gazetted Holiday', description: 'Festival of colors' },
    { month: 4, day: 4, name: 'Mahavir Jayanti', type: 'Gazetted Holiday', description: 'Birth of Lord Mahavira' },
    { month: 4, day: 7, name: 'Good Friday', type: 'Gazetted Holiday', description: 'Christian remembrance of the crucifixion' },
    { month: 4, day: 14, name: 'Dr. Ambedkar Jayanti / Tamil New Year', type: 'Gazetted Holiday', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
    { month: 4, day: 22, name: 'Eid-ul-Fitr', type: 'Gazetted Holiday', description: 'Islamic festival marking the end of Ramadan' },
    { month: 5, day: 1, name: 'Labour Day / May Day', type: 'Gazetted Holiday', description: 'International Workers\' Day' },
    { month: 5, day: 5, name: 'Buddha Purnima', type: 'Gazetted Holiday', description: 'Birth of Lord Buddha' },
    { month: 6, day: 29, name: 'Bakrid / Eid al-Adha', type: 'Gazetted Holiday', description: 'Feast of the Sacrifice' },
    { month: 7, day: 29, name: 'Muharram', type: 'Gazetted Holiday', description: 'First month of Islamic calendar' },
    { month: 8, day: 15, name: 'Independence Day', type: 'National Holiday', description: 'Indian Independence from British Rule (1947)' },
    { month: 9, day: 7, name: 'Janmashtami', type: 'Gazetted Holiday', description: 'Birth of Lord Krishna' },
    { month: 9, day: 28, name: 'Milad-un-Nabi', type: 'Gazetted Holiday', description: 'Prophet Muhammad\'s Birthday' },
    { month: 10, day: 2, name: 'Mahatma Gandhi Jayanti', type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi' },
    { month: 10, day: 24, name: 'Dussehra / Vijaya Dashami', type: 'Gazetted Holiday', description: 'Victory of good over evil' },
    { month: 11, day: 12, name: 'Diwali (Deepavali)', type: 'Gazetted Holiday', description: 'Festival of Lights' },
    { month: 11, day: 27, name: 'Guru Nanak Jayanti', type: 'Gazetted Holiday', description: 'Birth of Guru Nanak Dev Ji' },
    { month: 12, day: 25, name: 'Christmas Day', type: 'Gazetted Holiday', description: 'Celebration of the birth of Jesus Christ' }
  ],
  2024: [
    { month: 1, day: 15, name: 'Makar Sankranti / Pongal', type: 'Festive Holiday', description: 'Harvest festival celebrated across India' },
    { month: 1, day: 26, name: 'Republic Day', type: 'National Holiday', description: 'Constitution of India came into effect' },
    { month: 3, day: 8, name: 'Maha Shivratri', type: 'Gazetted Holiday', description: 'Great night of Lord Shiva' },
    { month: 3, day: 25, name: 'Holi', type: 'Gazetted Holiday', description: 'Festival of colors' },
    { month: 3, day: 29, name: 'Good Friday', type: 'Gazetted Holiday', description: 'Christian remembrance of the crucifixion' },
    { month: 4, day: 11, name: 'Eid-ul-Fitr', type: 'Gazetted Holiday', description: 'Islamic festival marking the end of Ramadan' },
    { month: 4, day: 14, name: 'Dr. Ambedkar Jayanti / Tamil New Year', type: 'Gazetted Holiday', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
    { month: 4, day: 21, name: 'Mahavir Jayanti', type: 'Gazetted Holiday', description: 'Birth of Lord Mahavira' },
    { month: 5, day: 1, name: 'Labour Day / May Day', type: 'Gazetted Holiday', description: 'International Workers\' Day' },
    { month: 5, day: 23, name: 'Buddha Purnima', type: 'Gazetted Holiday', description: 'Birth of Lord Buddha' },
    { month: 6, day: 17, name: 'Bakrid / Eid al-Adha', type: 'Gazetted Holiday', description: 'Feast of the Sacrifice' },
    { month: 7, day: 17, name: 'Muharram', type: 'Gazetted Holiday', description: 'First month of Islamic calendar' },
    { month: 8, day: 15, name: 'Independence Day', type: 'National Holiday', description: 'Indian Independence from British Rule (1947)' },
    { month: 8, day: 26, name: 'Janmashtami', type: 'Gazetted Holiday', description: 'Birth of Lord Krishna' },
    { month: 9, day: 16, name: 'Milad-un-Nabi', type: 'Gazetted Holiday', description: 'Prophet Muhammad\'s Birthday' },
    { month: 10, day: 2, name: 'Mahatma Gandhi Jayanti', type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi' },
    { month: 10, day: 12, name: 'Dussehra / Vijaya Dashami', type: 'Gazetted Holiday', description: 'Victory of good over evil' },
    { month: 10, day: 31, name: 'Diwali (Deepavali)', type: 'Gazetted Holiday', description: 'Festival of Lights' },
    { month: 11, day: 15, name: 'Guru Nanak Jayanti', type: 'Gazetted Holiday', description: 'Birth of Guru Nanak Dev Ji' },
    { month: 12, day: 25, name: 'Christmas Day', type: 'Gazetted Holiday', description: 'Celebration of the birth of Jesus Christ' }
  ],
  2025: [
    { month: 1, day: 14, name: 'Makar Sankranti / Pongal', type: 'Festive Holiday', description: 'Harvest festival celebrated across India' },
    { month: 1, day: 26, name: 'Republic Day', type: 'National Holiday', description: 'Constitution of India came into effect' },
    { month: 2, day: 26, name: 'Maha Shivratri', type: 'Gazetted Holiday', description: 'Great night of Lord Shiva' },
    { month: 3, day: 14, name: 'Holi', type: 'Gazetted Holiday', description: 'Festival of colors' },
    { month: 3, day: 31, name: 'Eid-ul-Fitr', type: 'Gazetted Holiday', description: 'Islamic festival marking the end of Ramadan' },
    { month: 4, day: 10, name: 'Mahavir Jayanti', type: 'Gazetted Holiday', description: 'Birth of Lord Mahavira' },
    { month: 4, day: 14, name: 'Dr. Ambedkar Jayanti / Tamil New Year', type: 'Gazetted Holiday', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
    { month: 4, day: 18, name: 'Good Friday', type: 'Gazetted Holiday', description: 'Christian remembrance of the crucifixion' },
    { month: 5, day: 1, name: 'Labour Day / May Day', type: 'Gazetted Holiday', description: 'International Workers\' Day' },
    { month: 5, day: 12, name: 'Buddha Purnima', type: 'Gazetted Holiday', description: 'Birth of Lord Buddha' },
    { month: 6, day: 7, name: 'Bakrid / Eid al-Adha', type: 'Gazetted Holiday', description: 'Feast of the Sacrifice' },
    { month: 7, day: 6, name: 'Muharram', type: 'Gazetted Holiday', description: 'First month of Islamic calendar' },
    { month: 8, day: 15, name: 'Independence Day', type: 'National Holiday', description: 'Indian Independence from British Rule (1947)' },
    { month: 8, day: 16, name: 'Janmashtami', type: 'Gazetted Holiday', description: 'Birth of Lord Krishna' },
    { month: 9, day: 5, name: 'Milad-un-Nabi', type: 'Gazetted Holiday', description: 'Prophet Muhammad\'s Birthday' },
    { month: 10, day: 2, name: 'Mahatma Gandhi Jayanti / Dussehra', type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi and Vijaya Dashami' },
    { month: 10, day: 20, name: 'Diwali (Deepavali)', type: 'Gazetted Holiday', description: 'Festival of Lights' },
    { month: 11, day: 5, name: 'Guru Nanak Jayanti', type: 'Gazetted Holiday', description: 'Birth of Guru Nanak Dev Ji' },
    { month: 12, day: 25, name: 'Christmas Day', type: 'Gazetted Holiday', description: 'Celebration of the birth of Jesus Christ' }
  ],
  2026: [
    { month: 1, day: 14, name: 'Makar Sankranti / Pongal', type: 'Festive Holiday', description: 'Harvest festival celebrated across India' },
    { month: 1, day: 26, name: 'Republic Day', type: 'National Holiday', description: 'Constitution of India came into effect' },
    { month: 2, day: 15, name: 'Maha Shivratri', type: 'Gazetted Holiday', description: 'Great night of Lord Shiva' },
    { month: 3, day: 3, name: 'Holi', type: 'Gazetted Holiday', description: 'Festival of colors' },
    { month: 3, day: 20, name: 'Eid-ul-Fitr', type: 'Gazetted Holiday', description: 'Islamic festival marking the end of Ramadan' },
    { month: 3, day: 31, name: 'Mahavir Jayanti', type: 'Gazetted Holiday', description: 'Birth of Lord Mahavira' },
    { month: 4, day: 3, name: 'Good Friday', type: 'Gazetted Holiday', description: 'Christian remembrance of the crucifixion' },
    { month: 4, day: 14, name: 'Dr. Ambedkar Jayanti / Tamil New Year', type: 'Gazetted Holiday', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
    { month: 5, day: 1, name: 'Labour Day / Buddha Purnima', type: 'Gazetted Holiday', description: 'International Workers\' Day & Buddha Purnima' },
    { month: 5, day: 27, name: 'Bakrid / Eid al-Adha', type: 'Gazetted Holiday', description: 'Feast of the Sacrifice' },
    { month: 6, day: 26, name: 'Muharram', type: 'Gazetted Holiday', description: 'First month of Islamic calendar' },
    { month: 8, day: 15, name: 'Independence Day', type: 'National Holiday', description: 'Indian Independence from British Rule (1947)' },
    { month: 8, day: 26, name: 'Milad-un-Nabi', type: 'Gazetted Holiday', description: 'Prophet Muhammad\'s Birthday' },
    { month: 9, day: 4, name: 'Janmashtami', type: 'Gazetted Holiday', description: 'Birth of Lord Krishna' },
    { month: 10, day: 2, name: 'Mahatma Gandhi Jayanti', type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi' },
    { month: 10, day: 20, name: 'Dussehra / Vijaya Dashami', type: 'Gazetted Holiday', description: 'Victory of good over evil' },
    { month: 11, day: 8, name: 'Diwali (Deepavali)', type: 'Gazetted Holiday', description: 'Festival of Lights' },
    { month: 11, day: 24, name: 'Guru Nanak Jayanti', type: 'Gazetted Holiday', description: 'Birth of Guru Nanak Dev Ji' },
    { month: 12, day: 25, name: 'Christmas Day', type: 'Gazetted Holiday', description: 'Celebration of the birth of Jesus Christ' }
  ],
  2027: [
    { month: 1, day: 14, name: 'Makar Sankranti / Pongal', type: 'Festive Holiday', description: 'Harvest festival celebrated across India' },
    { month: 1, day: 26, name: 'Republic Day', type: 'National Holiday', description: 'Constitution of India came into effect' },
    { month: 3, day: 6, name: 'Maha Shivratri', type: 'Gazetted Holiday', description: 'Great night of Lord Shiva' },
    { month: 3, day: 10, name: 'Eid-ul-Fitr', type: 'Gazetted Holiday', description: 'Islamic festival marking the end of Ramadan' },
    { month: 3, day: 22, name: 'Holi', type: 'Gazetted Holiday', description: 'Festival of colors' },
    { month: 3, day: 26, name: 'Good Friday', type: 'Gazetted Holiday', description: 'Christian remembrance of the crucifixion' },
    { month: 4, day: 14, name: 'Dr. Ambedkar Jayanti / Tamil New Year', type: 'Gazetted Holiday', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
    { month: 4, day: 19, name: 'Mahavir Jayanti', type: 'Gazetted Holiday', description: 'Birth of Lord Mahavira' },
    { month: 5, day: 1, name: 'Labour Day / May Day', type: 'Gazetted Holiday', description: 'International Workers\' Day' },
    { month: 5, day: 17, name: 'Bakrid / Eid al-Adha', type: 'Gazetted Holiday', description: 'Feast of the Sacrifice' },
    { month: 5, day: 20, name: 'Buddha Purnima', type: 'Gazetted Holiday', description: 'Birth of Lord Buddha' },
    { month: 6, day: 16, name: 'Muharram', type: 'Gazetted Holiday', description: 'First month of Islamic calendar' },
    { month: 8, day: 15, name: 'Independence Day', type: 'National Holiday', description: 'Indian Independence from British Rule (1947)' },
    { month: 8, day: 25, name: 'Janmashtami', type: 'Gazetted Holiday', description: 'Birth of Lord Krishna' },
    { month: 9, day: 15, name: 'Milad-un-Nabi', type: 'Gazetted Holiday', description: 'Prophet Muhammad\'s Birthday' },
    { month: 10, day: 2, name: 'Mahatma Gandhi Jayanti', type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi' },
    { month: 10, day: 9, name: 'Dussehra / Vijaya Dashami', type: 'Gazetted Holiday', description: 'Victory of good over evil' },
    { month: 10, day: 29, name: 'Diwali (Deepavali)', type: 'Gazetted Holiday', description: 'Festival of Lights' },
    { month: 11, day: 14, name: 'Guru Nanak Jayanti', type: 'Gazetted Holiday', description: 'Birth of Guru Nanak Dev Ji' },
    { month: 12, day: 25, name: 'Christmas Day', type: 'Gazetted Holiday', description: 'Celebration of the birth of Jesus Christ' }
  ],
  2028: [
    { month: 1, day: 14, name: 'Makar Sankranti / Pongal', type: 'Festive Holiday', description: 'Harvest festival celebrated across India' },
    { month: 1, day: 26, name: 'Republic Day', type: 'National Holiday', description: 'Constitution of India came into effect' },
    { month: 2, day: 24, name: 'Maha Shivratri', type: 'Gazetted Holiday', description: 'Great night of Lord Shiva' },
    { month: 2, day: 27, name: 'Eid-ul-Fitr', type: 'Gazetted Holiday', description: 'Islamic festival marking the end of Ramadan' },
    { month: 3, day: 11, name: 'Holi', type: 'Gazetted Holiday', description: 'Festival of colors' },
    { month: 4, day: 7, name: 'Mahavir Jayanti', type: 'Gazetted Holiday', description: 'Birth of Lord Mahavira' },
    { month: 4, day: 14, name: 'Good Friday & Ambedkar Jayanti', type: 'Gazetted Holiday', description: 'Crucifixion remembrance & Dr. Ambedkar Jayanti' },
    { month: 5, day: 1, name: 'Labour Day / May Day', type: 'Gazetted Holiday', description: 'International Workers\' Day' },
    { month: 5, day: 6, name: 'Bakrid / Eid al-Adha', type: 'Gazetted Holiday', description: 'Feast of the Sacrifice' },
    { month: 5, day: 9, name: 'Buddha Purnima', type: 'Gazetted Holiday', description: 'Birth of Lord Buddha' },
    { month: 6, day: 4, name: 'Muharram', type: 'Gazetted Holiday', description: 'First month of Islamic calendar' },
    { month: 8, day: 13, name: 'Janmashtami', type: 'Gazetted Holiday', description: 'Birth of Lord Krishna' },
    { month: 8, day: 15, name: 'Independence Day', type: 'National Holiday', description: 'Indian Independence from British Rule (1947)' },
    { month: 9, day: 3, name: 'Milad-un-Nabi', type: 'Gazetted Holiday', description: 'Prophet Muhammad\'s Birthday' },
    { month: 10, day: 2, name: 'Mahatma Gandhi Jayanti', type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi' },
    { month: 10, day: 17, name: 'Diwali (Deepavali)', type: 'Gazetted Holiday', description: 'Festival of Lights' },
    { month: 10, day: 28, name: 'Dussehra / Vijaya Dashami', type: 'Gazetted Holiday', description: 'Victory of good over evil' },
    { month: 11, day: 2, name: 'Guru Nanak Jayanti', type: 'Gazetted Holiday', description: 'Birth of Guru Nanak Dev Ji' },
    { month: 12, day: 25, name: 'Christmas Day', type: 'Gazetted Holiday', description: 'Celebration of the birth of Jesus Christ' }
  ]
};

// Fixed-date Indian national and gazetted holidays for any other year
const FIXED_ANNUAL_HOLIDAYS = [
  { month: 1, day: 14, name: 'Makar Sankranti / Pongal', type: 'Festive Holiday' as const, description: 'Harvest festival celebrated across India' },
  { month: 1, day: 26, name: 'Republic Day', type: 'National Holiday' as const, description: 'Constitution of India came into effect' },
  { month: 4, day: 14, name: 'Dr. Ambedkar Jayanti / Tamil New Year', type: 'Gazetted Holiday' as const, description: 'Birth anniversary of Dr. B.R. Ambedkar' },
  { month: 5, day: 1, name: 'Labour Day / May Day', type: 'Gazetted Holiday' as const, description: 'International Workers\' Day' },
  { month: 8, day: 15, name: 'Independence Day', type: 'National Holiday' as const, description: 'Indian Independence from British Rule (1947)' },
  { month: 10, day: 2, name: 'Mahatma Gandhi Jayanti', type: 'National Holiday' as const, description: 'Birth anniversary of Mahatma Gandhi' },
  { month: 12, day: 25, name: 'Christmas Day', type: 'Gazetted Holiday' as const, description: 'Celebration of the birth of Jesus Christ' }
];

export function getIndianHolidaysForYear(year: number): IndianHoliday[] {
  if (CURATED_HOLIDAYS[year]) {
    return CURATED_HOLIDAYS[year].map(h => ({
      date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
      name: h.name,
      type: h.type,
      description: h.description
    }));
  }

  // Fallback for years outside curated list (e.g. 2020-2022 or 2029-2035)
  return FIXED_ANNUAL_HOLIDAYS.map(h => ({
    date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
    name: h.name,
    type: h.type,
    description: h.description
  }));
}

export function getIndianHolidaysForMonth(year: number, month: number): IndianHoliday[] {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  const allYearHolidays = getIndianHolidaysForYear(year);
  const mPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return allYearHolidays.filter(h => h.date.startsWith(mPrefix));
}

export function findIndianHoliday(dateStr: string): IndianHoliday | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return undefined;
  const year = parseInt(parts[0], 10);
  const all = getIndianHolidaysForYear(year);
  return all.find(h => h.date === dateStr);
}

