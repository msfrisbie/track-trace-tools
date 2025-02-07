import { isDevelopment } from "@/modules/environment.module";

interface TrackEventData {
  eventName: string;
  userId: string;
  userProperties?: Record<string, any>;
  eventProperties?: Record<string, any>;
}

const BASE_URL = isDevelopment() ? "http://127.0.0.1:5000/" : "https://api.trackandtrace.tools/";

export async function sendAnalyticsEvent(eventData: TrackEventData) {
  const payload = {
    eventName: eventData.eventName,
    userId: eventData.userId,
    userProperties: eventData.userProperties ?? {},
    eventProperties: eventData.eventProperties ?? {},
  };

  fetch(`${BASE_URL}log/analytics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
