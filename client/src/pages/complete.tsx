import { LandingResultLayout } from "@/components/landing-result-layout";

export default function CompletePage() {
  return (
    <LandingResultLayout
      title="Survey Completed"
      badgeText="Complete"
      description="Thank you for completing the survey. Your response has been recorded successfully."
      theme="success"
    />
  );
}
