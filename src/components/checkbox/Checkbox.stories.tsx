import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Radio } from "@/components/radio";
import { SegmentedControl } from "@/components/segmented-control";
import { Switch } from "@/components/switch";
import { TableCheckbox } from "@/components/table-checkbox";
import {
  CheckboxCircle,
  CheckboxLine,
  CheckboxLineTransparent,
} from "./Checkbox";

const meta = {
  title: "Components/Checkbox",
  component: CheckboxCircle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: { control: { type: "number" } },
    baseColor: {
      control: "select",
      options: ["primary", "secondary", "neutral"],
    },
    label: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof CheckboxCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "약관에 동의합니다",
    defaultChecked: true,
    baseColor: "primary",
    size: 24,
  },
};

export const AllVariants: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <CheckboxCircle checked={checked} onCheckedChange={setChecked} />
          <span className="text-xs text-fg-muted">Circle</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CheckboxLine checked={checked} onCheckedChange={setChecked} />
          <span className="text-xs text-fg-muted">Line</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <CheckboxLineTransparent
            checked={checked}
            onCheckedChange={setChecked}
          />
          <span className="text-xs text-fg-muted">LineTransparent</span>
        </div>
      </div>
    );
  },
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <CheckboxCircle baseColor="primary" defaultChecked label="primary" />
      <CheckboxCircle baseColor="secondary" defaultChecked label="secondary" />
      <CheckboxCircle baseColor="neutral" defaultChecked label="neutral" />
    </div>
  ),
};

export const IndeterminateInteractive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    const [partial, setPartial] = useState(true);
    return (
      <TableCheckbox
        checked={checked}
        indeterminate={partial}
        ariaLabel="부분 선택 가능"
        onChange={(next) => {
          setChecked(next);
          setPartial(false);
        }}
      />
    );
  },
};

/** prop과 fieldset으로 비활성화한 같은 컨트롤을 함께 비교한다. */
export const DisabledPaths: Story = {
  render: () => {
    const options = [
      { value: "a", label: "선택" },
      { value: "b", label: "미선택" },
    ];
    const controls = (disabled: boolean, path: string) => (
      <div className="flex flex-col gap-4">
        <div data-control="radio" className="flex flex-col gap-2">
          <Radio.Item name={`radio-${path}`} defaultChecked disabled={disabled}>
            선택
          </Radio.Item>
          <Radio.Item name={`radio-${path}`} disabled={disabled}>
            미선택
          </Radio.Item>
        </div>
        <div data-control="checkbox" className="flex flex-wrap gap-3">
          <CheckboxCircle label="원형 선택" defaultChecked disabled={disabled} />
          <CheckboxCircle label="원형 미선택" disabled={disabled} />
          <CheckboxLine label="선 선택" defaultChecked disabled={disabled} />
          <CheckboxLine label="선 미선택" disabled={disabled} />
          <CheckboxLineTransparent
            label="투명 선택"
            defaultChecked
            disabled={disabled}
          />
          <CheckboxLineTransparent label="투명 미선택" disabled={disabled} />
        </div>
        <div data-control="table-checkbox" className="flex gap-3">
          <TableCheckbox checked disabled={disabled} ariaLabel="선택" />
          <TableCheckbox checked={false} disabled={disabled} ariaLabel="미선택" />
          <TableCheckbox
            checked={false}
            indeterminate
            disabled={disabled}
            ariaLabel="부분 선택"
          />
        </div>
        <div data-control="switch" className="flex gap-3">
          <Switch label="선택" defaultChecked disabled={disabled} />
          <Switch label="미선택" disabled={disabled} />
        </div>
        <div data-control="segmented-control">
          <SegmentedControl
            value="a"
            onChange={() => {}}
            options={options}
            disabled={disabled}
          />
        </div>
      </div>
    );
    return (
      <div className="grid w-[900px] grid-cols-2 gap-8">
        <section data-disabled-path="prop">
          <h2 className="mb-3 text-fg-default">disabled prop</h2>
          {controls(true, "prop")}
        </section>
        <section data-disabled-path="fieldset">
          <h2 className="mb-3 text-fg-default">fieldset disabled</h2>
          <fieldset disabled className="m-0 min-w-0 border-0 p-0">
            {controls(false, "fieldset")}
          </fieldset>
        </section>
      </div>
    );
  },
};
