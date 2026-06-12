import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Trash2, ScrollText } from "lucide-react";
import { Modal } from "./Modal";
import { ModalSubView } from "./ModalSubView";
import { StandardModal } from "./StandardModal";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Switch } from "@/components/switch";
import { AnimatedHeight } from "@/components/animated-height";
import { showActionToast } from "@/components/action-toast";

/**
 * 모달 — 데스크탑(sm+)에서는 중앙 카드, 모바일에서는 하단 바텀시트로 자동 분기.
 * ESC·백드롭 클릭으로 닫히고, 모바일 바텀시트는 핸들 바를 끌어 닫을 수 있다.
 *
 * **컴포넌트 위계**
 * - `StandardModal` — 80% 폼 케이스를 커버하는 고수준. 액션 footer를 prop으로 자동 생성. **이걸 먼저 검토.**
 * - `Modal` — base. StandardModal로 안 되는 자유 레이아웃을 직접 그리는 escape hatch.
 * - `ModalSubView` — 모달 안에서 우측 슬라이드 푸시 네비. 레이어드 모달(모달 위 모달)을 피하는 장치.
 */
const meta = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "모달/드로어 모두 sm 미만에서 바텀시트로 자동 분기. StandardModal(고수준)을 우선 쓰고, 자유도가 필요할 때만 base Modal로 내려간다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = (text: string) => ({
  docs: { description: { story: text } },
});

// ─────────────────────────────────────────────
// StandardModal — 표준 폼 모달 (대부분의 케이스)
// ─────────────────────────────────────────────

export const Standard_기본: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "가장 흔한 케이스. primaryAction(저장) + secondaryAction(취소)만 주면 footer가 자동 생성된다. 본문은 px-4 py-5 자동 padding.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>표준 폼 모달</Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="역할 수정"
          primaryAction={{ label: "저장", onClick: () => setOpen(false) }}
          secondaryAction={{ label: "닫기", onClick: () => setOpen(false) }}
        >
          <Input
            variant="box"
            label="이름"
            labelOption="sustain"
            placeholder="역할 이름"
          />
        </StandardModal>
      </>
    );
  },
};

export const Standard_비대칭_좌측액션: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "leftAction으로 비대칭 footer를 만든다. 좌측에 보조 액션(예: '변경 이력'), 우측에 취소/저장. 정보 조회 진입점을 footer 좌측에 두는 패턴.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>비대칭 footer</Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="한도 수정"
          leftAction={{
            label: "변경 이력",
            leadingIcon: <ScrollText className="h-4 w-4" />,
            onClick: () => {},
          }}
          primaryAction={{ label: "저장", onClick: () => setOpen(false) }}
          secondaryAction={{ label: "닫기", onClick: () => setOpen(false) }}
        >
          <Input
            variant="box"
            label="한도"
            labelOption="sustain"
            suffix="원"
          />
        </StandardModal>
      </>
    );
  },
};

export const Standard_단일액션: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "확인만 필요한 경우 primaryAction 하나만. secondaryAction 생략 시 우측 버튼 하나만 그려진다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>단일 액션</Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="안내"
          primaryAction={{ label: "확인", onClick: () => setOpen(false) }}
        >
          <span className="text-sm text-text-primary">
            처리가 완료되었습니다.
          </span>
        </StandardModal>
      </>
    );
  },
};

export const Standard_삭제_danger: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "위험 액션은 primaryAction에 variant='danger'. 추가로 한 번 더 확인이 필요하면 액션토스트로 재확인을 띄운다(아래 레이어드 케이스 참고).",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          삭제 모달
        </Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="역할 삭제"
          primaryAction={{
            label: "삭제",
            variant: "danger",
            leadingIcon: <Trash2 className="h-4 w-4" />,
            onClick: () => setOpen(false),
          }}
          secondaryAction={{ label: "취소", onClick: () => setOpen(false) }}
        >
          <span className="text-sm text-text-primary">
            이 역할을 삭제하면 되돌릴 수 없어요.
          </span>
        </StandardModal>
      </>
    );
  },
};

export const Standard_긴본문_스크롤: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "본문이 길면 바디만 자체 스크롤되고 헤더·footer는 고정. 시트 자체는 max-h로 viewport를 넘지 않는다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>긴 본문</Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="약관"
          primaryAction={{ label: "동의", onClick: () => setOpen(false) }}
          secondaryAction={{ label: "닫기", onClick: () => setOpen(false) }}
        >
          <div className="flex flex-col gap-3">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} className="text-sm text-text-secondary">
                {i + 1}. 약관 조항 텍스트가 길게 이어집니다. 바디만 스크롤되고
                footer는 하단에 고정됩니다.
              </p>
            ))}
          </div>
        </StandardModal>
      </>
    );
  },
};

// ─────────────────────────────────────────────
// AnimatedHeight 정책 — 모달 내부 높이 변화
// ─────────────────────────────────────────────

export const 정책_AnimatedHeight_적용: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "✅ 권장. 모달 내부에 토글·조건부 영역처럼 높이가 변하는 인터랙션이 있으면 AnimatedHeight로 본문을 감싼다. 시트 높이가 부드럽게 이행된다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>✅ AnimatedHeight 적용</Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="설정"
          primaryAction={{ label: "저장", onClick: () => setOpen(false) }}
        >
          <AnimatedHeight>
            <div className="flex flex-col gap-3">
              <Switch
                label="고급 옵션"
                checked={expanded}
                onCheckedChange={setExpanded}
              />
              {expanded && (
                <div className="rounded-lg bg-bg-base-secondary p-3 text-sm text-text-secondary">
                  고급 옵션 영역. 토글하면 시트 높이가 부드럽게 늘고 줄어요.
                </div>
              )}
            </div>
          </AnimatedHeight>
        </StandardModal>
      </>
    );
  },
};

