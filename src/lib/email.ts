import "server-only";

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path: string) {
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] ?? char);
}

export function buildCrewEmail(input: {
  eyebrow?: string;
  title: string;
  intro?: string;
  content?: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}) {
  const target = input.ctaHref ? absoluteUrl(input.ctaHref) : undefined;
  return `
  <!doctype html>
  <html lang="pl">
    <body style="margin:0;padding:0;background:#f4f4ef;color:#111111;font-family:Inter,Arial,sans-serif">
      <div style="padding:28px 14px">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #d8d8d0;border-radius:10px;overflow:hidden">
          <div style="height:4px;background:#c8f169"></div>
          <div style="padding:28px 28px 24px">
            <div style="font-size:17px;font-weight:700;letter-spacing:-0.02em;margin-bottom:28px">BuildCrew</div>
            ${input.eyebrow ? `<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7e9f25;margin-bottom:10px">${escapeEmailHtml(input.eyebrow)}</div>` : ""}
            <h1 style="font-size:25px;line-height:1.2;letter-spacing:-0.025em;margin:0 0 12px;font-weight:650">${escapeEmailHtml(input.title)}</h1>
            ${input.intro ? `<p style="font-size:14px;line-height:1.65;color:#66665f;margin:0 0 20px">${escapeEmailHtml(input.intro)}</p>` : ""}
            ${input.content ?? ""}
            ${target && input.ctaLabel ? `<div style="margin-top:24px"><a href="${target}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:11px 16px;border-radius:7px;font-size:14px;font-weight:600">${escapeEmailHtml(input.ctaLabel)}</a></div>` : ""}
          </div>
          <div style="border-top:1px solid #e2e2dc;padding:16px 28px;font-size:11px;line-height:1.55;color:#96968f">
            ${input.footer ?? `Dostajesz tę wiadomość, bo masz włączone odpowiednie powiadomienia BuildCrew. Ustawienia możesz zmienić w swoim profilu.`}
          </div>
        </div>
      </div>
    </body>
  </html>`;
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
