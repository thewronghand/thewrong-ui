import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "danger"],
    },
    appearance: {
      control: "select",
      options: ["filled", "outlined", "transparent"],
    },
    size: {
      control: "select",
      options: ["mini", "small", "medium", "large"],
    },
    display: {
      control: "radio",
      options: ["inline", "block"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "버튼",
    variant: "primary",
    appearance: "filled",
    size: "medium",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["primary", "secondary", "tertiary", "danger"] as const).map(
        (variant) => (
          <div key={variant} className="flex items-center gap-3">
            <span className="w-24 text-sm text-fg-muted">{variant}</span>
            <Button variant={variant} appearance="filled">
              Filled
            </Button>
            <Button variant={variant} appearance="outlined">
              Outlined
            </Button>
            <Button variant={variant} appearance="transparent">
              Transparent
            </Button>
          </div>
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Button size="mini">Mini</Button>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: "저장 중...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "비활성",
    disabled: true,
  },
};

export const Block: Story = {
  args: {
    children: "전체 너비 버튼",
    display: "block",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const InlineLink: Story = {
  render: () => (
    <div className="max-w-md text-base leading-7 text-fg-default">
      이용 전 <Button appearance="link" onClick={() => {}}>자세한 안내</Button>를 확인하세요.
      {" "}<Button appearance="link" variant="danger">삭제</Button>
      {" "}<Button appearance="link" disabled>사용할 수 없음</Button>
    </div>
  ),
};

export const LinkContrast: Story = {
  render: () => (
    <div className="grid gap-4">
      {(["bg-surface", "bg-page"] as const).map((background) => (
        <div
          key={background}
          data-background={background}
          className={background === "bg-surface" ? "bg-bg-surface p-4" : "bg-bg-page p-4"}
        >
          {(["primary", "secondary", "tertiary", "danger"] as const).map((variant) => (
            <span key={variant} className="mr-4">
              <Button appearance="link" variant={variant} data-variant={variant}>
                {variant}
              </Button>{" "}
              <Button appearance="link" variant={variant} data-variant={variant} disabled>
                {variant} disabled
              </Button>
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const LinkDetails: Story = {
  render: () => (
    <div className="grid w-72 gap-4 text-base leading-7 text-fg-default">
      <p>활성: <Button appearance="link" variant="tertiary">자세한 안내</Button>{" "}
        비활성: <Button appearance="link" variant="tertiary" disabled>자세한 안내</Button></p>
      <p>글꼴: <Button appearance="link" className="text-lg leading-tight font-bold">크고 굵은 안내</Button></p>
      <p>문장 속 <Button as="a" href="#details" appearance="link"
        leadingIcon={<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor" /></svg>}
        trailingIcon={<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" fill="none" /></svg>}
      >여러 줄에 자연스럽게 이어지는 아주 긴 링크 안내 문구</Button>를 확인하세요.</p>
      <p>버튼도 <Button appearance="link">여러 줄에 자연스럽게 이어지는 아주 긴 버튼 안내 문구</Button>로 표시합니다.</p>
    </div>
  ),
};
