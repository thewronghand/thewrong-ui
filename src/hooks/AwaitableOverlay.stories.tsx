/* eslint-disable no-restricted-imports -- 이관 지시에 따라 @/ 별칭 대신 상대 경로를 사용한다. */
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../components/button";
import { Modal } from "../components/modal";
import { Drawer } from "../components/drawer";
import { useAwaitableOverlay } from "./useAwaitableOverlay";

const meta = {
  title: "Hooks/AwaitableOverlay",
  parameters: {
    docs: {
      description: {
        component:
          "닫기 경로마다 취소를 settle하여 대기 중인 Promise를 완료합니다.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function Example({ kind }: { kind: "modal" | "drawer" }) {
  const overlay = useAwaitableOverlay<string>();
  const [result, setResult] = useState("아직 응답 없음");
  const open = async () => {
    const response = await overlay.open();
    setResult(
      response.type === "confirm" ? `확인: ${response.value}` : "취소됨",
    );
  };
  const cancel = () => overlay.settle({ type: "cancel" });
  const content = (
    <div className="space-y-4 p-5">
      <p>이 작업을 진행할까요?</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={cancel}>
          취소
        </Button>
        <Button
          onClick={() => overlay.settle({ type: "confirm", value: "진행" })}
        >
          확인
        </Button>
      </div>
    </div>
  );
  return (
    <div className="space-y-3">
      <Button onClick={() => void open()}>오버레이 열기</Button>
      <p aria-live="polite">{result}</p>
      {kind === "modal" ? (
        <Modal isOpen={overlay.isOpen} onClose={cancel} title="확인">
          {content}
        </Modal>
      ) : (
        <Drawer open={overlay.isOpen} onClose={cancel} title="확인">
          {content}
        </Drawer>
      )}
    </div>
  );
}
export const ModalExample: Story = { render: () => <Example kind="modal" /> };
export const DrawerExample: Story = { render: () => <Example kind="drawer" /> };

function UnmountingDialog({
  onRemove,
  onResult,
}: {
  onRemove: () => void;
  onResult: (result: string) => void;
}) {
  const overlay = useAwaitableOverlay();
  const open = async () => {
    const result = await overlay.open();
    onResult(result.type);
  };
  return (
    <>
      <Button onClick={() => void open()}>언마운트 예시 열기</Button>
      <Modal
        title="언마운트"
        isOpen={overlay.isOpen}
        onClose={() => overlay.settle({ type: "cancel" })}
      >
        <div className="p-5">
          <Button onClick={onRemove}>컴포넌트 제거</Button>
        </div>
      </Modal>
    </>
  );
}
export const UnmountExample: Story = {
  render: () => {
    const [mounted, setMounted] = useState(true);
    const [result, setResult] = useState("대기 중");
    return (
      <div className="space-y-3">
        {mounted && (
          <UnmountingDialog
            onRemove={() => setMounted(false)}
            onResult={setResult}
          />
        )}
        <p aria-live="polite">결과: {result}</p>
      </div>
    );
  },
};
