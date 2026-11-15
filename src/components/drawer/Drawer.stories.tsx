import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { Drawer } from "./Drawer";
import { Button } from "@/components/button";
import { ModalSubView } from "@/components/modal";

/**
 * Drawer — 데스크탑(sm+)에서는 우측 사이드 드로어, 모바일에서는 하단 바텀시트로 자동 분기.
 *
 * Modal과 동일한 분기·드래그·overlayStack 정책을 공유한다. 사이드 패널(필터/상세/설정)에는 Drawer,
 * 중앙 집중형 폼/확인에는 Modal이 어울린다.
 */
const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "우측 사이드 드로어. sm 미만에서 바텀시트로 분기. 좌측 본문은 그대로 두고 보조 정보/설정을 우측에서 여는 패턴에 적합.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (text: string) => ({
  docs: { description: { story: text } },
});

export const InitialFocus: Story = {
  args: { open: false, onClose: () => {}, children: null },
  render: () => {
    const [open, setOpen] = useState(false);
    const fieldRef = useRef<HTMLInputElement>(null);
    return (
      <>
        <Button onClick={() => setOpen(true)}>검색 드로어 열기</Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="검색"
          initialFocus={fieldRef}
        >
          <label className="block p-4">
            검색어 <input ref={fieldRef} aria-label="검색어" />
          </label>
        </Drawer>
      </>
    );
  },
};

export const 기본: Story = {
  args: { open: false, onClose: () => {}, children: null },
  parameters: story("제목 + 본문. 우측에서 슬라이드 인. ESC/백드롭으로 닫힘."),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>드로어 열기</Button>
        <Drawer open={open} onClose={() => setOpen(false)} title="상세 정보">
          <div className="p-4 text-sm text-fg-default">
            우측 사이드 드로어 본문입니다. 좌측 페이지 맥락을 유지한 채 보조
            정보를 띄운다.
          </div>
        </Drawer>
      </>
    );
  },
};

export const 고정폭_560: Story = {
  args: { open: false, onClose: () => {}, children: null },
  parameters: story("widthPx로 데스크탑 드로어 폭을 지정. 기본 480, 여기선 560."),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          넓은 드로어 (560)
        </Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="필터"
          widthPx={560}
        >
          <div className="p-4 text-sm text-fg-default">폭 560px 드로어.</div>
        </Drawer>
      </>
    );
  },
};

export const 제목없음: Story = {
  args: { open: false, onClose: () => {}, children: null },
  parameters: story("title 생략 시 헤더 없이 본문만. 호출부가 자체 헤더를 그릴 때."),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="tertiary" onClick={() => setOpen(true)}>
          제목 없는 드로어
        </Button>
        <Drawer open={open} onClose={() => setOpen(false)}>
          <div className="p-4 text-sm text-fg-default">
            헤더 없이 본문만. 닫기는 ESC/백드롭으로.
          </div>
        </Drawer>
      </>
    );
  },
};

export const 긴본문_스크롤: Story = {
  args: { open: false, onClose: () => {}, children: null },
  parameters: story("본문이 길면 드로어 내부만 스크롤. 헤더는 고정."),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>긴 본문 드로어</Button>
        <Drawer open={open} onClose={() => setOpen(false)} title="변경 이력">
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="rounded-lg bg-bg-subtle px-3 py-2 text-sm text-fg-muted"
              >
                이력 항목 {i + 1}
              </div>
            ))}
          </div>
        </Drawer>
      </>
    );
  },
};

export const 모바일_바텀시트: Story = {
  args: { open: false, onClose: () => {}, children: null },
  globals: { viewport: { value: "mobile", isRotated: false } },
  parameters: {
    docs: {
      description: {
        story:
          "sm(640px) 미만에서는 우측 드로어 대신 하단 바텀시트로 분기. viewport를 모바일로 고정해 데스크탑에서도 바텀시트 모드를 보여준다. 핸들 바를 끌어 닫을 수 있고, 시트 하단은 화면 바닥 너머로 연장돼 드래그/진입 시 백드롭 틈이 없다.",
      },
    },
  },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>바텀시트 열기</Button>
        <Drawer open={open} onClose={() => setOpen(false)} title="필터">
          <div className="flex flex-col gap-3 p-4 text-sm text-fg-default">
            모바일에서는 하단 바텀시트로 뜬다. Drawer와 Modal이 같은 바텀시트
            정책을 공유.
          </div>
        </Drawer>
      </>
    );
  },
};

export const 닫기_제한과_종료: Story = {
  args: { open: false, onClose: () => {}, children: null },
  parameters: story(
    "dismissible=false에서는 외부 닫기 동작을 막고 내부 버튼으로 닫는다. 종료 모션이 끝나면 onExitComplete가 호출된다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [exits, setExits] = useState(0);
    return (
      <>
        <Button onClick={() => setOpen(true)}>닫기 제한 드로어 열기</Button>
        <p>종료 모션 완료: {exits}회</p>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          dismissible={false}
          onExitComplete={() => setExits((count) => count + 1)}
          title="직접 닫는 드로어"
        >
          <div className="flex flex-col gap-3 p-4">
            <label>
              입력
              <input autoFocus className="border p-1" />
            </label>
            <Button onClick={() => setOpen(false)}>직접 닫기</Button>
          </div>
        </Drawer>
      </>
    );
  },
};

export const 포커스_트랩_끄기: Story = {
  name: "포커스 트랩 끄기",
  args: { open: false, onClose: () => {}, children: null },
  parameters: story(
    "trapFocus={false}면 Tab이 드로어 밖으로 이동할 수 있다. 열릴 때 드로어에 포커스하고 닫히면 여는 버튼으로 복원한다. 안에 둔 ModalSubView도 같은 설정을 따른다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [subOpen, setSubOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>트랩 없는 드로어 열기</Button>
        <Button>배경 버튼</Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="트랩 없는 드로어"
          trapFocus={false}
        >
          <div className="relative flex h-full flex-col gap-3 p-4">
            <Button onClick={() => setSubOpen(true)}>서브뷰 열기</Button>
            <Button onClick={() => setOpen(false)}>드로어 닫기</Button>
            <ModalSubView
              open={subOpen}
              onBack={() => setSubOpen(false)}
              title="트랩 없는 서브뷰"
            >
              <Button>서브뷰 버튼</Button>
            </ModalSubView>
          </div>
        </Drawer>
      </>
    );
  },
};
