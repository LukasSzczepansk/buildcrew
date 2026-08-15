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
  const footerText = escapeEmailHtml(
    input.footer ??
      "Wiadomość została wysłana przez BuildCrew. Ustawienia powiadomień możesz zmienić w swoim profilu.",
  );

  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
  </head>
  <body style="margin:0;padding:0;background:#F4F4EF;color:#111111;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F4F4EF;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #DADAD3;">
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid #DADAD3;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:18px;line-height:24px;font-weight:600;color:#111111;">BuildCrew</td>
                    <td align="right"><span style="display:inline-block;width:8px;height:8px;background:#C8F169;"></span></td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:34px 28px 32px;">
                ${input.eyebrow ? `<div style="margin-bottom:10px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#70706B;">${escapeEmailHtml(input.eyebrow)}</div>` : ""}
                <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:600;letter-spacing:-0.5px;color:#111111;">${escapeEmailHtml(input.title)}</h1>
                ${input.intro ? `<p style="margin:14px 0 0;font-size:15px;line-height:23px;color:#70706B;">${escapeEmailHtml(input.intro)}</p>` : ""}
                ${input.content ? `<div style="margin-top:22px;">${input.content}</div>` : ""}
                ${target && input.ctaLabel ? `<div style="margin-top:28px;"><a href="${target}" style="display:inline-block;padding:12px 18px;background:#111111;color:#FFFFFF;text-decoration:none;font-size:14px;line-height:20px;font-weight:600;border-radius:6px;">${escapeEmailHtml(input.ctaLabel)} →</a></div>` : ""}
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px;border-top:1px solid #DADAD3;font-size:12px;line-height:18px;color:#9A9A94;">
                ${footerText}
                <div style="margin-top:12px;">
                  <a href="${absoluteUrl("/")}" style="color:#70706B;text-decoration:none;">BuildCrew</a>
                  <span style="color:#B0B0AA;"> · </span>
                  <a href="${absoluteUrl("/polityka-prywatnosci")}" style="color:#70706B;text-decoration:none;">Prywatność</a>
                  <span style="color:#B0B0AA;"> · </span>
                  <a href="${absoluteUrl("/regulamin")}" style="color:#70706B;text-decoration:none;">Regulamin</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  devPreview?: string;
  scheduledAt?: string;
  idempotencyKey?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "BuildCrew <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      const schedule = input.scheduledAt ? `\nScheduled: ${input.scheduledAt}` : "";
      console.log(`\n📨 [DEV EMAIL] To: ${input.to}\nSubject: ${input.subject}${schedule}\n${input.devPreview ?? ""}\n`);
      return { ok: true, dev: true, id: null, scheduled: Boolean(input.scheduledAt) } as const;
    }
    console.error("RESEND_API_KEY is missing in production; email was not sent.");
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" } as const;
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.scheduledAt ? { scheduled_at: input.scheduledAt } : {}),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Resend error", response.status, await response.text());
      return { ok: false, error: "SEND_FAILED" } as const;
    }

    const data = await response.json().catch(() => null) as { id?: string } | null;
    return {
      ok: true,
      dev: false,
      id: data?.id ?? null,
      scheduled: Boolean(input.scheduledAt),
    } as const;
  } catch (error) {
    console.error("Email send failed", error);
    return { ok: false, error: "SEND_FAILED" } as const;
  }
}

export async function cancelScheduledEmail(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!emailId) return { ok: false, error: "MISSING_EMAIL_ID" } as const;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`📨 [DEV EMAIL] Cancel scheduled email: ${emailId}`);
      return { ok: true, dev: true } as const;
    }
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" } as const;
  }

  try {
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(emailId)}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!response.ok) {
      // A scheduled message may have already been sent or canceled. Reading the
      // conversation must never fail because the provider can no longer cancel it.
      console.warn("Resend cancel scheduled email", response.status, await response.text());
      return { ok: false, error: "CANCEL_FAILED" } as const;
    }
    return { ok: true, dev: false } as const;
  } catch (error) {
    console.warn("Scheduled email cancel failed", error);
    return { ok: false, error: "CANCEL_FAILED" } as const;
  }
}
