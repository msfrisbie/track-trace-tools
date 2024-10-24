export async function slackLog(text: string, data?: string | { [key: string]: string | number }) {
  fetch("https://api.trackandtrace.tools/log/slack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, data }),
  });
}
