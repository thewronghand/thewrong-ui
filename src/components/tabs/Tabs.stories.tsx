import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tabs } from "./Tabs";
import type { TabItem } from "./types";

const items: TabItem<string>[] = [
  { value: "overview", label: "개요", content: "개요 내용입니다." },
  { value: "disabled", label: "준비 중", content: "표시되지 않습니다.", disabled: true },
  { value: "activity", label: "활동", content: "최근 활동입니다." },
  { value: "settings", label: "설정", content: "설정을 변경하세요." },
];
const meta = { title: "Components/Tabs", component: Tabs, args: { items, "aria-label": "계정 메뉴" } } satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Automatic: Story = {};
export const Manual: Story = { args: { activation: "manual" } };
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("activity");
    return <Tabs items={items} value={value} onValueChange={setValue} aria-label="계정 메뉴" />;
  },
};
