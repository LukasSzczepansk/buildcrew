import "server-only";

import { absoluteUrl, escapeEmailHtml } from "@/lib/email";
import { siteUrlForLocale } from "@/lib/site-config";

export function buildPremieryAnnouncementEmail(locale: "pl" | "en") {
  const en = locale === "en";
  const baseUrl = siteUrlForLocale(locale);
  const ctaUrl = absoluteUrl("/launches/new", baseUrl);
  const profileUrl = absoluteUrl("/profile", baseUrl);
  const homeUrl = absoluteUrl("/", baseUrl);

  const copy = en
    ? {
        subject: "New in BuildCrew — Launches 🚀",
        badge: "NEW IN BUILDCREW",
        title: "New in BuildCrew — Launches 🚀",
        intro: "Got a project, app, website, game, SaaS, or something you're still working on?",
        body: "You can now share it in Launches, collect feedback, find testers, first users, or people to keep building with.",
        note: "Your project does not have to be finished or created on BuildCrew.",
        cta: "Show your project",
        feedback: "Get feedback",
        testers: "Find testers",
        people: "Meet collaborators",
        footer: "You received this product update because email digests are enabled for your BuildCrew account. You can change email preferences in your profile.",
        settings: "Email settings",
      }
    : {
        subject: "Nowość w BuildCrew — Premiery 🚀",
        badge: "NOWOŚĆ W BUILDCREW",
        title: "Nowość w BuildCrew — Premiery 🚀",
        intro: "Masz projekt, aplikację, stronę, grę, SaaS albo coś, nad czym dopiero pracujesz?",
        body: "Od teraz możesz pokazać to w Premierach, zebrać feedback, znaleźć testerów, pierwszych użytkowników albo osoby do dalszej współpracy.",
        note: "Projekt nie musi być skończony ani stworzony na BuildCrew.",
        cta: "Pokaż swój projekt",
        feedback: "Zbierz feedback",
        testers: "Znajdź testerów",
        people: "Poznaj ludzi",
        footer: "Otrzymujesz tę aktualizację produktu, ponieważ masz włączone e-mailowe podsumowania BuildCrew. Ustawienia e-mail możesz zmienić w swoim profilu.",
        settings: "Ustawienia e-mail",
      };

  const html = `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeEmailHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F3F3ED;color:#151515;font-family:Inter,Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailHtml(copy.intro)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F3F3ED;">
    <tr>
      <td align="center" style="padding:42px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;">
          <tr>
            <td style="padding:0 4px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <a href="${homeUrl}" style="display:inline-flex;align-items:center;text-decoration:none;color:#151515;">
                      <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;background:#151515;color:#FFFFFF;border-radius:9px;font-size:11px;font-weight:800;letter-spacing:-0.3px;">BC</span>
                      <span style="display:inline-block;margin-left:10px;font-size:17px;line-height:34px;font-weight:700;letter-spacing:-0.3px;">BuildCrew</span>
                    </a>
                  </td>
                  <td align="right" valign="middle" style="font-size:11px;line-height:16px;color:#8A8A82;">buildcreww.pl</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#FFFFFF;border:1px solid #DCDCD4;border-radius:18px;overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="height:7px;background:#C8F169;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:38px 34px 8px;">
                    <span style="display:inline-block;padding:6px 9px;background:#F1F8DF;border:1px solid #D9EAB5;border-radius:999px;font-size:10px;line-height:12px;font-weight:800;letter-spacing:1.1px;color:#617D19;">${escapeEmailHtml(copy.badge)}</span>
                    <h1 style="margin:18px 0 0;font-size:34px;line-height:40px;font-weight:750;letter-spacing:-1.15px;color:#151515;">${escapeEmailHtml(copy.title)}</h1>
                    <p style="margin:16px 0 0;font-size:16px;line-height:25px;color:#4E4E49;">${escapeEmailHtml(copy.intro)}</p>
                    <p style="margin:12px 0 0;font-size:16px;line-height:25px;color:#4E4E49;">${escapeEmailHtml(copy.body)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 34px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:8px 0;margin-left:-8px;">
                      <tr>
                        <td width="33.33%" style="padding:14px 12px;background:#F7F7F2;border:1px solid #E2E2DA;border-radius:10px;font-size:12px;line-height:17px;font-weight:700;color:#343430;">↗&nbsp; ${escapeEmailHtml(copy.feedback)}</td>
                        <td width="33.33%" style="padding:14px 12px;background:#F7F7F2;border:1px solid #E2E2DA;border-radius:10px;font-size:12px;line-height:17px;font-weight:700;color:#343430;">◎&nbsp; ${escapeEmailHtml(copy.testers)}</td>
                        <td width="33.33%" style="padding:14px 12px;background:#F7F7F2;border:1px solid #E2E2DA;border-radius:10px;font-size:12px;line-height:17px;font-weight:700;color:#343430;">＋&nbsp; ${escapeEmailHtml(copy.people)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px 34px 36px;">
                    <p style="margin:0 0 20px;padding:14px 16px;background:#FBFBF7;border-left:3px solid #C8F169;font-size:13px;line-height:20px;color:#65655F;">${escapeEmailHtml(copy.note)}</p>
                    <a href="${ctaUrl}" style="display:inline-block;padding:13px 20px;background:#C8F169;border:1px solid #B6DD54;border-radius:8px;color:#151515;text-decoration:none;font-size:14px;line-height:20px;font-weight:800;">${escapeEmailHtml(copy.cta)} →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 6px 0;text-align:center;font-size:11px;line-height:18px;color:#92928A;">
              ${escapeEmailHtml(copy.footer)}<br>
              <a href="${profileUrl}" style="color:#65655F;text-decoration:underline;">${escapeEmailHtml(copy.settings)}</a>
              <span style="color:#B3B3AC;"> · </span>
              <a href="${homeUrl}" style="color:#65655F;text-decoration:none;">BuildCrew</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    copy.subject,
    "",
    copy.intro,
    "",
    copy.body,
    "",
    copy.note,
    "",
    `${copy.cta}: ${ctaUrl}`,
    "",
    copy.footer,
    `${copy.settings}: ${profileUrl}`,
  ].join("\n");

  return { subject: copy.subject, html, text };
}
