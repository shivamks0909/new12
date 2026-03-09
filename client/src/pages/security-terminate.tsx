import { LandingResultLayout } from "@/components/landing-result-layout";

export default function SecurityTerminatePage() {
  return (
    <LandingResultLayout
      title="Security Terminated"
      badgeText="Security Terminate"
      description="Your session has been terminated due to a security check failure."
      theme="dark"
    />
  );
}
