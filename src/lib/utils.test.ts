/**
 * cn() 커스텀 그룹 테스트 — 커스텀 ↔ 표준 충돌을 양방향으로 확인한다.
 * 나중에 온 클래스가 이겨야 한다(tailwind-merge 정책).
 */
import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("비충돌 클래스 보존", () => {
  it("서로 다른 속성은 모두 남는다", () => {
    const result = cn(
      "rounded-control-medium",
      "h-control-medium",
      "bg-primary",
    );
    expect(result).toBe("rounded-control-medium h-control-medium bg-primary");
  });

  it("falsy 값은 무시된다", () => {
    expect(cn("bg-primary", undefined, false, "", null)).toBe("bg-primary");
  });

  it("서로 다른 커스텀 그룹끼리 지우지 않는다", () => {
    expect(cn("shadow-control", "z-overlay")).toBe("shadow-control z-overlay");
    expect(cn("gap-slot-medium", "px-control-pad-medium")).toBe(
      "gap-slot-medium px-control-pad-medium",
    );
    expect(
      cn("text-control-medium", "rounded-control-medium", "h-control-medium"),
    ).toBe("text-control-medium rounded-control-medium h-control-medium");
  });
});

describe("rounded", () => {
  it("커스텀 ↔ 표준 양방향", () => {
    expect(cn("rounded-control-medium", "rounded-full")).toBe("rounded-full");
    expect(cn("rounded-full", "rounded-control-medium")).toBe(
      "rounded-control-medium",
    );
  });

  it("커스텀끼리 나중이 이긴다", () => {
    expect(cn("rounded-control-small", "rounded-control-large")).toBe(
      "rounded-control-large",
    );
    expect(cn("rounded-surface", "rounded-badge")).toBe("rounded-badge");
    expect(cn("rounded-full", "rounded-chip")).toBe("rounded-chip");
    expect(cn("rounded-full", "rounded-circle")).toBe("rounded-circle");
    expect(cn("rounded-md", "rounded-tooltip")).toBe("rounded-tooltip");
  });
});

describe("rounded-t", () => {
  it("커스텀 ↔ 표준 양방향", () => {
    expect(cn("rounded-t-sheet", "rounded-t-lg")).toBe("rounded-t-lg");
    expect(cn("rounded-t-lg", "rounded-t-sheet")).toBe("rounded-t-sheet");
    expect(cn("rounded-t-lg", "rounded-t-control-mini")).toBe(
      "rounded-t-control-mini",
    );
  });

  it("rounded-sheet(전체)가 뒤에 오면 rounded-t-sheet를 덮는다", () => {
    expect(cn("rounded-t-sheet", "rounded-sheet")).toBe("rounded-sheet");
  });

  it("rounded-sheet가 앞에 오면 rounded-t-sheet는 남는다", () => {
    expect(cn("rounded-sheet", "rounded-t-sheet")).toBe(
      "rounded-sheet rounded-t-sheet",
    );
  });
});

describe("h · w · px · gap · size", () => {
  it("h 커스텀 ↔ 표준 양방향", () => {
    expect(cn("h-control-medium", "h-10")).toBe("h-10");
    expect(cn("h-10", "h-control-medium")).toBe("h-control-medium");
    expect(cn("h-slot-icon-medium", "h-5")).toBe("h-5");
    expect(cn("h-5", "h-slot-icon-medium")).toBe("h-slot-icon-medium");
    expect(cn("h-slot-icon-medium", "h-control-medium")).toBe(
      "h-control-medium",
    );
  });

  it("w 커스텀 ↔ 표준 양방향", () => {
    expect(cn("w-control-medium", "w-10")).toBe("w-10");
    expect(cn("w-10", "w-control-medium")).toBe("w-control-medium");
    expect(cn("w-slot-icon-medium", "w-5")).toBe("w-5");
  });

  it("px 커스텀 ↔ 표준 양방향", () => {
    expect(cn("px-control-pad-medium", "px-4")).toBe("px-4");
    expect(cn("px-4", "px-control-pad-medium")).toBe("px-control-pad-medium");
  });

  it("gap 커스텀 ↔ 표준 양방향", () => {
    expect(cn("gap-slot-medium", "gap-2")).toBe("gap-2");
    expect(cn("gap-2", "gap-slot-medium")).toBe("gap-slot-medium");
    expect(cn("gap-button-medium", "gap-2")).toBe("gap-2");
  });

  it("size 커스텀 ↔ 표준", () => {
    expect(cn("size-button-spinner-medium", "size-5")).toBe("size-5");
    expect(cn("size-5", "size-button-icon-small")).toBe(
      "size-button-icon-small",
    );
  });

  it("슬롯 자식 아이콘의 같은 변형에서도 나중 크기가 이긴다", () => {
    expect(cn("[&>svg]:h-slot-icon-mini", "[&>svg]:h-5")).toBe(
      "[&>svg]:h-5",
    );
    expect(cn("[&>svg]:w-5", "[&>svg]:w-slot-icon-mini")).toBe(
      "[&>svg]:w-slot-icon-mini",
    );
  });
});

