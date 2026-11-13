import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";

/**
 * 시맨틱 토큰 확인용 페이지 — 새 토큰이 실제로 유틸리티를 생성하는지 눈으로 본다.
 *
 * 같은 내용을 현재 툴바 모드 패널과 `.dark` 패널에 나란히 그린다. 다크 패널은 페이지 루트가 아니라
 * 하위 요소에 `.dark`를 붙인 것이라, 임의 조상의 `.dark`로 토큰이 뒤집히는지도 함께 확인된다.
 *
 * Tailwind는 소스의 문자열을 그대로 찾으므로 클래스는 조합하지 않고 리터럴로 적는다.
 */

type Swatch = { name: string; className: string };

const COLOR_GROUPS: { title: string; items: Swatch[] }[] = [
  {
    title: "브랜드",
    items: [
      { name: "primary", className: "bg-primary" },
      { name: "primary-hover", className: "bg-primary-hover" },
      { name: "primary-active", className: "bg-primary-active" },
      { name: "primary-subtle", className: "bg-primary-subtle" },
      { name: "primary-border", className: "bg-primary-border" },
      { name: "focus-primary", className: "bg-focus-primary" },
    ],
  },
  {
    title: "배경",
    items: [
      { name: "bg-page", className: "bg-bg-page" },
      { name: "bg-surface", className: "bg-bg-surface" },
      { name: "bg-faint", className: "bg-bg-faint" },
      { name: "bg-subtle", className: "bg-bg-subtle" },
      { name: "bg-muted", className: "bg-bg-muted" },
      { name: "bg-overlay", className: "bg-bg-overlay" },
      { name: "bg-handle", className: "bg-bg-handle" },
      { name: "bg-tooltip", className: "bg-bg-tooltip" },
      { name: "bg-toast", className: "bg-bg-toast" },
    ],
  },
  {
    title: "전경",
    items: [
      { name: "fg-default", className: "bg-fg-default" },
      { name: "fg-accent", className: "bg-fg-accent" },
      { name: "fg-muted", className: "bg-fg-muted" },
      { name: "fg-subtle", className: "bg-fg-subtle" },
      { name: "fg-disabled", className: "bg-fg-disabled" },
      { name: "fg-danger", className: "bg-fg-danger" },
    ],
  },
  {
    title: "경계선",
    items: [
      { name: "border-default", className: "bg-border-default" },
      { name: "border-subtle", className: "bg-border-subtle" },
      { name: "border-faint", className: "bg-border-faint" },
      { name: "focus-danger", className: "bg-focus-danger" },
    ],
  },
  {
    title: "상태",
    items: [
      { name: "success", className: "bg-success" },
      { name: "success-subtle", className: "bg-success-subtle" },
      { name: "success-fg", className: "bg-success-fg" },
      { name: "warning", className: "bg-warning" },
      { name: "warning-subtle", className: "bg-warning-subtle" },
      { name: "warning-fg", className: "bg-warning-fg" },
      { name: "error", className: "bg-error" },
      { name: "error-subtle", className: "bg-error-subtle" },
      { name: "error-fg", className: "bg-error-fg" },
      { name: "info", className: "bg-info" },
      { name: "info-subtle", className: "bg-info-subtle" },
      { name: "info-fg", className: "bg-info-fg" },
      { name: "neutral-fill", className: "bg-neutral-fill" },
      { name: "neutral-subtle", className: "bg-neutral-subtle" },
      { name: "neutral-fg", className: "bg-neutral-fg" },
    ],
  },
  {
    title: "테이블",
    items: [
      { name: "table-header", className: "bg-bg-table-header" },
      { name: "table-row-even", className: "bg-bg-table-row-even" },
      { name: "table-row-odd", className: "bg-bg-table-row-odd" },
      { name: "table-row-hover", className: "bg-bg-table-row-hover" },
      { name: "table-row-selected", className: "bg-bg-table-row-selected" },
    ],
  },
];

