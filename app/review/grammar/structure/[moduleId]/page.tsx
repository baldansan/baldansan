import Link from "next/link";
import { notFound } from "next/navigation";
import { HelzuiLegend } from "@/components/helzui/helzui-legend";
import { HelzuiModuleView } from "@/components/helzui/helzui-module-view";
import "@/components/helzui/helzui-course.css";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";
import {
  HELZUI_REVIEW_BASE,
  getHelzuiCourse,
  getHelzuiModule,
  helzuiModuleHref,
} from "@/lib/helzui/load-course";

type Props = {
  params: Promise<{ moduleId: string }>;
};

export async function generateStaticParams() {
  const course = getHelzuiCourse();
  return course.modules.map((module) => ({ moduleId: module.id }));
}

export async function generateMetadata({ params }: Props) {
  const { moduleId } = await params;
  const module = getHelzuiModule(moduleId);
  if (!module) return { title: "Модуль олдсонгүй" };
  return {
    title: `${module.mnTitle} — Өгүүлбэрийн бүтэц`,
  };
}

export default async function ReviewGrammarStructureModulePage({
  params,
}: Props) {
  const { moduleId } = await params;
  const course = getHelzuiCourse();
  const module = getHelzuiModule(moduleId);
  if (!module) notFound();

  const index = course.modules.findIndex((entry) => entry.id === moduleId);
  const prevModuleId = index > 0 ? course.modules[index - 1]?.id : null;
  const nextModuleId =
    index >= 0 && index < course.modules.length - 1
      ? course.modules[index + 1]?.id
      : null;

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_REVIEW}>
      <Link
        href={HELZUI_REVIEW_BASE}
        className="mb-3 inline-flex text-xs font-bold text-[#1FB85A]"
      >
        ← Модулууд
      </Link>
      <HelzuiLegend roleColors={course.roleColors} />
      <HelzuiModuleView
        module={module}
        roleColors={course.roleColors}
        prevModuleId={prevModuleId}
        nextModuleId={nextModuleId}
        moduleBase={HELZUI_REVIEW_BASE}
      />
    </MobileAppShell>
  );
}
