import { redirect } from "next/navigation";

// Хуучин нийтэд нээлттэй шалгах хуудас — одоо зөвхөн админы «Системийн шалгалт»-аар харна.
export default function DeploymentCheckPage() {
  redirect("/admin/system-check");
}
