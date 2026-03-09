import { LandingResultLayout } from "@/components/landing-result-layout";

export default function QuotaFullPage() {
  return (
    <LandingResultLayout
      title="Quota Full"
      badgeText="Quota Full"
      description="The survey quota has been reached. We are no longer accepting responses for this survey."
      theme="warning"
    />
  );
}
