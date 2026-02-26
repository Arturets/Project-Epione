import { SuggestionRule } from '../lib/types';

export const SUGGESTION_RULES: SuggestionRule[] = [
  {
    id: 'weight_loss_priority',
    condition: {
      metric: 'weight',
      operator: 'above',
      value: 85,
      unit: 'kg'
    },
    goal: 'weight_loss',
    suggestedInterventions: ['diet_500_deficit', 'cardio_moderate_3x'],
    message: 'Your current weight is above your target range. A moderate caloric deficit plus cardio is the most evidence-backed starting point.'
  },
  {
    id: 'sleep_recovery_priority',
    condition: {
      metric: 'sleep',
      operator: 'below',
      value: 6,
      unit: 'hours'
    },
    goal: 'recovery',
    suggestedInterventions: ['screen_time_reduction', 'cardio_moderate_3x'],
    message: 'Sleep below 6 hours impairs recovery. Start with reduced evening screen exposure and lower-intensity cardio.'
  },
  {
    id: 'stress_reset_priority',
    condition: {
      metric: 'stress',
      operator: 'above',
      value: 7,
      unit: '1-10'
    },
    goal: 'stress_reduction',
    suggestedInterventions: ['screen_time_reduction', 'cardio_moderate_3x'],
    message: 'Your stress is elevated. Moderate cardio and sleep consistency are strong first-line interventions.'
  },
  {
    id: 'cardio_capacity_priority',
    condition: {
      metric: 'vo2_max',
      operator: 'below',
      value: 38,
      unit: 'ml/kg/min'
    },
    goal: 'cardio_fitness',
    suggestedInterventions: ['cardio_moderate_3x', 'weight_training_5x5'],
    message: 'Your VO2 max suggests low aerobic reserve. Add structured cardio first, then layer strength.'
  }
];
