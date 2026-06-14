"use client";

import Link from "next/link";
import { HelzuiExamItem } from "@/components/helzui/helzui-exam-item";
import { HelzuiRichHtml } from "@/components/helzui/helzui-rich-html";
import { HelzuiSectionDivider } from "@/components/helzui/helzui-section-divider";
import { TemeeImage } from "@/components/temee/temee-image";
import { helzuiModuleHref } from "@/lib/helzui/load-course";
import type { HelzuiModule, HelzuiRoleColors } from "@/types/helzui-course";

type Props = {
  module: HelzuiModule;
  roleColors: HelzuiRoleColors;
  prevModuleId?: string | null;
  nextModuleId?: string | null;
  moduleBase?: string;
};

export function HelzuiModuleView({
  module,
  roleColors,
  prevModuleId,
  nextModuleId,
  moduleBase,
}: Props) {
  return (
    <div className="hz-module">
      <div className="hz-mod-eyebrow">
        <span className="hz-mod-num">{module.number}</span>
        {module.mnTitle}
        <span className="hz-mod-pin zh">
          · {module.zh} {module.pinyin}
        </span>
      </div>
      <h1 className="hz-mod-heading">{module.heading}</h1>

      <div className="hz-teacher">
        <TemeeImage variant="think" className="hz-ava" width={36} height={36} />
        <div>
          <p className="hz-t-name">Тэмээ багш</p>
          <p className="hz-t-txt">{module.teacher}</p>
        </div>
      </div>

      <div className="hz-block">
        <div className="hz-block-h">
          <span className="hz-block-ic">💡</span>
          {module.concept.title}
        </div>
        {module.concept.rules.map((rule, index) => (
          <div key={index} className="hz-rule">
            <HelzuiRichHtml html={rule.text} as="span" />
            {rule.eg ? (
              <span className="hz-rule-eg">
                <HelzuiRichHtml html={rule.eg} as="span" />
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {module.patterns && module.patterns.items.length > 0 ? (
        <div className="hz-patterns">
          <div className="hz-patterns-h">
            <span className="hz-block-ic">🧩</span>
            {module.patterns.title}
          </div>
          <div className="hz-pat-grid">
            {module.patterns.items.map((row) => (
              <div key={row.zh} className="hz-pat">
                <span className="hz-pat-z zh">{row.zh}</span>
                <span className="hz-pat-m">{row.mn}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {module.marker.length > 0 ? (
        <div className="hz-block hz-marker">
          <div className="hz-block-h hz-marker-h">
            <span className="hz-block-ic">🔎</span>
            Тэмдэг үг
          </div>
          {module.marker.map((line, index) => (
            <div key={index} className="hz-rule">
              <HelzuiRichHtml html={line} as="span" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="hz-block hz-algo">
        <div className="hz-block-h">
          <span className="hz-block-ic">🧭</span>
          Бодох алгоритм
        </div>
        {module.algorithm.map((step, index) => (
          <div key={index} className="hz-algo-step">
            <span className="hz-algo-n">{index + 1}</span>
            <HelzuiRichHtml html={step} as="div" />
          </div>
        ))}
      </div>

      {module.realExams.length > 0 ? (
        <>
          <HelzuiSectionDivider
            title="📘 真题 演练"
            count={`${module.realExams.length} даалгавар`}
          />
          {module.realExams.map((item, index) => (
            <HelzuiExamItem
              key={item.id}
              item={item}
              index={index}
              variant="real"
              moduleId={module.id}
              roleColors={roleColors}
            />
          ))}
        </>
      ) : null}

      {module.practice.length > 0 ? (
        <>
          <HelzuiSectionDivider
            title="✍️ 完成句子"
            count={`${module.practice.length} дасгал · өөрөө бод`}
          />
          {module.practice.map((item, index) => (
            <HelzuiExamItem
              key={item.id}
              item={item}
              variant="practice"
              index={index}
              moduleId={module.id}
              roleColors={roleColors}
            />
          ))}
        </>
      ) : null}

      {module.collocations.length > 0 ? (
        <>
          <HelzuiSectionDivider title="🔗 Хослол бичих" />
          <div className="hz-colloc">
            <div className="hz-colloc-h">
              <span className="hz-block-ic">🔗</span>
              Тохирох хослолыг санаж ав
            </div>
            {module.collocations.map((row, index) => (
              <div key={index} className="hz-colloc-ci">
                <span className="zh hz-colloc-head">{row.head}</span>
                <span className="hz-colloc-a">
                  <HelzuiRichHtml html={row.options} as="span" />
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <nav className="hz-module-nav">
        {prevModuleId ? (
          <Link href={helzuiModuleHref(prevModuleId, moduleBase)} className="hz-nav-link">
            ← Өмнөх модуль
          </Link>
        ) : (
          <span />
        )}
        {nextModuleId ? (
          <Link
            href={helzuiModuleHref(nextModuleId, moduleBase)}
            className="hz-nav-link hz-nav-link--next"
          >
            Дараагийн модуль →
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
