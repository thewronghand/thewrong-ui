import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { Trash2, ScrollText } from "lucide-react";
import { Modal } from "./Modal";
import { ModalSubView } from "./ModalSubView";
import { StandardModal } from "./StandardModal";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { MultiSelect, Select } from "@/components/select";
import { Switch } from "@/components/switch";
import { AnimatedHeight } from "@/components/animated-height";
import { showActionToast } from "@/components/action-toast";
import { Popover } from "@/components/popover";
import { DatePicker } from "@/components/date-picker";
import { Portal } from "@/lib/Portal";

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

export const InitialFocus: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "명시한 주 액션에 먼저 포커스하고, 설명 요소의 id를 지정해 모달에 연결한다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState("실행 전");
    const actionRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        <Button onClick={() => setOpen(true)}>확인 창 열기</Button>
        <p>{result}</p>
        <StandardModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="실행 확인"
          initialFocus={actionRef}
          describedBy="initial-focus-description"
          primaryAction={{
            label: "실행",
            ref: actionRef,
            onClick: () => {
              setResult("실행됨");
              setOpen(false);
            },
          }}
          secondaryAction={{ label: "취소", onClick: () => setOpen(false) }}
        >
          <span id="initial-focus-description">선택한 작업을 실행합니다.</span>
        </StandardModal>
      </>
    );
  },
};

export const InitialFocusWithSubview: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  render: () => {
    const [open, setOpen] = useState(false);
    const [subOpen, setSubOpen] = useState(true);
    const actionRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        <Button
          onClick={() => {
            setSubOpen(true);
            setOpen(true);
          }}
        >
          서브뷰와 함께 열기
        </Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="부모 모달"
          initialFocus={actionRef}
          describedBy="subview-parent-description"
          subView={
            <ModalSubView
              open={subOpen}
              onBack={() => setSubOpen(false)}
              title="서브뷰"
            >
              서브뷰 내용
            </ModalSubView>
          }
        >
          <div className="min-h-40 p-4">
            <p id="subview-parent-description">부모 설명</p>
            <button ref={actionRef}>부모 실행</button>
          </div>
        </Modal>
      </>
    );
  },
};

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
          <span className="text-sm text-fg-default">
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
          <span className="text-sm text-fg-default">
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
              <p key={i} className="text-sm text-fg-muted">
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
          widthPx={420}
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
                <div className="rounded-lg bg-bg-subtle p-3 text-sm text-fg-muted">
                  고급 옵션 영역. 너비는 widthPx로 고정돼 있어 토글 시 높이만
                  부드럽게 늘고 줄어요(가로 흔들림 없음).
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
          widthPx={420}
          primaryAction={{ label: "저장", onClick: () => setOpen(false) }}
        >
          <div className="flex flex-col gap-3">
            <Switch
              label="고급 옵션"
              checked={expanded}
              onCheckedChange={setExpanded}
            />
            {expanded && (
              <div className="rounded-lg bg-bg-subtle p-3 text-sm text-fg-muted">
                고급 옵션 영역. AnimatedHeight로 감싸지 않아 토글 시 높이가 툭
                바뀝니다(너비는 widthPx로 고정).
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
          widthPx={460}
          subView={
            <ModalSubView
              open={subOpen}
              onBack={() => setSubOpen(false)}
              title="변경 이력"
            >
              <div className="text-sm text-fg-default">
                우측에서 슬라이드 인 한 서브뷰. 부모 모달의 높이를 그대로 채운다.
                ESC/뒤로가기로 닫으면 모달은 유지됩니다.
              </div>
            </ModalSubView>
          }
        >
          {/* 서브뷰가 부모 높이를 채우는 걸 보여주려고 본문에 충분한 높이를 둠 */}
          <div className="flex min-h-72 flex-col gap-3 p-4">
            <span className="text-sm text-fg-default">본문 영역입니다.</span>
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
          <span className="text-sm text-fg-default">
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
            <div className="flex justify-end border-t border-border-subtle px-5 py-4">
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
            <p className="text-sm text-fg-muted">
              widthPx=420 고정. 내용을 늘려도 시트 너비는 그대로 — 높이만 변한다.
            </p>
            {wide && (
              <p className="text-sm text-fg-muted">
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
                    className="rounded-lg bg-bg-subtle px-3 py-2 text-sm text-fg-default"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </ModalSubView>
          }
        >
          {/* 본문에 충분한 높이를 둬, 서브뷰(변경 3건)가 부모 높이에 자연스럽게 들어맞는 걸 보여줌 */}
          <div className="flex min-h-72 flex-col gap-3 p-4">
            <span className="text-sm text-fg-default">
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
            <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4">
              <Button variant="secondary" appearance="outlined" size="small" onClick={() => setOpen(false)}>
                닫기
              </Button>
            </div>
          }
        >
          <div className="p-4 text-sm text-fg-default">
            StandardModal의 액션 패턴이 안 맞을 때 footer를 직접 구성합니다.
          </div>
        </Modal>
      </>
    );
  },
};