const RADII: Swatch[] = [
  { name: "control-mini", className: "rounded-control-mini" },
  { name: "control-small", className: "rounded-control-small" },
  { name: "control-medium", className: "rounded-control-medium" },
  { name: "control-large", className: "rounded-control-large" },
  { name: "surface", className: "rounded-surface" },
  { name: "badge", className: "rounded-badge" },
  { name: "checkbox", className: "rounded-checkbox" },
  { name: "tooltip", className: "rounded-tooltip" },
  { name: "toast", className: "rounded-toast" },
  { name: "sheet", className: "rounded-sheet" },
  { name: "chip", className: "rounded-chip" },
];

const CONTROLS: Swatch[] = [
  {
    name: "mini · 28px",
    className:
      "h-control-mini px-control-pad-mini text-control-mini rounded-control-mini",
  },
  {
    name: "small · 36px",
    className:
      "h-control-small px-control-pad-small text-control-small rounded-control-small",
  },
  {
    name: "medium · 44px",
    className:
      "h-control-medium px-control-pad-medium text-control-medium rounded-control-medium",
  },
  {
    name: "large · 48px",
    className:
      "h-control-large px-control-pad-large text-control-large rounded-control-large",
  },
];

const SHADOWS: Swatch[] = [
  { name: "shadow-control", className: "shadow-control" },
  { name: "shadow-surface", className: "shadow-surface" },
  { name: "shadow-overlay", className: "shadow-overlay" },
  { name: "shadow-tooltip", className: "shadow-tooltip" },
];

const Z_LAYERS: Swatch[] = [
  { name: "z-overlay (50)", className: "z-overlay" },
  { name: "z-toast-backdrop (60)", className: "z-toast-backdrop" },
  { name: "z-floating (100)", className: "z-floating" },
  { name: "z-toast (150)", className: "z-toast" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-fg-default">{title}</h3>
      {children}
    </section>
  );
}

function TokenSheet() {
  return (
    <div className="flex flex-col gap-6 bg-bg-page p-6 font-body-default text-fg-default">
      {COLOR_GROUPS.map((group) => (
        <Section key={group.title} title={group.title}>
          <div className="grid grid-cols-3 gap-2">
            {group.items.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-xs text-fg-muted"
              >
                <span
                  className={`size-6 shrink-0 rounded-badge border border-border-subtle ${item.className}`}
                />
                {item.name}
              </div>
            ))}
          </div>
        </Section>
      ))}

      <Section title="반경">
        <div className="flex flex-wrap gap-3">
          {RADII.map((item) => (
            <div
              key={item.name}
              className={`flex h-12 w-24 items-center justify-center border border-border-default bg-bg-subtle text-xs text-fg-muted ${item.className}`}
            >
              {item.name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="컨트롤 높이 · 패딩 · 글자">
        <div className="flex flex-wrap items-end gap-3">
          {CONTROLS.map((item) => (
            <div
              key={item.name}
              className={`flex items-center border border-border-default bg-bg-surface font-control-field text-fg-default ${item.className}`}
            >
              {item.name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="그림자">
        <div className="flex flex-wrap gap-4">
          {SHADOWS.map((item) => (
            <div
              key={item.name}
              className={`flex h-16 w-32 items-center justify-center rounded-surface bg-bg-surface text-xs text-fg-muted ${item.className}`}
            >
              {item.name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="z 계층 (뒤로 갈수록 위)">
        <div className="relative h-28">
          {Z_LAYERS.map((item, i) => (
            <div
              key={item.name}
              style={{ left: i * 40, top: i * 16 }}
              className={`absolute flex h-12 w-44 items-center rounded-surface border border-border-default bg-bg-surface px-3 text-xs text-fg-default shadow-surface ${item.className}`}
            >
              {item.name}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const meta: Meta = {
  title: "시작하기/토큰",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "시맨틱 토큰 이름과 스와치. 첫 번째 패널은 툴바에서 선택한 모드, 두 번째는 하위 요소에 `.dark`를 붙인 다크다. 컴포넌트는 아직 옛 이름을 쓰며 3단계에서 이 토큰으로 옮긴다.",
      },
    },
  },
};

export default meta;

export const 시맨틱_토큰: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2">
      <TokenSheet />
      <div className="dark">
        <TokenSheet />
      </div>
    </div>
  ),
};
