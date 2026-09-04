import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy policy"
      subtitle="How Sodoit handles your data."
      active="/privacy"
    >
      <LegalSection title="Information we collect">
        <p>
          When you create a Sodoit account, we collect your email address and
          the username and profile information you choose to add, such as a bio
          or avatar.
        </p>
        <p>
          As you use Sodoit, we store the Ticks and Guides you save or complete,
          the Collections you build, and any content you create on your profile.
        </p>
      </LegalSection>

      <LegalSection title="Authentication and account data">
        <p>
          Sign-in and account data (your email and encrypted credentials) are
          handled by Supabase, our authentication provider. We don&apos;t store
          passwords ourselves.
        </p>
      </LegalSection>

      <LegalSection title="How we use your information">
        <p>
          Your information is used to run your account, show your public
          profile, track your saved and completed Ticks, and support features
          like Guides and Collections.
        </p>
        <p>We do not sell your data to third parties.</p>
      </LegalSection>

      <LegalSection title="Analytics and product usage">
        <p>
          We use PostHog to understand how Sodoit is used — which pages are
          visited and which features get used — so we can improve the product.
          Session recording is disabled, and we do not autocapture every
          interaction.
        </p>
      </LegalSection>

      <LegalSection title="Error and performance monitoring">
        <p>
          We use Sentry to catch errors and performance issues in production so
          we can fix them. Sentry is configured not to collect personal user
          information or request bodies.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          Sodoit runs on Supabase, which stores our database and handles
          authentication and file storage, and Vercel, which hosts the
          application. Both process data on our behalf solely to operate the
          product.
        </p>
      </LegalSection>

      <LegalSection title="Your data rights">
        <p>
          You can update your profile information at any time from your account
          settings. To request a copy or deletion of your data, contact us and
          we will process your request.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy? Reach us at{" "}
          <a
            href="mailto:hello@sodoit.cc"
            className="font-semibold text-accent-dark transition-colors hover:text-accent"
          >
            hello@sodoit.cc
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
