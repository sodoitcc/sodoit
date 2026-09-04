import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of service"
      subtitle="The basics of using Sodoit."
      active="/terms"
    >
      <LegalSection title="Using Sodoit">
        <p>
          By using Sodoit you agree to use the product respectfully and not to
          misuse the platform, other users, or the content shared here. Sodoit
          is currently in beta, and features may change as we improve the
          product.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You&apos;re responsible for the activity on your account and for
          keeping your sign-in details secure. Let us know if you think your
          account has been compromised.
        </p>
      </LegalSection>

      <LegalSection title="Ticks, Guides, and your content">
        <p>
          Ticks are the experiences you save and complete on Sodoit. Guides are
          curated collections of Spots put together by Sodoit or the community.
          Profile content, Collections, and other content you create remain
          yours — please keep it honest and respectful.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Don&apos;t misuse Sodoit: no abuse, harassment, spam, or attempts to
          disrupt the service. We may remove content that breaks these terms.
        </p>
      </LegalSection>

      <LegalSection title="Third-party links and services">
        <p>
          Guides and Ticks may link to third-party places, websites, or
          services. We don&apos;t control those and aren&apos;t responsible for
          their content or availability.
        </p>
      </LegalSection>

      <LegalSection title="Travel and activity disclaimer">
        <p>
          Ticks, Guides, and Spots are provided as-is. Sodoit is not responsible
          for the outcome of any activity or trip you choose to try. Use your
          own judgement, especially for anything physical, remote, or
          higher-risk.
        </p>
      </LegalSection>

      <LegalSection title="Service availability">
        <p>
          We aim to keep Sodoit available, but don&apos;t guarantee
          uninterrupted access. Features may be added, changed, or removed as
          the product evolves.
        </p>
      </LegalSection>

      <LegalSection title="Account suspension and removal">
        <p>
          We may suspend or remove accounts that misuse the platform or violate
          these terms. Where possible, we will let you know why.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We may update these terms as the product evolves. Continued use after
          changes means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms? Reach us at{" "}
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