// ─────────────────────────────────────────────
// 반응형 — 모바일 바텀시트
// ─────────────────────────────────────────────

export const 모바일_바텀시트: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  // Storybook 10: viewport 고정은 globals.viewport.value로. (구 parameters.defaultViewport 대체)
  // iframe을 모바일 폭으로 고정 → sm(640px) 미만이라 모달이 바텀시트로 분기.
  globals: { viewport: { value: "mobile", isRotated: false } },
  parameters: {
    docs: {
      description: {
        story:
          "Modal/Drawer는 sm(640px) 미만에서 화면 하단 바텀시트로 자동 분기한다. 이 story는 viewport를 모바일로 고정해 데스크탑에서도 바텀시트 모드를 보여준다. 상단 핸들 바를 잡고 아래로 끌면(100px 초과/빠른 fling) 닫힌다. 같은 Modal 컴포넌트가 폭에 따라 중앙 카드 ↔ 바텀시트로 전환되는 것이 핵심.",
      },
    },
  },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>바텀시트 열기</Button>
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

export const 닫기_제한과_포커스: Story = {
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "dismissible=false에서는 ESC·백드롭·닫기 버튼·드래그로 닫히지 않는다. 내부 버튼으로 닫으면 종료 모션 뒤 횟수가 늘어나고 열기 버튼에 포커스가 돌아간다. 서브뷰가 열린 동안 Tab은 서브뷰와 보이는 헤더·footer를 돌고 덮인 본문은 건너뛴다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [subOpen, setSubOpen] = useState(false);
    const [exits, setExits] = useState(0);
    const close = () => {
      setSubOpen(false);
      setOpen(false);
    };
    return (
      <>
        <Button onClick={() => setOpen(true)}>닫기 제한 모달 열기</Button>
        <p>종료 모션 완료: {exits}회</p>
        <Modal
          isOpen={open}
          onClose={close}
          dismissible={false}
          onExitComplete={() => setExits((count) => count + 1)}
          title="직접 닫는 모달"
          subView={
            <ModalSubView
              open={subOpen}
              onBack={() => setSubOpen(false)}
              title="서브뷰"
            >
              <label>
                서브뷰 입력
                <input className="border p-1" />
              </label>
            </ModalSubView>
          }
          footer={<Button onClick={close}>직접 닫기</Button>}
        >
          <div className="flex min-h-48 flex-col gap-3 p-4">
            <label>
              자동 포커스 입력
              <input autoFocus className="border p-1" />
            </label>
            <Button onClick={() => setSubOpen(true)}>서브뷰 열기</Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const 모달_안_Select: Story = {
  name: "모달 안 Select",
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "모달에서 각 Select 패널을 연 뒤 Tab과 Shift+Tab으로 앞뒤 필드로 이동하고 모달 경계에서 순환한다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const options = [
      { value: "seoul", label: "서울" },
      { value: "busan", label: "부산" },
      { value: "jeju", label: "제주" },
    ];
    return (
      <>
        <Button onClick={() => setOpen(true)}>Select 폼 열기</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Select 폼" widthPx={420}>
          <div className="flex flex-col gap-3 p-4">
            <Input variant="box" label="이름" placeholder="이름 입력" />
            <Select variant="box" label="지역" options={options} value={country} onChange={setCountry} />
            <Select variant="box" label="검색 지역" searchable options={options} value={city} onChange={setCity} />
            <MultiSelect variant="box" label="관심 지역" options={options} value={tags} onChange={setTags} />
            <Button onClick={() => setOpen(false)}>저장</Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const 모달_안_Popover_DatePicker: Story = {
  name: "모달 안 Popover·DatePicker",
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "팝오버와 날짜 선택기를 키보드로 열면 Tab과 Shift+Tab 모두 매 바퀴 패널을 지난다. 마지막 필드는 Select다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState("");
    const [value, setValue] = useState("");
    return (
      <>
        <Button onClick={() => setOpen(true)}>부유 레이어 모달 열기</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="부유 레이어"
          widthPx={420}
        >
          <div className="flex flex-col gap-3 p-4">
            <Input variant="box" label="이름" placeholder="부유 레이어 입력" />
            <Popover
              trigger="팝오버 열기"
              content={
                <div className="flex gap-2">
                  <Button>팝오버 첫 버튼</Button>
                  <Button>팝오버 마지막 버튼</Button>
                </div>
              }
            />
            <DatePicker value={date} onApply={setDate}>
              <Button variant="secondary">날짜 선택 {date}</Button>
            </DatePicker>
            <Select
              variant="box"
              label="마지막 선택"
              options={[
                { value: "seoul", label: "서울" },
                { value: "busan", label: "부산" },
              ]}
              value={value}
              onChange={setValue}
            />
          </div>
        </Modal>
      </>
    );
  },
};

export const 모달_위_모달: Story = {
  name: "모달 위 모달",
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "안쪽 모달의 Tab 순환과 각 모달을 닫은 뒤의 포커스 복원을 확인한다. 실제 화면에서는 모달 위 모달 대신 ModalSubView(푸시 네비)나 ActionToast(재확인)를 권장한다.",
  ),
  render: () => {
    const [outerOpen, setOuterOpen] = useState(false);
    const [innerOpen, setInnerOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOuterOpen(true)}>모달 A 열기</Button>
        <Modal
          isOpen={outerOpen}
          onClose={() => setOuterOpen(false)}
          title="모달 A"
        >
          <div className="flex flex-col gap-3 p-4">
            <Button onClick={() => setInnerOpen(true)}>모달 B 열기</Button>
            <Modal
              isOpen={innerOpen}
              onClose={() => setInnerOpen(false)}
              title="모달 B"
            >
              <div className="flex flex-col gap-3 p-4">
                <Input variant="box" placeholder="모달 B 입력" />
                <Button onClick={() => setInnerOpen(false)}>모달 B 닫기</Button>
              </div>
            </Modal>
          </div>
        </Modal>
      </>
    );
  },
};

