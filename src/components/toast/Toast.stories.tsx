import type { Meta, StoryObj } from "@storybook/react";
import { toast } from "./index";
import { Button } from "@/components/button";

/**
 * Toast — 단순 알림. `react-hot-toast`의 `toast()` API를 그대로 쓰되, 앱 루트에 마운트한
 * `<ToastProvider>`가 디자인(다크 그레이 + 아이콘 + 닫기 버튼)을 입힌다.
 *
 * - `toast.success` / `toast.error` / `toast.loading` / `toast`(blank=info)
 * - 데스크탑 bottom-center / 모바일 top-center, 3초 자동 dismiss
 * - **사용자 결정이 필요한 토스트**(확인/취소·입력)는 Toast가 아니라 `ActionToast`를 쓸 것.
 *
 * (Storybook preview에 ToastProvider가 마운트돼 있어 바로 동작한다.)
 */
const meta = {
  title: "Components/Toast",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "react-hot-toast 기반 단순 알림. 버튼을 눌러 각 타입을 확인하세요. 결정형은 ActionToast로 분리돼 있습니다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const story = (text: string) => ({ docs: { description: { story: text } } });

export const Success: Story = {
  parameters: story("성공 알림. 초록 체크 아이콘."),
  render: () => (
    <Button onClick={() => toast.success("저장됐어요.")}>success</Button>
  ),
};

export const Error: Story = {
  parameters: story("실패 알림. 빨간 X 아이콘."),
  render: () => (
    <Button variant="danger" onClick={() => toast.error("저장에 실패했어요.")}>
      error
    </Button>
  ),
};

export const Info: Story = {
  parameters: story("일반(blank) 알림. 파란 info 아이콘. toast(message)로 호출."),
  render: () => (
    <Button variant="secondary" onClick={() => toast("새 알림이 도착했어요.")}>
      info (blank)
    </Button>
  ),
};

export const Loading: Story = {
  parameters: story(
    "로딩 알림. 스피너 + 자동 dismiss 없음(닫기 버튼도 숨김). 작업 끝나면 toast.dismiss 또는 toast.success로 교체.",
  ),
  render: () => (
    <Button
      variant="tertiary"
      onClick={() => {
        const id = toast.loading("처리 중…");
        setTimeout(() => toast.success("완료!", { id }), 2000);
      }}
    >
      loading → success
    </Button>
  ),
};

export const 긴메시지: Story = {
  parameters: story("긴 메시지는 줄바꿈되며 폭은 max 680px(모바일은 viewport-32px)로 제한."),
  render: () => (
    <Button
      onClick={() =>
        toast.success(
          "정산 데이터 동기화가 완료되었습니다. 변경된 항목은 대시보드의 알림 센터에서 다시 확인할 수 있어요.",
        )
      }
    >
      긴 메시지
    </Button>
  ),
};
