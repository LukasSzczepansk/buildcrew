import "server-only";

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path: string) {
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  devPreview?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "BuildCrew <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n📨 [DEV EMAIL] To: ${input.to}\nSubject: ${input.subject}\n${input.devPreview ?? ""}\n`);
      return { ok: true, dev: true } as const;
    }
    console.error("RESEND_API_KEY is missing in production; email was not sent.");
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" } as const;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Resend error", response.status, await response.text());
      return { ok: false, error: "SEND_FAILED" } as const;
    }
    return { ok: true, dev: false } as const;
  } catch (error) {
    console.error("Email send failed", error);
    return { ok: false, error: "SEND_FAILED" } as const;
  }
}