describe("border · ring 폭 역할 — 색 역할과 함께 남는다", () => {
  it("border-control은 보더 색을 지우지 않는다", () => {
    expect(cn("border-control", "border-border-danger")).toBe(
      "border-control border-border-danger",
    );
    expect(cn("border-border-danger", "border-control")).toBe(
      "border-border-danger border-control",
    );
  });

  it("표준 border 폭만 폭 역할을 교체한다", () => {
    expect(cn("border-control border-border-danger", "border-2")).toBe(
      "border-border-danger border-2",
    );
    expect(cn("border-2 border-border-danger", "border-control")).toBe(
      "border-border-danger border-control",
    );
  });

  it("ring 폭 역할과 ring 색을 함께 남긴다", () => {
    expect(cn("focus:ring-button", "focus:ring-primary-border")).toBe(
      "focus:ring-button focus:ring-primary-border",
    );
    expect(cn("ring-control", "ring-focus-primary")).toBe(
      "ring-control ring-focus-primary",
    );
    expect(cn("ring-control", "ring-2")).toBe("ring-2");
    expect(
      cn("focus-visible:ring-button", "focus-visible:ring-focus-primary"),
    ).toBe("focus-visible:ring-button focus-visible:ring-focus-primary");
    expect(cn("focus-visible:ring-button", "focus-visible:ring-4")).toBe(
      "focus-visible:ring-4",
    );
    expect(cn("border-button", "border-error")).toBe(
      "border-button border-error",
    );
    expect(cn("border-error", "border-button")).toBe(
      "border-error border-button",
    );
    expect(cn("border-button", "border-2")).toBe("border-2");
  });
});

describe("모션 · opacity · font-size · shadow · z", () => {
  it("모션·opacity 역할은 표준과 충돌한다", () => {
    expect(cn("duration-button", "duration-300")).toBe("duration-300");
    expect(cn("ease-button", "ease-in")).toBe("ease-in");
    expect(cn("opacity-button-loading-label", "opacity-100")).toBe(
      "opacity-100",
    );
    expect(cn("animate-button-spinner", "animate-pulse")).toBe("animate-pulse");
    expect(cn("animate-pulse", "animate-button-spinner")).toBe(
      "animate-button-spinner",
    );
  });

  it("버튼 폰트 역할은 다른 폰트 계열과 충돌한다", () => {
    expect(cn("font-control-action", "font-sans")).toBe("font-sans");
    expect(cn("font-sans", "font-control-action")).toBe("font-control-action");
  });

  it("font-size 커스텀 ↔ 표준 양방향", () => {
    expect(cn("text-control-medium", "text-sm")).toBe("text-sm");
    expect(cn("text-sm", "text-control-medium")).toBe("text-control-medium");
    expect(cn("text-control-medium", "text-slot-badge-medium")).toBe(
      "text-slot-badge-medium",
    );
  });

  it("font-size 역할은 텍스트 색을 지우지 않는다", () => {
    expect(cn("text-control-medium", "text-fg-default")).toBe(
      "text-control-medium text-fg-default",
    );
  });

  it("shadow 커스텀 ↔ 표준 양방향", () => {
    expect(cn("shadow-control", "shadow-md")).toBe("shadow-md");
    expect(cn("shadow-md", "shadow-control")).toBe("shadow-control");
    expect(cn("shadow-control", "shadow-overlay")).toBe("shadow-overlay");
  });

  it("z 커스텀 ↔ 표준 양방향", () => {
    expect(cn("z-overlay", "z-10")).toBe("z-10");
    expect(cn("z-10", "z-overlay")).toBe("z-overlay");
    expect(cn("z-overlay", "z-floating")).toBe("z-floating");
    expect(cn("z-toast-backdrop", "z-toast")).toBe("z-toast");
  });
});
