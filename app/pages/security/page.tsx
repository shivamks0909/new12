import CallbackPage from "../../components/callback-page";

export default function SecurityPage() {
  return (
    <CallbackPage
      status="security"
      title="Security Alert"
      badge="Security Terminated"
      description="Your session has been flagged by our security system. This action has been logged."
    />
  );
}
