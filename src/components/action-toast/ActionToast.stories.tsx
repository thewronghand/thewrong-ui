import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/button";
import { showActionToast } from "./ActionToast";

/**
 * ActionToast — 사용자 결정이 필요한 토스트. 자동 dismiss 없음.
 *
 * 컴포넌트가 아니라 **명령형 API**(`showActionToast(...)`)로 띄운다. 한 번에 1개만 노출(같은 id 덮어쓰기).
 * react-hot-toast 기반이라 사용처(앱 루트, Storybook은 preview)에 `<Toaster />`가 마운트돼 있어야 한다.
 *
 * - 백드롭(기본 on)으로 결정을 강제 — 모달 위에서도 동작.
 * - ESC / 백드롭 클릭으로 닫힘. `overlayStack`에 최상위(priority)로 등록돼 Modal보다 ESC 우선.
 * - 시트는 항상 다크 톤(`.dark` 강제) — 내부 Button/Input이 호스트 테마와 무관하게 다크로 렌더.
 */
const meta = {
  title: "Components/ActionToast",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "showActionToast(...)로 띄우는 명령형 토스트. 버튼을 눌러 각 케이스를 확인하세요. (Storybook preview에 Toaster가 마운트돼 있음)",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const story = (text: string) => ({
  docs: { description: { story: text } },
});

export const 기본_확인취소: Story = {
  parameters: story(
    "가장 흔한 형태. warning 톤 + 확인/취소 두 액션. 다크 시트 위에서는 액션 버튼을 appearance='filled'로 통일하는 게 컨벤션.",
  ),
  render: () => (
    <Button
      onClick={() =>
        showActionToast({
          message: "변경사항을 저장하시겠어요?",
          actions: [
            { label: "취소", variant: "tertiary", appearance: "filled", onClick: () => {} },
            { label: "저장", variant: "primary", appearance: "filled", onClick: () => {} },
          ],
        })
      }
    >
      기본 토스트
    </Button>
  ),
};

export const 톤_danger: Story = {
  parameters: story("위험 액션. tone='danger'면 좌측 아이콘이 빨간 경고로."),
  render: () => (
    <Button
      variant="danger"
      onClick={() =>
        showActionToast({
          message: "정말 삭제할까요? 되돌릴 수 없어요.",
          tone: "danger",
          actions: [
            { label: "취소", variant: "tertiary", appearance: "filled", onClick: () => {} },
            { label: "삭제", variant: "danger", appearance: "filled", onClick: () => {} },
          ],
        })
      }
    >
      danger 토스트
    </Button>
  ),
};

export const 톤_info: Story = {
  parameters: story("정보성. tone='info'면 파란 정보 아이콘."),
  render: () => (
    <Button
      variant="secondary"
      onClick={() =>
        showActionToast({
          message: "새 버전이 배포되었어요. 새로고침할까요?",
          tone: "info",
          actions: [
            { label: "나중에", variant: "tertiary", appearance: "filled", onClick: () => {} },
            { label: "새로고침", variant: "primary", appearance: "filled", onClick: () => {} },
          ],
        })
      }
    >
      info 토스트
    </Button>
  ),
};

export const 입력_텍스트: Story = {
  parameters: story(
    "input으로 텍스트 입력을 받는다. 액션 onClick이 입력값을 인자로 받음. text 입력에서 Enter는 마지막(주) 액션을 발화(IME 조합 중엔 무시).",
  ),
  render: () => (
    <Button
      onClick={() =>
        showActionToast({
          message: "반려 사유를 입력해 주세요.",
          input: { type: "text", placeholder: "사유 입력" },
          actions: [
            { label: "취소", variant: "tertiary", appearance: "filled", onClick: () => {} },
            {
              label: "반려",
              variant: "danger",
              appearance: "filled",
              onClick: (value) => alert(`반려 사유: ${value}`),
            },
          ],
        })
      }
    >
      입력 토스트 (text)
    </Button>
  ),
};

export const 입력_여러줄: Story = {
  parameters: story("긴 입력은 input: { type: 'textarea' }. 줄바꿈은 그대로 유지된다."),
  render: () => (
    <Button
      onClick={() =>
        showActionToast({
          message: "메모를 남겨 주세요.",
          input: { type: "textarea", placeholder: "메모", rows: 3 },
          actions: [
            { label: "취소", variant: "tertiary", appearance: "filled", onClick: () => {} },
            {
              label: "저장",
              variant: "primary",
              appearance: "filled",
              onClick: (value) => alert(`메모: ${value}`),
            },
          ],
        })
      }
    >
      입력 토스트 (textarea)
    </Button>
  ),
};

export const 백드롭없는_단순알림: Story = {
  parameters: story(
    "backdrop: false. 사용자 동작을 막을 필요 없는 단순 알림(예: 새 버전 안내). 백드롭이 없으니 우상단 X 버튼이 노출되고, 클릭-아웃 dismiss는 비활성.",
  ),
  render: () => (
    <Button
      variant="secondary"
      onClick={() =>
        showActionToast({
          message: "백그라운드 동기화가 완료됐어요.",
          tone: "info",
          backdrop: false,
          actions: [
            { label: "보기", variant: "primary", appearance: "filled", onClick: () => {} },
          ],
        })
      }
    >
      단순 알림 (backdrop 없음)
    </Button>
  ),
};
