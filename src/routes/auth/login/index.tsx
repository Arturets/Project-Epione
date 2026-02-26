import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { LoginForm } from '../../../components/Auth/LoginForm';
import { OAuthButton } from '../../../components/Auth/OAuthButton';
import { AppShell } from '../../../components/Common/AppShell';
import { PRIMARY_OAUTH_PROVIDERS, SUGGESTED_OAUTH_PROVIDERS } from '../../../config/oauth-providers';

export default component$(() => {
  return (
    <AppShell title="Login" subtitle="Access your health graph and intervention workspace.">
      <section class="auth-grid">
        <LoginForm />
        <div class="auth-form-card">
          <h2>Or continue with OAuth</h2>
          <p class="muted">Google, Apple, Microsoft, and Samsung are pre-wired with PKCE state validation.</p>
          {PRIMARY_OAUTH_PROVIDERS.map((provider) => (
            <OAuthButton key={provider.id} provider={provider.id} />
          ))}
          <p class="muted">Additional suggested providers:</p>
          {SUGGESTED_OAUTH_PROVIDERS.map((provider) => (
            <OAuthButton key={provider.id} provider={provider.id} />
          ))}
          <p class="muted">
            New here? <Link href="/auth/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
});
