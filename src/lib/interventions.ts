import { INTERVENTION_MAP, INTERVENTIONS } from '../config/interventions';
import { METRIC_DEFINITIONS } from '../config/metrics';
import { IMPROVEMENT_DIRECTION, convertWeight } from './metrics';
import { Intervention, InterventionEffect, MetricLatestView, MetricName, WeightUnit } from './types';

export function getInterventions() {
  return INTERVENTIONS;
}

export function getInterventionById(interventionId: string): Intervention | null {
  return INTERVENTION_MAP[interventionId] ?? null;
}

function normalizeEffect(metricName: MetricName, effect: InterventionEffect, currentUnit: string, weightUnit: WeightUnit): number {
  if (metricName === 'weight') {
    if (effect.unit === currentUnit) return effect.changeValue;

    if ((effect.unit === 'kg' || effect.unit === 'lbs') && (currentUnit === 'kg' || currentUnit === 'lbs')) {
      return convertWeight(effect.changeValue, effect.unit, currentUnit);
    }

    if (effect.unit === 'kg' || effect.unit === 'lbs') {
      return convertWeight(effect.changeValue, effect.unit, weightUnit);
    }

    return effect.changeValue;
  }

  if (effect.unit === '%') {
    if (metricName === 'vo2_max' || metricName === 'hrv') {
      return effect.changeValue / 100;
    }
    return effect.changeValue;
  }

  return effect.changeValue;
}

function applyEffect(metricName: MetricName, baseValue: number, effect: InterventionEffect, currentUnit: string, weightUnit: WeightUnit): number {
  const normalized = normalizeEffect(metricName, effect, currentUnit, weightUnit);

  if (effect.unit === '%' && (metricName === 'vo2_max' || metricName === 'hrv')) {
    return baseValue * (1 + normalized);
  }

  return baseValue + normalized;
}

export function simulateInterventionStack(
  metrics: MetricLatestView[],
  selectedInterventionIds: string[],
  weightUnit: WeightUnit
): {
  current: Record<MetricName, number>;
  predicted: Record<MetricName, number>;
  table: Array<{
    metricName: MetricName;
    metricLabel: string;
    current: number;
    predicted: number;
    delta: number;
    confidence: 'low' | 'moderate' | 'high';
    direction: 'improved' | 'worsened' | 'unchanged';
  }>;
  warnings: string[];
  interventions: Intervention[];
} {
  const selected = selectedInterventionIds
    .map((id) => getInterventionById(id))
    .filter((intervention): intervention is Intervention => Boolean(intervention));

  const latestByMetric = new Map(metrics.map((entry) => [entry.metricName, entry]));

  const current = {} as Record<MetricName, number>;
  const predicted = {} as Record<MetricName, number>;

  for (const definition of METRIC_DEFINITIONS) {
    const latest = latestByMetric.get(definition.key);
    const currentValue = latest?.value ?? 0;
    current[definition.key] = currentValue;
    predicted[definition.key] = currentValue;
  }

  for (const intervention of selected) {
    for (const effect of intervention.effects) {
      const latest = latestByMetric.get(effect.metric);
      const currentUnit = latest?.unit ?? (effect.metric === 'weight' ? weightUnit : effect.unit);
      predicted[effect.metric] = applyEffect(effect.metric, predicted[effect.metric], effect, currentUnit, weightUnit);
    }
  }

  const warnings: string[] = [];
  const selectedIdSet = new Set(selected.map((item) => item.id));

  for (const intervention of selected) {
    for (const contraindication of intervention.contraindications) {
      const lowered = contraindication.scenario.toLowerCase();
      const selectedIds = Array.from(selectedIdSet);
      const matchStrength =
        Number(lowered.includes('cardio') && selectedIds.some((id) => id.includes('cardio'))) +
        Number(lowered.includes('weight_training') && selectedIds.some((id) => id.includes('weight_training'))) +
        Number(lowered.includes('deficit') && selectedIds.some((id) => id.includes('diet')));

      if (matchStrength >= 2 || selected.length > 1) {
        warnings.push(contraindication.warning);
      }
    }
  }

  const table = METRIC_DEFINITIONS.map((definition) => {
    const baseline = current[definition.key];
    const next = predicted[definition.key];
    const delta = next - baseline;

    const direction: 'improved' | 'worsened' | 'unchanged' =
      Math.abs(delta) < 0.001
        ? 'unchanged'
        : IMPROVEMENT_DIRECTION[definition.key] === 'lower'
          ? delta < 0
            ? 'improved'
            : 'worsened'
          : delta > 0
            ? 'improved'
            : 'worsened';

    const confidences = selected
      .flatMap((intervention) => intervention.effects.filter((effect) => effect.metric === definition.key))
      .map((effect) => effect.confidence);

    const confidence: 'low' | 'moderate' | 'high' =
      confidences.includes('high') ? 'high' : confidences.includes('moderate') ? 'moderate' : confidences.length ? 'low' : 'moderate';

    return {
      metricName: definition.key,
      metricLabel: definition.label,
      current: baseline,
      predicted: next,
      delta,
      confidence,
      direction
    };
  });

  return {
    current,
    predicted,
    table,
    warnings: Array.from(new Set(warnings)),
    interventions: selected
  };
}
