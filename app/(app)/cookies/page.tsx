import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookies"
      subtitle="What Sodoit stores in your browser."
      active="/cookies"
    >
      <LegalSection title="Essential cookies">
        <p>
          Sodoit uses essential cookies required to keep you signed in and
          remember your session. Without these, sign-in would not work.
        </p>
      </LegalSection>

      <LegalSection title="Product analytics">
        <p>
          We use PostHog for product analytics, which sets its own cookies and
          local storage to recognize your browser across visits. This helps us
          understand which pages and features are used. Session recording is
          disabled.
        </p>
      </LegalSection>

      <LegalSection title="Advertising">
        <p>Advertising cookies are not currently used on Sodoit.</p>
      </LegalSection>

      <LegalSection title="As the product develops">
        <p>
          Cookie and analytics controls may evolve as Sodoit develops. If that
          changes in a way that affects you, we will update this page.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