export const 포커스_트랩_끄기: Story = {
  name: "포커스 트랩 끄기",
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "트랩을 꺼도 열릴 때 모달에 포커스하고 닫히면 여는 버튼으로 복원한다. Tab은 모달 밖으로 이동할 수 있다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>트랩 없는 모달 열기</Button>
        <Button>배경 버튼</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="트랩 없는 모달"
          trapFocus={false}
        >
          <div className="flex flex-col gap-3 p-4">
            <Input variant="box" placeholder="트랩 없는 입력" />
            <Button onClick={() => setOpen(false)}>모달 닫기</Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const 표식으로_편입한_포털: Story = {
  name: "표식으로 편입한 포털",
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "자체 포털 루트에 data-focus-trap-layer를 붙이면 모달과 팝업이 하나의 Tab 고리로 순환한다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);
    const close = () => {
      setOpen(false);
      setPopupOpen(false);
    };
    return (
      <>
        <Button onClick={() => setOpen(true)}>포털 모달 열기</Button>
        <Modal
          isOpen={open}
          onClose={close}
          title="표식 포털"
        >
          <div className="flex flex-col gap-3 p-4">
            <Button onClick={() => setPopupOpen((value) => !value)}>
              자체 포털 열기
            </Button>
            <Button onClick={close}>모달 닫기</Button>
          </div>
          {popupOpen && (
            <Portal>
              <div
                data-focus-trap-layer
                className="fixed right-6 top-6 z-9999 flex gap-2 rounded-lg bg-white p-4 shadow-lg"
              >
                <Button>포털 첫 버튼</Button>
                <Button>포털 마지막 버튼</Button>
              </div>
            </Portal>
          )}
        </Modal>
      </>
    );
  },
};

export const 서브뷰가_열린_채_다시_열기: Story = {
  name: "서브뷰가 열린 채 다시 열기",
  args: { isOpen: false, onClose: () => {}, children: null },
  parameters: story(
    "서브뷰를 열고 모달을 닫았다가 다시 열면 서브뷰가 열린 상태로 뜬다. 포커스는 뒤로 가기에 놓이고, Tab은 서브뷰와 보이는 헤더·footer만 돈다. ESC를 한 번 누르면 서브뷰만 닫힌다.",
  ),
  render: () => {
    const [open, setOpen] = useState(false);
    const [subOpen, setSubOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>유지 모달 열기</Button>
        <Button>배경 버튼</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="서브뷰 유지 모달"
          widthPx={420}
          footer={<Button>푸터 버튼</Button>}
          subView={
            <ModalSubView
              open={subOpen}
              onBack={() => setSubOpen(false)}
              title="유지 서브뷰"
            >
              <label>
                서브뷰 입력
                <input className="border p-1" placeholder="서브뷰 입력" />
              </label>
              <Button>서브뷰 버튼</Button>
            </ModalSubView>
          }
        >
          <div className="flex min-h-48 flex-col gap-3 p-4">
            <input className="border p-1" placeholder="덮인 본문 입력" />
            <Button onClick={() => setSubOpen(true)}>서브뷰 열기</Button>
          </div>
        </Modal>
      </>
    );
  },
};
