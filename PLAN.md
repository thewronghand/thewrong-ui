# thewrong-ui 추출 계획서

the source app `src/shared/ui/*` → `@thewrong/ui` 컴포넌트 이전 로드맵.

## 결정사항 (2026-06-12)

| 항목 | 결정 |
|------|------|
| 배포 | npm publish (`@thewrong/ui`) |
| 스타일 | CSS 자체포함 (단일 번들) + Tailwind 오버라이드 가능 + 테마 시스템 |
| 추출 방식 | source 구현 **거의 그대로 복사** (재작성 X) |
| 1차 범위 | 작고 독립적인 것부터 |
| git | 개인 계정 `thewronghand` |

## 인프라 현황

- [x] Vite lib 빌드 (ES/CJS + dts + 단일 CSS, react external)
- [x] Tailwind v4 `@theme` 테마 시스템 (oklch, `:root` 오버라이드)
- [x] Storybook + vitest 브라우저 테스트
- [x] `package.json` publish 설정 (name/version/exports/files/sideEffects)
- [x] `.gitignore`에 `.envrc` 추가, git user = thewronghand
- [ ] git 초기 커밋 (아직 0개)
- [ ] `repository.url` → thewronghand 계정으로 수정
- [ ] remote 추가 (`github-personal` host alias)

## 컴포넌트 의존성 Tier

source `shared/ui` 분석 결과. **내부 `@shared` 의존이 적을수록 추출이 쉬움.**

### Tier 0 — react만 의존 (즉시 추출 가능)
`badge` · `switch`(토글) · `checkbox` · `textarea` · `collapsible` ·
`loading-spinner` · `status-indicator` · `info-tooltip` · `tooltip` · `field`

### Tier 1 — 외부 lib 1개 추가
- `input` → lucide-react
- `animated-height` → motion/react
- `popover` → motion + 자체 click-outside 훅 (훅도 함께 이전)

### Tier 2 — 내부 lib / 컴포넌트 의존 (선행 추출 필요)
- `modal` → button, `@shared/lib/overlay-stack`, `@shared/lib/portal`
- `drawer` → action-toast, overlay-stack, portal
- `action-toast` → button, input, textarea, react-hot-toast, media-query 훅

> Tier 2 진입 전 `overlay-stack`, `portal`, `media-query`, `click-outside` 등
> `@shared/lib`·`@shared/hooks` 유틸을 라이브러리 내부로 이전해야 함.

### Tier 3 — 대형/고의존 (나중)
| 컴포넌트 | LOC | 주요 의존 |
|----------|-----|-----------|
| table | 6784 | @tanstack/react-virtual, dnd-kit |
| select | 2621 | floating-ui |
| search-box | 1578 | use-debounce 등 |
| sidebar | 1364 | react-router |
| date-picker | 1135 | date-fns |

## 미확인 컴포넌트 (추적 필요)

의현님이 언급했으나 `shared/ui` 최상위에 없는 것들 — 1차 추출 후 위치 파악:
- **pagination** — table 내부(`table/components`)일 가능성
- **preset-selector** — search-box 내부 또는 별도 위치
- **bottom-sheet** — drawer로 흡수됐을 가능성
- **toast** — action-toast / react-hot-toast로 흡수됐을 가능성

## 마일스톤

### M0 — 셋업 마무리 (현재)
- [x] CLAUDE.md, PLAN.md 작성
- [ ] 첫 커밋 (Button + 인프라)

### M1 — Tier 0 추출 (1차)
후보: `badge`, `switch`, `checkbox`, `input`, `animated-height`
각 컴포넌트: source에서 복사 → thewrong-ui 구조에 맞춤 → Storybook 등록 → 빌드 검증

### M2 — Tier 1 + 공통 유틸 이전
`@shared/lib`, `@shared/hooks` 유틸 이전 → popover 등

### M3 — Tier 2 (오버레이 계열)
modal, drawer, action-toast

### M4 — Tier 3 (대형 컴포넌트)
table, select, search-box, sidebar, date-picker — 개별 평가 후 진행

## 컴포넌트별 진행 체크리스트

- [x] button (신규 작성 완료)
- [x] badge (info/neutral 토큰 보강 포함)
- [x] switch (시맨틱 토큰 레이어 도입)
- [x] checkbox (Circle/Line/LineTransparent)
- [x] textarea (showCount/resize/상태)
- [x] input (PasswordInput, format, clearable / icon 토큰 + lucide 의존성)
- [x] animated-height (motion external/peer)
- [x] collapsible
- [x] tooltip (floating-ui) / info-tooltip
- [x] popover (floating-ui 전환 / useClickOutside 훅 공용 이전)
- [x] action-toast (react-hot-toast peer / overlayStack 조정자 등록)
- [x] toast (ToastProvider — react-hot-toast Toaster 래퍼, toast 재export)
- [x] modal + ModalSubView + StandardModal (overlayStack 레이어드 회피 일반화, 바텀시트 분기)
- [x] drawer (Modal 정책 반영 — 바텀시트/하단 틈 방지/overlayStack)
- [ ] (Tier 3 별도)

## 공통 인프라 (Tier 2에서 이전)

- `src/lib/overlay-stack.ts` — 오버레이 ID 스택 + **priority** 지원. dismissable 오버레이는
  모두 등록하고 "내가 top일 때만" ESC/백드롭에 반응. action-toast는 priority 1000으로 항상 최상위.
  → Modal이 action-toast를 직접 import하지 않고도 "토스트 떠있으면 ESC 양보"가 자동 성립.
- `src/lib/Portal.tsx` — body portal
- `src/hooks/useMediaQuery.ts` — useMediaQuery / useIsMobile

## 후속 작업 메모 (TODO)

- **테이블 이관 시 `src/dev/playground/TablePlaygroundPage.tsx` 참고** — 의도/케이스 파악.
- **이관 전부 끝나면, 이전에 옮긴 컴포넌트들의 stories도 각 PlaygroundPage 기반으로 살찌우기.**
  (현재 modal만 플레이그라운드 의도 반영 완료. badge/switch/input 등은 기본 stories 수준)
- source 플레이그라운드 위치: `the source app/src/dev/playground/*PlaygroundPage.tsx`

## Storybook 노하우 (이번에 정립)

- **모바일/바텀시트 데모**: story에 `globals: { viewport: { value: "mobile", isRotated: false } }`로
  iframe 폭을 모바일로 고정 → sm 미만 분기 컴포넌트(Modal/Drawer)가 바텀시트로만 렌더된다.
  (Storybook 10은 구 `parameters.viewport.defaultViewport`가 아니라 **`globals.viewport.value`**)
  viewport 정의는 `.storybook/preview.tsx`의 `parameters.viewport.options`.
- **싱글톤 패키지 dedupe**: react-hot-toast/motion이 중복 번들되면 toast 큐/모션 컨텍스트가 갈라진다.
  `.storybook/main.ts`의 `viteFinal`과 `vite.config.ts`의 `resolve.dedupe`에 등록.
- **명령형 토스트 검증 함정**: 일반 toast는 `duration: 3000`이라, 클릭과 DOM 측정을 별도 도구 호출로
  나누면 3초 지나 사라진 뒤를 봐서 "안 뜬다"고 오진할 수 있다. 클릭+측정을 한 호출(rAF/짧은 setTimeout)에서.
