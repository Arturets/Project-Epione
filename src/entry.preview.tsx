import { createQwikCity, type PlatformNode } from '@builder.io/qwik-city/middleware/node';
import render from './entry.ssr';
import qwikCityPlan from '@qwik-city-plan';

declare global {
  interface QwikCityPlatform extends PlatformNode {}
}

const { router, notFound } = createQwikCity({ render, qwikCityPlan });

export default { router, notFound };


