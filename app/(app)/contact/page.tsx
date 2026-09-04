import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalSection } from "@/components/legal/LegalSection";

export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact"
      subtitle="We'd like to hear from you."
      active="/contact"
    >
      <LegalSection title="Get in touch">
        <p>Questions, feedback, or issues with the product?</p>
        <a
          href="mailto:hello@sodoit.cc"
          className="w-fit font-semibold text-accent-dark transition-colors hover:text-accent"
        >
          hello@sodoit.cc
        </a>
      </LegalSection>

      <LegalSection title="Account and privacy requests">
        <p>
          For account access, export, deletion, or privacy requests, use the
          same address.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
