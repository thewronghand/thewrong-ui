import type { Meta, StoryObj } from "@storybook/react";
import { ErrorBoundary } from "./ErrorBoundary";

function FailedContent(): never {
  throw new Error("예시 오류");
}
const meta = {
  title: "Components/ErrorBoundary",
  component: ErrorBoundary,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "자동 청크 복구에는 영속 저장이 가능한 chunkReloadPort가 필요합니다. 없으면 수동 새로고침을 제공합니다.",
      },
    },
  },
  tags: ["autodocs"],
  args: { children: <span className="text-fg-default">정상 콘텐츠</span> },
} satisfies Meta<typeof ErrorBoundary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ErrorFallback: Story = {
  render: () => (
    <div className="w-80">
      <ErrorBoundary>
        <FailedContent />
      </ErrorBoundary>
    </div>
  ),
};
export const CustomFallback: Story = {
  render: () => (
    <div className="w-80">
      <ErrorBoundary
        fallbackRender={({ reset }) => (
          <div
            role="alert"
            className="rounded-control-medium border-control border-border-subtle bg-bg-subtle p-4 text-fg-default"
          >
            <p>내용을 표시할 수 없습니다.</p>
            <button type="button" className="mt-3 text-primary" onClick={reset}>
              다시 열기
            </button>
          </div>
        )}
      >
        <FailedContent />
      </ErrorBoundary>
    </div>
  ),
};
