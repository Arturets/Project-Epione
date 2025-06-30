// src/components/SkillTree.tsx
import { component$, useSignal, useTask$, $, useStore } from '@builder.io/qwik';

export const SkillTree = component$(() => {
  const radius = 10;
  const draggingIndex = useSignal<number | null>(null);
  const offset = useSignal({ x: 0, y: 0 });

  const positions = useStore([
    { x: 50, y: 10 },
    { x: 90, y: 35 },
    { x: 72, y: 80 },
    { x: 28, y: 80 },
    { x: 10, y: 35 },
  ]);

  const onMouseDown = $((e: MouseEvent, index: number) => {
    draggingIndex.value = index;
    const pos = positions[index];
    offset.value = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  });

  const onMouseMove = $((e: MouseEvent) => {
    if (draggingIndex.value !== null) {
      const index = draggingIndex.value;
      positions[index].x = e.clientX - offset.value.x;
      positions[index].y = e.clientY - offset.value.y;
    }
  });

  const onMouseUp = $(() => {
    draggingIndex.value = null;
  });

  // Attach mouse listeners to document
  useTask$(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  });

  return (
    <svg viewBox="0 0 100 100" class="w-full h-auto max-w-xs mx-auto border">
      {positions.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r={radius}
          fill="#4ade80"
          class="cursor-pointer"
          onMouseDown$={(e) => onMouseDown(e, i)}
        />
      ))}
    </svg>
  );
});
