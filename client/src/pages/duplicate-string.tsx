import { LandingResultLayout } from "@/components/landing-result-layout";

export default function DuplicateStringPage() {
  return (
    <LandingResultLayout
      title="Duplicate Entry Detected"
      badgeText="Duplicate"
      description="A duplicate response has been detected. Each participant may only respond once."
      theme="secondary"
    />
  );
}
