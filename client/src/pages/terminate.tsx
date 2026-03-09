import { LandingResultLayout } from "@/components/landing-result-layout";

export default function TerminatePage() {
  return (
    <LandingResultLayout
      title="Survey Terminated"
      badgeText="Terminated"
      description="Your survey session has been terminated. You did not qualify for this survey."
      theme="error"
    />
  );
}
