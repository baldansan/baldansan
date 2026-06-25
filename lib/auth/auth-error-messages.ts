import type { AuthError } from "@supabase/supabase-js";

export const EMAIL_NOT_CONFIRMED_MESSAGE =
  "Имэйл хаягаа баталгаажуулаагүй байна. Бүртгүүлсэн имэйл хаягаараа орж, бидний явуулсан баталгаажуулах холбоос дээр дарна уу. Имэйл ирээгүй бол Spam/Junk хавтсаа шалгаарай.";

export const RESEND_CONFIRMATION_SUCCESS_MESSAGE =
  "Баталгаажуулах имэйл дахин илгээлээ. Inbox болон Spam/Junk хавтсаа шалгаарай.";

type AuthErrorLike = Pick<AuthError, "message" | "code"> | string | null | undefined;

function getErrorParts(error: AuthErrorLike): { message: string; code: string } {
  if (!error) {
    return { message: "", code: "" };
  }
  if (typeof error === "string") {
    return { message: error, code: "" };
  }
  return {
    message: error.message ?? "",
    code: (error.code ?? "").toLowerCase(),
  };
}

export function isEmailNotConfirmedError(error: AuthErrorLike): boolean {
  const { message, code } = getErrorParts(error);
  const normalized = message.toLowerCase();
  return (
    code === "email_not_confirmed" ||
    normalized.includes("email not confirmed")
  );
}

export function mapAuthErrorMessage(error: AuthErrorLike): string | null {
  if (!error) {
    return null;
  }

  const { message, code } = getErrorParts(error);
  if (!message) {
    return null;
  }

  if (isEmailNotConfirmedError(error)) {
    return EMAIL_NOT_CONFIRMED_MESSAGE;
  }

  const normalized = message.toLowerCase();

  if (
    code === "invalid_credentials" ||
    normalized.includes("invalid login credentials")
  ) {
    return "Имэйл эсвэл нууц үг буруу байна.";
  }

  if (
    code === "user_already_exists" ||
    normalized.includes("user already registered")
  ) {
    return "Энэ имэйлээр бүртгэл аль хэдийн байна.";
  }

  if (
    normalized.includes("password should be at least") ||
    normalized.includes("password is too short")
  ) {
    return "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.";
  }

  if (
    normalized.includes("invalid format") ||
    normalized.includes("unable to validate email")
  ) {
    return "Имэйл хаяг буруу байна.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    normalized.includes("email rate limit exceeded") ||
    normalized.includes("rate limit")
  ) {
    return "Хэт олон хүсэлт илгээлээ. Хэсэг хугацааны дараа дахин оролдоно уу.";
  }

  if (normalized.includes("signups not allowed")) {
    return "Одоогоор шинэ бүртгэл хүлээн авахгүй байна.";
  }

  if (normalized.includes("user is banned") || code === "user_banned") {
    return "Энэ бүртгэл түр хориглогдсон байна.";
  }

  if (normalized.includes("auth session check timed out")) {
    return "Нэвтрэх шалгалт хэт удаж байна. Дахин оролдоно уу.";
  }

  if (normalized.includes("auth request failed")) {
    return "Холболтын алдаа. Дахин оролдоно уу.";
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Сүлжээний алдаа. Интернэт холболтоо шалгаад дахин оролдоно уу.";
  }

  return message;
}
