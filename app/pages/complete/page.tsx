import CallbackPage from "../../components/callback-page";

export default function CompletePage() {
  return (
    <CallbackPage
      status="complete"
      title="Survey Completed"
      badge="Complete"
      description="Thank you for completing the survey. Your response has been recorded successfully."
    />
  );
}
