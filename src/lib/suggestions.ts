import { SUGGESTION_RULES } from '../config/rules';
import { MetricLatestView, SuggestionRule } from './types';

function evaluateRule(rule: SuggestionRule, latestByMetric: Map<string, MetricLatestView>) {
  const metric = latestByMetric.get(rule.condition.metric);
  if (!metric) {
    return false;
  }

  if (rule.condition.operator === 'above') {
    return metric.value > rule.condition.value;
  }

  if (rule.condition.operator === 'below') {
    return metric.value < rule.condition.value;
  }

  return false;
}

export function buildSuggestions(metrics: MetricLatestView[]) {
  const latestByMetric = new Map(metrics.map((item) => [item.metricName, item]));

  const matches = SUGGESTION_RULES.filter((rule) => evaluateRule(rule, latestByMetric));

  const ranked = matches
    .map((rule) => ({
      ...rule,
      score:
        rule.goal === 'recovery'
          ? 3
          : rule.goal === 'stress_reduction'
            ? 2
            : rule.goal === 'weight_loss'
              ? 2
              : 1
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...rest }) => rest);

  return ranked;
}
