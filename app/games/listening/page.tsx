import { redirect } from "next/navigation";

/** «Сонсоод ол» — vocab quiz-ийн listening preset рүү чиглүүлнэ. */
export default function ListeningGameRedirect() {
  redirect("/games/hsk-vocab-quiz?types=listening");
}
