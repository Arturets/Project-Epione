import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

const QUOTES = [
  {
    quote: 'This is the first dashboard that explains why my fatigue spikes after stress-heavy weeks.',
    author: 'Member, Recovery Program'
  },
  {
    quote: 'The graph made my coaching calls more precise and less hand-wavy.',
    author: 'Performance Coach'
  },
  {
    quote: 'Before/after simulation helped me pick one intervention instead of doing everything at once.',
    author: 'Individual user'
  },
  {
    quote: 'Our team used snapshots to standardize check-ins and communicate progress clearly.',
    author: 'Clinical Partner'
  }
];

export default component$(() => {
  return (
    <MarketingShell title="Testimonials" subtitle="What early users say about Project Epione.">
      <section class="landing-testimonials-grid">
        {QUOTES.map((item) => (
          <blockquote class="landing-quote" key={item.author}>
            “{item.quote}”
            <cite>— {item.author}</cite>
          </blockquote>
        ))}
      </section>
    </MarketingShell>
  );
});
