# thewrong-ui 핸드오버 (2026-06-13 갱신)

> **2026-06-13 업데이트**: select 가족 마무리(MultiSelect 이관, Dropdown 2종은 @deprecated라 제외) +
> **table 가족 전체 이관**(Table·PaginatedTable·AccordionTable·MiniTable·Pagination·컬럼프리셋, dnd-kit/react-virtual peer,
> 선행 의존 table-checkbox·column-preset-storage 동반, LegacyTable 제외) + stories 1차 보강(badge/input/collapsible/animated-height).
> 빌드/typecheck 통과, 브라우저 시각검증 완료. 아래 본문은 6/12 시점 기준이며 위 내용이 최신 누적분.

---

# thewrong-ui 핸드오버 (2026-06-12 기준)

the source app `src/shared/ui/*` → `@thewrong/ui` 컴포넌트 라이브러리 이관 작업.
이 문서는 다음 세션이 바로 이어갈 수 있도록 현황/남은작업/노하우를 정리한 것. `CLAUDE.md`(정체성·정책)와 `PLAN.md`(로드맵)도 함께 참조.

## 현황: 18개 컴포넌트 + 인프라 이관 완료

**Tier 0~2 전부 + Tier 3 일부:**
button · badge · switch · checkbox · input(+PasswordInput) · textarea ·
collapsible · animated-height · tooltip · info-tooltip · popover · loading-spinner ·
**select(단일 Select만)** · action-toast · toast(ToastProvider) · modal(+SubView+Standard) · drawer

**인프라:**
- `src/lib/overlay-stack.ts` — priority 지원 오버레이 스택 (레이어드 회피 조정자)
- `src/lib/Portal.tsx`
- `src/hooks/useClickOutside.ts`, `useMediaQuery.ts`(+useIsMobile)
- `src/components/_shared/form-size-tokens.ts` — 폼 컴포넌트 공용 size 토큰

모두 `npm run build` + `npm run typecheck` 통과. 각 컴포넌트 Storybook story 있음.

## 남은 작업 (다음 세션)

### 1. select 나머지 3종
- `MultiSelect`(582줄), `MultiSelectDropdown`(261), `DropdownSelect`(786) — source `src/shared/ui/select/`
- **DropdownSelect는 react-hook-form `useFormContext` 선택적 통합** → react-hook-form을 **optional peerDependency**로 추가하고, FormContext 없어도 동작하도록(이미 그런 구조). 무거우니 우선순위 낮춤.
- MultiSelect는 Select와 유사(floating-ui), 우선 옮길 만함.

### 2. table (Tier 3, 25파일 6784줄 — 폴더 합계지 한 파일 아님)
**위계(플레이그라운드 의도):**
- `PaginatedTable` — 주력. 페이지네이션+페이지사이즈+키보드이동 내장
- `Table` — 페이지네이션 없이 한 번에 (정렬/리사이즈/선택/sticky/프리셋)
- `AccordionTable` — 펼침 행 / `MiniTable`,`PaginatedMiniTable` — 모달 안 단순 표
- `LegacyTable`(1093) — **안 가져옴** (구버전)
- 곁다리: `Pagination`(344, 의현이 찾던 pagination), `ColumnPresetSelector`(=preset-selector), 정렬/리사이즈/가상스크롤 훅들

**table 새 의존 (peer 추가 필요):** `@dnd-kit/core`,`@dnd-kit/sortable`,`@dnd-kit/utilities`(컬럼 DnD), `@tanstack/react-virtual`(가상스크롤)
**table 내부 의존:** checkbox✅ select✅(이제 있음) loading-spinner✅ modal✅ icons❌ table-checkbox❌ `@shared/lib/column-preset-storage`❌(localStorage 유틸)
→ table 전에 **icons, table-checkbox, column-preset-storage** 먼저 이관 필요.

### 3. 기존 컴포넌트 stories 살찌우기
modal만 플레이그라운드 의도를 충분히 반영함. badge/switch/input 등은 기본 수준 → 각 `*PlaygroundPage.tsx` 참고해 의도/예시 보강.

