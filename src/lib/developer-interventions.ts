import { INTERVENTIONS } from '../config/interventions';
import { ApiError } from './http';
import { Contraindication, Intervention, InterventionEffect, InterventionVersion } from './types';
import { createId, nowIso } from './utils';

const INTERVENTION_ID_REGEX = /^[a-z0-9_]+$/;

export type InterventionVersionInput = {
  interventionId: string;
  name: string;
  category: Intervention['category'];
  durationWeeks: number;
  frequency: string;
  description: string;
  effects: InterventionEffect[];
  contraindications: Contraindication[];
  studySource: InterventionVersion['studySource'];
};

export function ensureInterventionVersionSeed(versions: InterventionVersion[]) {
  if (versions.length > 0) {
    return versions;
  }

  const createdAt = nowIso();
  return INTERVENTIONS.map((intervention) => ({
    id: createId(),
    interventionId: intervention.id,
    versionNumber: 1,
    status: 'published' as const,
    name: intervention.name,
    category: intervention.category,
    durationWeeks: intervention.durationWeeks,
    frequency: intervention.frequency,
    description: intervention.description,
    effects: intervention.effects,
    contraindications: intervention.contraindications,
    studySource: null,
    createdBy: 'system',
    createdAt,
    updatedAt: createdAt
  }));
}

export function createDraftVersion(
  versions: InterventionVersion[],
  input: InterventionVersionInput,
  userId: string
): InterventionVersion {
  validateInterventionVersionInput(input);

  const now = nowIso();
  const latestVersion = Math.max(0, ...versions.filter((item) => item.interventionId === input.interventionId).map((item) => item.versionNumber));

  const draft: InterventionVersion = {
    id: createId(),
    interventionId: input.interventionId,
    versionNumber: latestVersion + 1,
    status: 'draft',
    name: input.name,
    category: input.category,
    durationWeeks: input.durationWeeks,
    frequency: input.frequency,
    description: input.description,
    effects: input.effects,
    contraindications: input.contraindications,
    studySource: input.studySource,
    createdBy: userId,
    createdAt: now,
    updatedAt: now
  };

  return draft;
}

export function updateDraftVersion(
  versions: InterventionVersion[],
  interventionId: string,
  versionNumber: number,
  input: InterventionVersionInput
) {
  validateInterventionVersionInput(input);

  const target = versions.find((entry) => entry.interventionId === interventionId && entry.versionNumber === versionNumber);
  if (!target) {
    throw new ApiError(404, 'Intervention version not found', 'intervention_version_not_found');
  }

  if (target.status !== 'draft') {
    throw new ApiError(400, 'Only draft versions can be updated', 'intervention_version_not_draft');
  }

  target.name = input.name;
  target.category = input.category;
  target.durationWeeks = input.durationWeeks;
  target.frequency = input.frequency;
  target.description = input.description;
  target.effects = input.effects;
  target.contraindications = input.contraindications;
  target.studySource = input.studySource;
  target.updatedAt = nowIso();

  return target;
}

export function publishLatestDraft(versions: InterventionVersion[], interventionId: string, userId: string) {
  const drafts = versions
    .filter((entry) => entry.interventionId === interventionId && entry.status === 'draft')
    .sort((a, b) => b.versionNumber - a.versionNumber);

  const draft = drafts[0];
  if (!draft) {
    throw new ApiError(404, 'No draft found for intervention', 'intervention_draft_not_found');
  }

  const latestPublished = Math.max(
    0,
    ...versions
      .filter((entry) => entry.interventionId === interventionId && entry.status === 'published')
      .map((entry) => entry.versionNumber)
  );

  const now = nowIso();
  const published: InterventionVersion = {
    ...draft,
    id: createId(),
    versionNumber: latestPublished + 1,
    status: 'published',
    createdBy: userId,
    createdAt: now,
    updatedAt: now
  };

  draft.status = 'archived';
  draft.updatedAt = now;

  versions.push(published);
  return published;
}

export function deleteDraftVersion(versions: InterventionVersion[], interventionId: string, versionNumber: number) {
  const index = versions.findIndex((entry) => entry.interventionId === interventionId && entry.versionNumber === versionNumber);
  if (index < 0) {
    throw new ApiError(404, 'Intervention version not found', 'intervention_version_not_found');
  }

  const target = versions[index];
  if (target.status !== 'draft') {
    throw new ApiError(400, 'Only draft versions can be deleted', 'intervention_version_not_draft');
  }

  versions.splice(index, 1);
  return target;
}

export function findVersion(versions: InterventionVersion[], interventionId: string, versionNumber: number) {
  return versions.find((entry) => entry.interventionId === interventionId && entry.versionNumber === versionNumber) ?? null;
}

export function listByIntervention(versions: InterventionVersion[], interventionId: string) {
  return versions
    .filter((entry) => entry.interventionId === interventionId)
    .sort((a, b) => b.versionNumber - a.versionNumber || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function validateInterventionVersionInput(input: InterventionVersionInput) {
  if (!INTERVENTION_ID_REGEX.test(input.interventionId)) {
    throw new ApiError(400, 'intervention_id must be lowercase alphanumeric plus underscores', 'invalid_intervention_id');
  }

  if (!input.name.trim()) {
    throw new ApiError(400, 'name is required', 'invalid_intervention_name');
  }

  if (!input.frequency.trim()) {
    throw new ApiError(400, 'frequency is required', 'invalid_intervention_frequency');
  }

  if (!input.description.trim()) {
    throw new ApiError(400, 'description is required', 'invalid_intervention_description');
  }

  if (!Number.isFinite(input.durationWeeks) || input.durationWeeks < 1) {
    throw new ApiError(400, 'duration_weeks must be a positive number', 'invalid_duration_weeks');
  }

  if (!Array.isArray(input.effects) || input.effects.length === 0) {
    throw new ApiError(400, 'effects must contain at least one entry', 'invalid_intervention_effects');
  }

  for (const effect of input.effects) {
    if (!Number.isFinite(effect.changeValue)) {
      throw new ApiError(400, 'effect changeValue must be numeric', 'invalid_effect_change_value');
    }
    if (!effect.assumptions.trim()) {
      throw new ApiError(400, 'effect assumptions are required', 'invalid_effect_assumptions');
    }
  }
}