export const 정책_AnimatedHeight_미적용: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "❌ 비교용. 감싸지 않으면 토글 시 instant jump가 발생해 시선이 흔들린다. 위 '적용' 케이스와 나란히 비교해 볼 것.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          ❌ 미적용 (jump)
        </Button>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="설정"
          primaryAction={{ label: "저장", onClick: () => setOpen(false) }}
        >
          <div className="flex flex-col gap-3">
            <Switch
              label="고급 옵션"
              checked={expanded}
              onCheckedChange={setExpanded}
            />
            {expanded && (
              <div className="rounded-lg bg-bg-base-secondary p-3 text-sm text-text-secondary">
                고급 옵션 영역. 감싸지 않아 토글 시 높이가 툭 바뀝니다.
              </div>
            )}
          </div>
        </StandardModal>
      </>
    );
  },
};

// ─────────────────────────────────────────────
// 레이어드 회피 — SubView / ActionToast
// ─────────────────────────────────────────────

export const 레이어드_SubView: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "모달 위에 또 모달을 띄우는 대신, 우측에서 슬라이드 인하는 서브뷰로 푸시 네비. ESC는 서브뷰의 onBack만 부르고 부모 모달은 유지(overlayStack 우선순위).",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [subOpen, setSubOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>서브뷰 모달</Button>
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
                우측에서 슬라이드 인 한 서브뷰. ESC/뒤로가기로 닫으면 모달은
                유지됩니다.
              </div>
            </ModalSubView>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            <span className="text-sm text-text-primary">본문 영역입니다.</span>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSubOpen(true)}
            >
              변경 이력 보기 →
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const 레이어드_ActionToast_재확인: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "모달 위 추가 확인을 모달 중첩 없이 액션토스트로 처리. 토스트가 떠 있는 동안 ESC·백드롭은 토스트만 닫고 모달은 유지된다 — Modal이 action-toast를 직접 알지 않고 overlayStack 우선순위로 자동 성립.",
  ),
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
                  {
                    label: "취소",
                    variant: "tertiary",
                    appearance: "filled",
                    onClick: () => {},
                  },
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
            삭제를 누르면 액션토스트로 한 번 더 확인해요. ESC로 토스트를 닫아도
            모달은 그대로입니다.
          </span>
        </StandardModal>
      </>
    );
  },
};

// ─────────────────────────────────────────────
// Modal (base) — escape hatch
// ─────────────────────────────────────────────

export const 정책_너비고정: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "설계 제약: 모달은 너비를 애니메이션하지 않는다. 동적 너비는 데스크탑 중앙 정렬(translateX -50%) 기준점과 함께 움직여 한쪽으로 밀리는 부자연스러운 모션이 되기 때문(framer-motion layout도 transform 정렬과 충돌). → 높이만 AnimatedHeight로 부드럽게, 너비는 widthPx로 고정. 콘텐츠 폭이 인터랙션으로 변할 수 있는 모달이라면 widthPx 지정이 사실상 필수.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [wide, setWide] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>너비 고정 정책</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="너비는 고정"
          widthPx={420}
          footer={
            <div className="flex justify-end border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
              <Button size="small" onClick={() => setOpen(false)}>
                닫기
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            <Switch
              label="내용 늘리기 (너비는 그대로)"
              checked={wide}
              onCheckedChange={setWide}
            />
            <p className="text-sm text-text-secondary">
              widthPx=420 고정. 내용을 늘려도 시트 너비는 그대로 — 높이만 변한다.
            </p>
            {wide && (
              <p className="text-sm text-text-secondary">
                추가된 내용. 너비가 흔들리지 않으니 시각적으로 안정적이다.
              </p>
            )}
          </div>
        </Modal>
      </>
    );
  },
};

export const 정책_서브뷰높이: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "설계 제약: 서브뷰 콘텐츠 높이 ≤ 부모 모달 본문 높이. 서브뷰는 부모 시트를 absolute로 덮어 부모 높이를 물려받으므로, '작은 모달에 긴 서브뷰'를 넣으면 서브뷰 안에서만 스크롤이 생겨 부모와 어긋나 보인다. 긴 목록은 부모 모달을 그만큼 키우거나 별도 Drawer/페이지로 분리할 것. 아래는 권장 케이스(서브뷰가 부모 높이에 들어맞음).",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [subOpen, setSubOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>서브뷰 높이 정책</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="권한 설정"
          widthPx={460}
          subView={
            <ModalSubView
              open={subOpen}
              onBack={() => setSubOpen(false)}
              title="최근 변경 3건"
            >
              <div className="flex flex-col gap-2">
                {["권한 A 부여", "권한 B 회수", "역할 변경"].map((t) => (
                  <div
                    key={t}
                    className="rounded-lg bg-bg-base-secondary px-3 py-2 text-sm text-text-primary"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </ModalSubView>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            <span className="text-sm text-text-primary">
              본문과 서브뷰의 내용 양이 비슷해 높이가 어긋나지 않는다.
            </span>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setSubOpen(true)}
            >
              변경 이력 →
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const Base_고정폭: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "base Modal은 footer를 직접 그린다. widthPx로 데스크탑 폭을 고정 — 콘텐츠 폭이 변해도 시트가 흔들리지 않게.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          base Modal (widthPx=480)
        </Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="자유 레이아웃"
          widthPx={480}
          footer={
            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
              <Button variant="secondary" appearance="outlined" size="small" onClick={() => setOpen(false)}>
                닫기
              </Button>
            </div>
          }
        >
          <div className="p-4 text-sm text-text-primary">
            StandardModal의 액션 패턴이 안 맞을 때 footer를 직접 구성합니다.
          </div>
        </Modal>
      </>
    );
  },
};
