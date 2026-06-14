"use client";

import type { CSSProperties } from "react";
import { roleColor } from "@/lib/helzui/role-colors";
import type { AnswerBlock, HelzuiRoleColors } from "@/types/helzui-course";

type Props = {
  blocks: AnswerBlock[];
  roleColors: HelzuiRoleColors;
};

export function HelzuiAnswerBlocks({ blocks, roleColors }: Props) {
  return (
    <div className="hz-built" role="list">
      {blocks.map((block, index) => {
        const def = roleColor(roleColors, block.role);
        const isPred = block.role === "pred" || def.isHeart;
        const roleLabel = block.label ?? def.label;

        if (isPred) {
          return (
            <div
              key={`${block.w}-${index}`}
              className="hz-blk hz-blk--verb"
              role="listitem"
              style={{ backgroundColor: def.color, borderColor: def.color }}
            >
              <span className="hz-blk-w zh">{block.w}</span>
              <span className="hz-blk-r">{roleLabel}</span>
            </div>
          );
        }

        return (
          <div
            key={`${block.w}-${index}`}
            className="hz-blk"
            role="listitem"
            style={
              {
                "--bk": def.color,
              } as CSSProperties
            }
          >
            <span className="hz-blk-w zh">{block.w}</span>
            <span className="hz-blk-r">{roleLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
