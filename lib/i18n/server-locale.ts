import { cookies } from "next/headers";
import { DEFAULT_UI_LOCALE, UI_LOCALE_COOKIE, isUiLocale, type UiLocale } from "./locale-types";

/** Сервер компонент/route-д UI хэлийг cookie-гоос уншина (байхгүй бол "zh"). */
export async function getServerUiLocale(): Promise<UiLocale> {
  try {
    const store = await cookies();
    const v = store.get(UI_LOCALE_COOKIE)?.value;
    return isUiLocale(v) ? v : DEFAULT_UI_LOCALE;
  } catch {
    return DEFAULT_UI_LOCALE;
  }
}
