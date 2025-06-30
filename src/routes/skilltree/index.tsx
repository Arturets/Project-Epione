import { component$ } from '@builder.io/qwik';
import { SkillTree } from '~/components/skilltree';

export default component$(() => {
  return (
    <div class="flex justify-center items-center min-h-screen bg-gray-100">
      <SkillTree />
    </div>
  );
});
