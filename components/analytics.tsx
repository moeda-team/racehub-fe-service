"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function Analytics() {
  return (
    <>
      <VercelAnalytics
        beforeSend={(event) => {
          const url = new URL(event.url);
          url.searchParams.delete("token");
          return { ...event, url: url.toString() };
        }}
      />
      <SpeedInsights />
    </>
  );
}
