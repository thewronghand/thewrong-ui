import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Tabs } from "./Tabs";

describe("Tabs 컴포넌트", () => {
  it("선택 탭과 패널을 연결하고 비선택 패널은 숨긴다", () => {
    const markup = renderToStaticMarkup(createElement(Tabs, {
      "aria-label": "화면",
      defaultValue: "second",
      items: [
        { value: "first", label: "첫째", content: "첫째 내용" },
        { value: "second", label: "둘째", content: "둘째 내용" },
        { value: "third", label: "셋째", content: "셋째 내용", disabled: true },
      ],
    }));
    expect(markup).toMatch(/role="tablist"[^>]*aria-label="화면"/);
    const tabs = [...markup.matchAll(/<button\b([^>]*)>(.*?)<\/button>/g)];
    const panels = [...markup.matchAll(/<div role="tabpanel"([^>]*)>(.*?)<\/div>/g)];
    expect(tabs).toHaveLength(3);
    expect(panels).toHaveLength(3);
    expect(tabs[1]![1]).toContain('aria-selected="true"');
    expect(tabs[1]![1]).toContain("border-primary-fg");
    expect(tabs[1]![1]).toContain('tabindex="0"');
    expect(tabs[2]![1]).toContain("disabled");
    for (let i = 0; i < tabs.length; i++) {
      const tabId = tabs[i]![1]!.match(/id="([^"]+)"/)?.[1];
      const panelId = tabs[i]![1]!.match(/aria-controls="([^"]+)"/)?.[1];
      expect(panels[i]![1]).toContain(`id="${panelId}"`);
      expect(panels[i]![1]).toContain(`aria-labelledby="${tabId}"`);
      if (i === 1) {
        expect(panels[i]![1]).not.toContain("hidden");
        expect(panels[i]![2]).toContain("둘째 내용");
      } else {
        expect(panels[i]![1]).toContain("hidden");
        expect(panels[i]![2]).not.toContain("내용");
      }
    }
  });
});
