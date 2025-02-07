import { isDevelopment } from "@/modules/environment.module";

const BASE_URL = isDevelopment() ? "http://127.0.0.1:5000/" : "https://api.trackandtrace.tools/";

export async function slackLog(text: string, data?: string | { [key: string]: string | number }) {
  fetch(`${BASE_URL}/log/slack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, data }),
  });
}
