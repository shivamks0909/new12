import { LandingResultLayout } from "@/components/landing-result-layout";

export default function DuplicateIpPage() {
  return (
    <LandingResultLayout
      title="Duplicate IP Detected"
      badgeText="Duplicate IP"
      description="A response from this IP address has already been recorded for this survey."
      theme="info"
    />
  );
}
