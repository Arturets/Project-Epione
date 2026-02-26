import { component$, useStore } from '@builder.io/qwik';
import { ANATOMY_CANVAS, AnatomyView, MUSCLE_HEAD_REGIONS, MuscleHeadRegion } from '../../config/anatomy';

type RegionInstance = {
  key: string;
  cx: number;
  cy: number;
  rotate: number;
};

function isSelected(ids: string[], id: string) {
  return ids.includes(id);
}

function toggleSelection(ids: string[], id: string) {
  const index = ids.indexOf(id);
  if (index >= 0) {
    ids.splice(index, 1);
    return;
  }
  ids.push(id);
}

function buildRegionInstances(region: MuscleHeadRegion): RegionInstance[] {
  const left: RegionInstance = {
    key: 'left',
    cx: region.centerX,
    cy: region.centerY,
    rotate: region.rotate
  };

  if (!region.mirrored) {
    return [left];
  }

  return [
    left,
    {
      key: 'right',
      cx: ANATOMY_CANVAS.width - region.centerX,
      cy: region.centerY,
      rotate: -region.rotate
    }
  ];
}

export const MuscleHeadDiagram = component$(() => {
  const state = useStore({
    view: 'front' as AnatomyView,
    selectedIds: [] as string[],
    activeId: ''
  });

  const visibleRegions = MUSCLE_HEAD_REGIONS.filter((region) => region.view === state.view);
  const selectedRegions = MUSCLE_HEAD_REGIONS.filter((region) => state.selectedIds.includes(region.id));

  const activeRegion =
    (state.activeId ? MUSCLE_HEAD_REGIONS.find((region) => region.id === state.activeId) : null) ??
    selectedRegions[0] ??
    null;

  const groupedVisible = Array.from(
    visibleRegions.reduce((map, region) => {
      const existing = map.get(region.muscle) ?? [];
      existing.push(region);
      map.set(region.muscle, existing);
      return map;
    }, new Map<string, MuscleHeadRegion[]>())
  );

  return (
    <section class="anatomy-layout">
      <div class="card anatomy-canvas-card">
        <div class="section-header-row">
          <div>
            <h3>Anatomical Muscle-Head Selector</h3>
            <p class="muted">Click regions to select heads for focused analysis and planning.</p>
          </div>
          <div class="anatomy-controls">
            <button
              class={`button button-ghost ${state.view === 'front' ? 'button-active' : ''}`}
              type="button"
              onClick$={() => {
                state.view = 'front';
                state.activeId = '';
              }}
            >
              Front
            </button>
            <button
              class={`button button-ghost ${state.view === 'back' ? 'button-active' : ''}`}
              type="button"
              onClick$={() => {
                state.view = 'back';
                state.activeId = '';
              }}
            >
              Back
            </button>
          </div>
        </div>

        <p class="small muted">
          Selected heads: <strong>{state.selectedIds.length}</strong>
        </p>

        <div class="anatomy-svg-wrap">
          <svg
            class="anatomy-svg"
            viewBox={`0 0 ${ANATOMY_CANVAS.width} ${ANATOMY_CANVAS.height}`}
            role="img"
            aria-label={`Anatomical diagram in ${state.view} view`}
          >
            <rect x="0" y="0" width={ANATOMY_CANVAS.width} height={ANATOMY_CANVAS.height} class="anatomy-bg" />

            <g class="anatomy-silhouette">
              <circle cx="210" cy="72" r="34" />
              <rect x="150" y="112" width="120" height="220" rx="60" ry="60" />
              <rect x="95" y="134" width="42" height="256" rx="20" ry="20" />
              <rect x="283" y="134" width="42" height="256" rx="20" ry="20" />
              <rect x="165" y="326" width="90" height="92" rx="36" ry="36" />
              <rect x="165" y="402" width="36" height="314" rx="18" ry="18" />
              <rect x="219" y="402" width="36" height="314" rx="18" ry="18" />
            </g>

            {visibleRegions.map((region) =>
              buildRegionInstances(region).map((instance) => (
                <ellipse
                  key={`${region.id}-${instance.key}`}
                  cx={instance.cx}
                  cy={instance.cy}
                  rx={region.rx}
                  ry={region.ry}
                  transform={`rotate(${instance.rotate} ${instance.cx} ${instance.cy})`}
                  class={[
                    'anatomy-region',
                    state.activeId === region.id ? 'anatomy-region-active' : '',
                    isSelected(state.selectedIds, region.id) ? 'anatomy-region-selected' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick$={() => {
                    state.activeId = region.id;
                    toggleSelection(state.selectedIds, region.id);
                  }}
                  onMouseEnter$={() => {
                    state.activeId = region.id;
                  }}
                />
              ))
            )}
          </svg>
        </div>
      </div>

      <aside class="card anatomy-side-panel">
        <div class="anatomy-info-card">
          <h4>{activeRegion ? activeRegion.label : 'Hover or click a muscle head'}</h4>
          {activeRegion ? (
            <>
              <p class="muted">{activeRegion.summary}</p>
              <p class="small">
                <strong>Primary action:</strong> {activeRegion.primaryAction}
              </p>
              <p class="small">
                <strong>View:</strong> {activeRegion.view}
              </p>
            </>
          ) : (
            <p class="muted">Use the diagram to select specific heads. You can combine multiple heads.</p>
          )}
        </div>

        <div class="anatomy-info-card">
          <div class="section-header-row">
            <h4>Selected Heads</h4>
            {state.selectedIds.length ? (
              <button
                class="button button-ghost"
                type="button"
                onClick$={() => {
                  state.selectedIds.splice(0, state.selectedIds.length);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
          {selectedRegions.length ? (
            <div class="anatomy-selected-grid">
              {selectedRegions.map((region) => (
                <button
                  key={region.id}
                  class="anatomy-chip"
                  type="button"
                  onClick$={() => {
                    state.activeId = region.id;
                    toggleSelection(state.selectedIds, region.id);
                  }}
                >
                  {region.label}
                </button>
              ))}
            </div>
          ) : (
            <p class="muted">No muscle heads selected yet.</p>
          )}
        </div>

        <div class="anatomy-info-card">
          <h4>{state.view === 'front' ? 'Front View Heads' : 'Back View Heads'}</h4>
          <ul class="anatomy-muscle-list">
            {groupedVisible.map(([muscle, heads]) => (
              <li key={muscle} class="anatomy-muscle-item">
                <strong>{muscle}</strong>
                <div class="anatomy-head-buttons">
                  {heads.map((region) => (
                    <button
                      key={region.id}
                      class={`button button-ghost ${isSelected(state.selectedIds, region.id) ? 'button-active' : ''}`}
                      type="button"
                      onClick$={() => {
                        state.activeId = region.id;
                        toggleSelection(state.selectedIds, region.id);
                      }}
                    >
                      {region.head}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
});
