import { redirect } from "next/navigation";

export default function PinyinGameRedirect() {
  redirect("/games/hsk-vocab-quiz?types=pinyin");
}
