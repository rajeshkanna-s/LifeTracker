import React from 'react';

const BODY_PROFILE = [
  { label: 'HEIGHT', value: '171 cm' },
  { label: 'WEIGHT', value: '74.95 kg' },
  { label: 'AGE', value: '30 yrs' },
  { label: 'NECK', value: '15 in' },
  { label: 'HIP', value: '31 in' },
];

const WORKOUT_SCHEDULE = [
  { day: 'MONDAY', plan: 'Chest & Cardio', tone: 'green' },
  { day: 'TUESDAY', plan: 'Biceps & Abs', tone: 'green' },
  { day: 'WEDNESDAY', plan: 'Lat & Cardio', tone: 'green' },
  { day: 'THURSDAY', plan: 'Triceps & Abs', tone: 'green' },
  { day: 'FRIDAY', plan: 'Shoulder & Cardio', tone: 'green' },
  { day: 'SATURDAY', plan: 'Leg & Glutes', tone: 'yellow' },
  { day: 'SUNDAY', plan: 'REST DAY', tone: 'red' },
];

const MEALS_LEFT = [
  { title: 'MORNING  (Pre-Workout)', items: ['1 Black Cocoa (without sugar)', '1 Red Banana'] },
  { title: 'PRE-WORKOUT  (Fast Morning)', items: ['150 – 200 grams Oats'] },
  { title: 'MORNING BRUNCH', items: ['5 Egg Whites', '1 Handful of Nuts  (see Nuts section below)', '2 Slices Bread / equivalent'] },
];

const MEALS_RIGHT = [
  { title: 'LUNCH', items: ['1 Medium-cut Rice / Pulao', '200 grams Chicken', 'Pineapple / Papaya (medium serving)', '5 equal portions', '1 large-cut Boiled Vegetables'] },
  { title: 'EVENING', items: ['200 – 250 grams Sweet Potato', '50 grams Sprouts'] },
  { title: 'DINNER', items: ['3 Chapathi', '200 grams Chicken'] },
];

const NUTS_MIX = ['≥5 Walnut', '5 Almond', '5 Black Grapes', '5 Pumpkin Seeds', '8 Dry Fig'];

const AVOID_LIST = [
  ['Sugar', 'Oil'],
  ['Outside Foods', 'Chips'],
  ['Chocolates', 'Beer'],
  ['Packed Food', 'Coconut'],
  ['Peanut', 'Peanut Butter'],
  ['Potato', ''],
];

const SUPPLEMENTS = [
  { name: 'Triple Strength Fish Oil', sub: 'After Meal' },
  { name: 'Zinc', sub: 'Before Bed' },
  { name: 'Multi Vitamin', sub: 'After Breakfast Meal' },
  { name: 'Quercetin', sub: 'After Meal' },
];

const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd} / ${mm} / ${yy}`;
};

const FitnessPlan: React.FC = () => {
  const today = formatDate(new Date());

  return (
    <div className="fitness-plan-wrapper">
      {/* ───────── PAGE 1: PERSONALIZED FITNESS PLAN ───────── */}
      <div className="fp-card">
        <h1 className="fp-title">PERSONALIZED FITNESS PLAN</h1>
        <p className="fp-subtitle">Diet Chart  |  Workout Schedule  |  Supplements</p>
        <p className="fp-date">Date: {today}</p>
        <div className="fp-divider" />

        {/* Body Profile */}
        <div className="fp-section">
          <div className="fp-section-label">BODY PROFILE</div>
          <div className="fp-stats-grid">
            {BODY_PROFILE.map(s => (
              <div key={s.label} className="fp-stat">
                <span className="fp-stat-label">{s.label}</span>
                <span className="fp-stat-value">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="fp-goal-box">
            <span className="fp-goal-label">GOAL:</span>
            <span className="fp-goal-text">Muscular Gain  &  Graduation</span>
          </div>
        </div>

        {/* Weekly Workout Schedule */}
        <div className="fp-section">
          <div className="fp-section-label">
            WEEKLY WORKOUT SCHEDULE  <span className="fp-section-sub">(1 Month)</span>
          </div>
          <div className="fp-day-list">
            {WORKOUT_SCHEDULE.map(w => (
              <div key={w.day} className="fp-day-row">
                <span className={`fp-day-pill fp-pill-${w.tone}`}>{w.day}</span>
                <span className="fp-day-arrow">→</span>
                <span className="fp-day-content">{w.plan}</span>
              </div>
            ))}
          </div>
          <div className="fp-target-time">
            <span className="fp-target-label">TARGET TIME:</span>
            <span className="fp-target-text">1 Hour  →  Weight Training</span>
            <span className="fp-target-sep">|</span>
            <span className="fp-target-text">30 Min  →  Cardio</span>
          </div>
        </div>
      </div>

      {/* ───────── PAGE 2: DIET CHART ───────── */}
      <div className="fp-card">
        <h1 className="fp-title">DIET CHART</h1>
        <p className="fp-subtitle">Structured Meal Plan for Muscular Gain</p>
        <div className="fp-divider" />

        {/* Meal grid */}
        <div className="fp-meal-grid">
          <div className="fp-meal-col">
            {MEALS_LEFT.map(m => (
              <div key={m.title} className="fp-meal-card">
                <div className="fp-meal-label">{m.title}</div>
                <ul className="fp-meal-list">
                  {m.items.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="fp-meal-col">
            {MEALS_RIGHT.map(m => (
              <div key={m.title} className="fp-meal-card">
                <div className="fp-meal-label">{m.title}</div>
                <ul className="fp-meal-list">
                  {m.items.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Nuts Mix */}
        <div className="fp-nuts-card">
          <div className="fp-nuts-label">DAILY NUTS MIX  <span className="fp-section-sub">(Morning Brunch)</span></div>
          <div className="fp-nuts-row">
            {NUTS_MIX.map(n => <span key={n} className="fp-nut-item">• {n}</span>)}
          </div>
        </div>

        {/* Bottom row: Avoid List + Supplements */}
        <div className="fp-bottom-grid">
          <div className="fp-avoid-card">
            <div className="fp-avoid-label">AVOID LIST</div>
            <div className="fp-avoid-grid">
              {AVOID_LIST.map((pair, idx) => (
                <React.Fragment key={idx}>
                  <span className="fp-avoid-item">{pair[0] && `• ${pair[0]}`}</span>
                  <span className="fp-avoid-item">{pair[1] && `• ${pair[1]}`}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="fp-supplements-card">
            <div className="fp-supplements-label">ESSENTIAL SUPPLEMENTS</div>
            <ul className="fp-supplements-list">
              {SUPPLEMENTS.map(s => (
                <li key={s.name}>
                  <span className="fp-supp-name">{s.name}</span>
                  <span className="fp-supp-sub">{s.sub}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessPlan;