## 핵심 아키텍처 결정 (이미 적용됨)

1. **2계층 토큰** (`src/styles/theme.css`): 원시 oklch 토큰 + 시맨틱 토큰(`text-primary`/`bg-card`/`border-tertiary`/`icon-secondary` 등)이 원시를 `var()` 참조. light/dark 두 벌. → source 클래스를 손 안 대고 복사 가능 + 테마 오버라이드 자동 전파.
2. **번들 의존성 정책** (vite.config `rollupOptions.external`): react/motion/@floating-ui/react-hot-toast = **peer+external(optional)**. lucide-react = **dependency+번들포함**(tree-shaking). dedupe로 싱글톤 보장(vite.config + .storybook/main.ts viteFinal).
3. **레이어드 회피** (overlayStack): dismissable 오버레이는 모두 `overlayStack.push(id, priority)`. ActionToast는 priority 1000. Modal/Drawer/SubView는 `isTop` 가드만 → 서로 직접 import 없이 ESC/백드롭 우선순위 자동 성립.
4. **정책의 명시화**: 기술적 한계/디자인 결정으로 정책화한 제약(모달 너비 고정, 서브뷰 높이≤부모)은 JSDoc+story에 "제약+이유+대안" 중립적으로 명시. (CLAUDE.md 참조)

## 작업 컨벤션 / 함정 (겪은 것)

- **이관 절차**: source 소스 읽기 → 토큰/의존 스캔 → 복사(import 경로 `@shared/*`→`@/`로 sed 변환) → index.ts + src/index.ts export → stories(플레이그라운드 의도 반영) → typecheck+build → Storybook 시각 검증 → 커밋.
- **빌드 성공 ≠ 노출**: `src/index.ts` export 빠뜨려도 빌드 통과. 빌드 후 `grep -oE "컴포넌트명" dist/index.es.js`로 번들 포함 확인 + index.ts 대조 루프 돌릴 것.
- **에디터 진단 `@/components/* Cannot find module`**: stories에서 자주 뜨지만 **대부분 지연/캐시**. `npx tsc --noEmit`이 통과하면 무시 가능.
- **discriminated union props + Storybook**: Select처럼 args가 union이면 `StoryObj<typeof meta>`가 args를 never로 강제 → `type Story = StoryObj`(느슨)로 두고 모두 render로.
- **모바일 바텀시트 데모**: story에 `globals: { viewport: { value: "mobile", isRotated: false } }`. (Storybook 10은 `globals.viewport.value`, 구 `parameters.defaultViewport` 아님). viewport 정의는 `.storybook/preview.tsx` `parameters.viewport.options`.
- **명령형 토스트 검증**: 일반 toast는 `duration:3000`. 클릭과 DOM측정을 별도 도구호출로 나누면 3초 지나 사라진 뒤를 봐 "안 뜬다" 오진. 클릭+측정을 한 호출에.
- **floating-ui + motion**: 한 요소에 floatingStyles(위치)와 motion 애니메이션(transform) 같이 걸면 위치가 (0,0)으로 깨짐 → div 두 겹 분리(바깥=위치, 안=애니메이션). Popover 참조.
- **vite-plugin-dts 5.0.2**: `entryRoot`/`rollupTypes` 무시 → dts가 `dist/src/index.d.ts`로 나옴. package.json `types`를 거기에 맞춰둠.

## 환경 메모

- git: 로컬 user `thewronghand`/`penfreak77@gmail.com`. remote 없음(아직 push 안 함). `.envrc`(GH_TOKEN) gitignore됨.
- Storybook: `npm run dev` (:6006). preview에 ToastProvider 마운트됨.
- source 소스: `/Users/euihyeon/dev/voltron/source/the source app/src/shared/ui/`
- source 플레이그라운드: `.../src/dev/playground/*PlaygroundPage.tsx` (의도/예시의 출처)
- Synapse 노트: `~/Documents/Synapse/notes/dev/260612-사내UI-라이브러리-추출-패턴.md`
