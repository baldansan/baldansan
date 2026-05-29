export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  provider?: string;
  error?: string;
};

export type EmailProviderStatus = {
  configured: boolean;
  provider: string | null;
  from: string | null;
  message: string;
};

function getFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "Buunduu Surtsgaay <noreply@baldansan.vercel.app>";
}

export function isEmailProviderConfigured(): boolean {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (!provider) return false;
  if (provider === "mock") return true;
  if (provider === "resend") return Boolean(process.env.RESEND_API_KEY?.trim());
  return false;
}

export function getEmailProviderStatus(): EmailProviderStatus {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || null;
  const configured = isEmailProviderConfigured();
  return {
    configured,
    provider,
    from: configured ? getFromAddress() : null,
    message: configured
      ? `Email provider "${provider}" is configured.`
      : "Email provider not configured. Use manual copy-link fallback.",
  };
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      skipped: true,
      reason: "RESEND_API_KEY not configured.",
      provider: "resend",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        provider: "resend",
        error: `Resend API ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    return { ok: true, provider: "resend" };
  } catch (e) {
    return {
      ok: false,
      provider: "resend",
      error: e instanceof Error ? e.message : "Resend request failed.",
    };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (!provider) {
    return {
      ok: false,
      skipped: true,
      reason: "Email provider not configured",
      provider: "manual",
    };
  }

  if (provider === "mock") {
    return { ok: true, provider: "mock" };
  }

  if (provider === "resend") {
    return sendViaResend(input);
  }

  return {
    ok: false,
    skipped: true,
    reason: `Unknown EMAIL_PROVIDER: ${provider}`,
    provider,
  };
}
