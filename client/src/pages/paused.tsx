import { LandingResultLayout } from "@/components/landing-result-layout";

export default function PausedPage() {
  return (
    <LandingResultLayout
      title="Survey Paused"
      badgeText="Paused"
      description="This survey is currently paused and not accepting new responses. Please try again later."
      theme="warning"
    />
  );
}
