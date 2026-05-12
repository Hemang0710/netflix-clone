import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend(event, hint) {
    if (event.exception) {
      const error = hint.originalException;
      if (error?.message?.includes("404") || error?.status === 404) {
        return null;
      }
    }
    return event;
  },
});
