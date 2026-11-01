import "server-only";
import { Resend } from "resend";

export type Channel = "email" | "sms" | "whatsapp";

export type MessageInput = {
  channel: Channel;
  recipient: string;
  message: string;
  subject?: string;
  html?: string;
  replyTo?: string;
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character);
}

export function brandedEmail(input: { preheader: string; eyebrow?: string; title: string; body: string; cta?: { label: string; url: string } }): string {
  const appUrl = process.env.EMAIL_ASSET_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://dukapos-theta.vercel.app";
  const logoUrl = `${appUrl.replace(/\/$/, "")}/images/DukaOS-logo2.png`;
  return `<!doctype html><html lang="en"><head><meta name="x-apple-disable-message-reformatting"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;background:#eef4f3;color:#102b4e;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f3;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d9e5e2;border-radius:12px;overflow:hidden"><tr><td style="height:6px;background:#16c79a;font-size:0;line-height:0">&nbsp;</td></tr><tr><td style="padding:28px 32px 20px;text-align:center;background:#f8fbfa"><img src="${escapeHtml(logoUrl)}" width="230" alt="DukaOS" style="display:block;width:230px;max-width:100%;height:auto;margin:0 auto;border:0"><p style="margin:16px 0 0;color:#5e716f;font-size:12px;letter-spacing:1.6px;text-transform:uppercase">Run your business, simply.</p></td></tr><tr><td style="padding:36px 36px 32px"><p style="margin:0 0 10px;color:#16a97f;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(input.eyebrow ?? "DukaOS")}</p><h1 style="margin:0 0 18px;color:#102b4e;font-size:28px;line-height:1.2;font-weight:700">${escapeHtml(input.title)}</h1><div style="color:#4e6261;font-size:16px;line-height:1.7">${input.body}</div>${input.cta ? `<p style="margin:28px 0 4px"><a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:#102b4e;color:#ffffff;text-decoration:none;border-radius:6px;padding:13px 22px;font-size:14px;font-weight:bold">${escapeHtml(input.cta.label)}</a></p><p style="margin:14px 0 0;color:#7a8987;font-size:12px;line-height:1.6;word-break:break-all">If the button does not work, copy this link:<br>${escapeHtml(input.cta.url)}</p>` : ""}</td></tr><tr><td style="padding:20px 36px;border-top:1px solid #e6eeec;color:#80908e;font-size:12px;line-height:1.6;text-align:center">DukaOS &middot; POS, inventory and business management<br>This is an automated message. Please do not reply unless a reply address is provided.</td></tr></table></td></tr></table></body></html>`;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function assertResponse(response: Response, provider: string): Promise<void> {
  if (response.ok) return;
  const detail = (await response.text()).slice(0, 300);
  throw new Error(`${provider} rejected the message (${response.status}).${detail ? ` ${detail}` : ""}`);
}

async function sendEmailProvider(input: MessageInput): Promise<{ id: string } | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || requireEnv("EMAIL_API_KEY");
  const from = process.env.EMAIL_FROM?.trim() || "DukaOS <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || input.replyTo;
  const html = input.html ?? brandedEmail({
    preheader: input.subject ?? "A new message from DukaOS.",
    title: input.subject ?? "DukaOS notification",
    body: `<p style="margin:0;white-space:pre-line">${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`,
  });
  const { data, error } = await new Resend(apiKey).emails.send({
    from,
    to: [input.recipient],
    subject: input.subject ?? "DukaOS notification",
    text: input.message,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) throw new Error(`Email provider rejected the message: ${error.message}`);
  return data?.id ? { id: data.id } : null;
}

async function sendSms(input: MessageInput): Promise<void> {
  const apiKey = requireEnv("SMS_API_KEY");
  const username = requireEnv("SMS_USERNAME");
  const body = new URLSearchParams({ username, to: input.recipient, message: input.message });
  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  await assertResponse(response, "SMS provider");
}

async function sendWhatsApp(input: MessageInput): Promise<void> {
  const token = requireEnv("WHATSAPP_API_KEY");
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
  const response = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: input.recipient, type: "text", text: { preview_url: false, body: input.message } }),
  });
  await assertResponse(response, "WhatsApp provider");
}

export async function sendEmail(input: Omit<MessageInput, "channel">): Promise<{ id: string } | null> {
  return sendEmailProvider({ ...input, channel: "email" });
}

export async function sendSMS(input: Omit<MessageInput, "channel">): Promise<void> {
  return sendSms({ ...input, channel: "sms" });
}

export async function sendWhatsAppMessage(input: Omit<MessageInput, "channel">): Promise<void> {
  return sendWhatsApp({ ...input, channel: "whatsapp" });
}

export async function sendMessage(input: MessageInput): Promise<void> {
  if (input.channel === "email") {
    await sendEmailProvider(input);
    return;
  }
  if (input.channel === "sms") return sendSms(input);
  return sendWhatsApp(input);
}