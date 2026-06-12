import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { ModalSubView } from "./ModalSubView";
import { StandardModal } from "./StandardModal";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { showActionToast } from "@/components/action-toast";

const meta = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>표준 모달 열기</Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="역할 수정"
          primaryAction={{ label: "저장", onClick: () => setOpen(false) }}
          secondaryAction={{ label: "닫기", onClick: () => setOpen(false) }}
        >
          <Input variant="box" label="이름" labelOption="sustain" placeholder="역할 이름" />
        </StandardModal>
      </>
    );
  },
};

export const WithSubView: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  render: () => {
    const [open, setOpen] = useState(false);
    const [subOpen, setSubOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>서브뷰 모달 열기</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="한도 수정"
          subView={
            <ModalSubView
              open={subOpen}
              onBack={() => setSubOpen(false)}
              title="변경 이력"
            >
              <div className="text-sm text-text-primary">
                여기는 우측에서 슬라이드 인 한 서브뷰예요. ESC로 뒤로 가면 모달은
                유지됩니다.
              </div>
            </ModalSubView>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            <span className="text-sm text-text-primary">본문 영역입니다.</span>
            <Button variant="secondary" size="small" onClick={() => setSubOpen(true)}>
              변경 이력 보기 →
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const WithActionToast: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>모달 + 액션토스트</Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="삭제 확인"
          primaryAction={{
            label: "삭제",
            variant: "danger",
            onClick: () =>
              showActionToast({
                message: "정말 삭제할까요? 되돌릴 수 없어요.",
                tone: "danger",
                actions: [
                  { label: "취소", variant: "tertiary", appearance: "filled", onClick: () => {} },
                  {
                    label: "삭제",
                    variant: "danger",
                    appearance: "filled",
                    onClick: () => setOpen(false),
                  },
                ],
              }),
          }}
          secondaryAction={{ label: "닫기", onClick: () => setOpen(false) }}
        >
          <span className="text-sm text-text-primary">
            삭제 버튼을 누르면 액션토스트가 떠요. 이때 ESC는 토스트를 먼저
            닫습니다(모달 유지) — overlayStack 우선순위 덕분.
          </span>
        </StandardModal>
      </>
    );
  },
};
