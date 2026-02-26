import { Intervention } from '../lib/types';

export const INTERVENTIONS: Intervention[] = [
  {
    id: 'weight_training_5x5',
    name: 'Weight Training (Starting Strength 5x5)',
    category: 'strength',
    durationWeeks: 8,
    frequency: '3x/week',
    description: 'Barbell compound training focused on progressive overload for strength and lean mass.',
    effects: [
      {
        metric: 'weight',
        changeValue: 2.3,
        unit: 'kg',
        confidence: 'moderate',
        assumptions: 'Average adherence, sufficient recovery and protein intake.',
        range: [1.4, 3.2]
      },
      {
        metric: 'body_fat',
        changeValue: -1,
        unit: '%',
        confidence: 'low',
        assumptions: 'Assumes mostly maintenance calories.',
        range: [-2, 0]
      },
      {
        metric: 'vo2_max',
        changeValue: 3,
        unit: '%',
        confidence: 'low',
        assumptions: 'Indirect transfer from improved work capacity.',
        range: [1, 5]
      }
    ],
    contraindications: [
      {
        scenario: 'heavy_cardio + weight_training + caloric_deficit',
        warning:
          'Combining high-volume cardio with strength training in a caloric deficit can impair hypertrophy and recovery. Prioritize sleep and protein intake.'
      }
    ]
  },
  {
    id: 'cardio_moderate_3x',
    name: 'Cardio (Moderate Intensity, 3x/week)',
    category: 'cardio',
    durationWeeks: 8,
    frequency: '3x/week',
    description: 'Zone 2 + moderate interval conditioning for cardiovascular health.',
    effects: [
      {
        metric: 'weight',
        changeValue: -1.8,
        unit: 'kg',
        confidence: 'moderate',
        assumptions: 'No compensatory overeating.',
        range: [-2.3, -1.3]
      },
      {
        metric: 'vo2_max',
        changeValue: 10,
        unit: '%',
        confidence: 'moderate',
        assumptions: 'Consistent frequency and progressive overload.',
        range: [7, 12]
      },
      {
        metric: 'rhr',
        changeValue: -5,
        unit: 'bpm',
        confidence: 'moderate',
        assumptions: 'No concurrent illness or overtraining.',
        range: [-7, -3]
      },
      {
        metric: 'hrv',
        changeValue: 10,
        unit: '%',
        confidence: 'moderate',
        assumptions: 'Adequate recovery and sleep quality.',
        range: [6, 14]
      }
    ],
    contraindications: [
      {
        scenario: 'heavy_cardio + severe_sleep_debt',
        warning: 'High cardio load with chronic sleep debt may worsen stress and blunt recovery.'
      }
    ]
  },
  {
    id: 'diet_500_deficit',
    name: 'Diet Intervention (500 kcal/day deficit)',
    category: 'diet',
    durationWeeks: 8,
    frequency: 'Daily',
    description: 'Structured clean eating plan with moderate caloric deficit and high satiety foods.',
    effects: [
      {
        metric: 'weight',
        changeValue: -4.1,
        unit: 'kg',
        confidence: 'moderate',
        assumptions: 'Average adherence around 500 kcal/day deficit.',
        range: [-5.4, -3.2]
      },
      {
        metric: 'body_fat',
        changeValue: -2.5,
        unit: '%',
        confidence: 'moderate',
        assumptions: 'Protein intake is maintained.',
        range: [-3.2, -1.8]
      },
      {
        metric: 'sleep',
        changeValue: 0,
        unit: 'hours',
        confidence: 'low',
        assumptions: 'Neutral effect unless hunger disrupts sleep.',
        range: [-0.2, 0.2]
      }
    ],
    contraindications: [
      {
        scenario: 'aggressive_deficit + high_training_volume',
        warning:
          'Combining a large caloric deficit with high training volume can increase fatigue, hunger, and muscle loss risk.'
      }
    ]
  },
  {
    id: 'screen_time_reduction',
    name: 'Screen Time Reduction (No screens 1 hour before bed)',
    category: 'sleep',
    durationWeeks: 4,
    frequency: 'Daily',
    description: 'Reduces evening screen exposure to improve sleep onset and recovery.',
    effects: [
      {
        metric: 'sleep',
        changeValue: 0.75,
        unit: 'hours',
        confidence: 'moderate',
        assumptions: 'Consistent digital sunset routine.',
        range: [0.5, 1]
      },
      {
        metric: 'hrv',
        changeValue: 15,
        unit: '%',
        confidence: 'moderate',
        assumptions: 'Sleep quality improves alongside sleep duration.',
        range: [10, 18]
      },
      {
        metric: 'stress',
        changeValue: -2,
        unit: '1-10',
        confidence: 'moderate',
        assumptions: 'Reduced cognitive load and better evening wind-down.',
        range: [-3, -1]
      }
    ],
    contraindications: []
  }
];

export const INTERVENTION_MAP = Object.fromEntries(INTERVENTIONS.map((intervention) => [intervention.id, intervention]));
