import CallbackPage from "../../components/callback-page";

export default function TerminatePage() {
  return (
    <CallbackPage
      status="terminate"
      title="Survey Terminated"
      badge="Terminated"
      description="Your session has been terminated. You did not qualify for this survey at this time."
    />
  );
}
