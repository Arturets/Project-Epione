import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { SignupForm } from '../../../components/Auth/SignupForm';
import { OAuthButton } from '../../../components/Auth/OAuthButton';
import { AppShell } from '../../../components/Common/AppShell';
import { PRIMARY_OAUTH_PROVIDERS, SUGGESTED_OAUTH_PROVIDERS } from '../../../config/oauth-providers';

export default component$(() => {
  return (
    <AppShell title="Create account" subtitle="Start tracking metrics, interventions, and snapshots.">
      <section class="auth-grid">
        <SignupForm />
        <div class="auth-form-card">
          <h2>Or connect an OAuth provider</h2>
          <p class="muted">Google, Apple, Microsoft, and Samsung are ready; you can add more providers via env config.</p>
          {PRIMARY_OAUTH_PROVIDERS.map((provider) => (
            <OAuthButton key={provider.id} provider={provider.id} />
          ))}
          <p class="muted">Additional suggested providers:</p>
          {SUGGESTED_OAUTH_PROVIDERS.map((provider) => (
            <OAuthButton key={provider.id} provider={provider.id} />
          ))}
          <p class="muted">
            Already registered? <Link href="/auth/login">Sign in</Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
});
