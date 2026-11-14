import { useRef, useState } from "react";

import type { InputFormat, InputValue } from "./types";

/** 화면 값과 부모에게 전달할 원본 값을 계산한다. */
export function applyInputFormat(
  value: InputValue,
  format: InputFormat,
  inputType?: string,
) {
  const display = format.transform(value, inputType).toString();
  const raw = format.reset ? format.reset(display).toString() : display;
  return { display, raw };
}

/** 포맷 변경 전 커서 앞의 숫자 개수를 포맷된 값에서도 유지한다. */
export function getFormattedCursorPosition(
  typedValue: string,
  formattedValue: string,
  position: number,
): number {
  if (typedValue === formattedValue) {
    return Math.min(position, formattedValue.length);
  }
  if (position >= typedValue.length) return formattedValue.length;

  if (!/\d/.test(typedValue) && !/\d/.test(formattedValue)) {
    return Math.min(position, formattedValue.length);
  }
  const digitsBefore = (typedValue.slice(0, position).match(/\d/g) ?? []).length;
  if (digitsBefore === 0) return 0;

  let digitsSeen = 0;
  for (let index = 0; index < formattedValue.length; index++) {
    if (/\d/.test(formattedValue[index]) && ++digitsSeen === digitsBefore) {
      return index + 1;
    }
  }
  return formattedValue.length;
}

/** 이벤트의 실제 input 속성을 보존하면서 네이티브 값을 바꾼다. */
function setNativeValue(node: HTMLInputElement, value: string): void {
  const desc = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  );
  if (!desc?.set) return;
  // bind()로 node에 묶은 새 함수를 만들어 호출 — ESLint unbound-method 규칙을 코드로 해결.
  const boundSetter = desc.set.bind(node) as (v: string) => void;
  boundSetter(value);
}

/**
 * Input 포맷 훅.
 * controlled/uncontrolled 양쪽을 지원하며 format 변환을 일관되게 처리한다.
 *
 * ## RHF (react-hook-form) 호환
 * format 적용 시 `e.target.value`를 네이티브 setter로 변경한 뒤 원본 이벤트를 전달.
 * 이렇게 하면 `e.target`이 실제 DOM 엘리먼트라 `name`·`type` 등 모든 속성이 보존된다.
 * `{ ...e.target, value }` 스프레드는 prototype 속성을 복사하지 않으므로 사용하지 않는다.
 * 원본 값은 onChange 호출 중 읽어야 하며, 호출 직후에는 표시 값으로 돌아간다.
 *
 * @returns displayValue — 화면에 표시할 포맷팅된 값
 * @returns handleChange — onChange 핸들러 (format 적용 후 부모 onChange 호출)
 * @returns setMergedInputRef — forwardRef + RHF register ref + 내부 inputRef 병합
 * @returns handleClear — clearable 버튼 클릭 핸들러 (native value setter 경유)
 */
export function useInputFormat({
  value,
  defaultValue,
  format,
  onChange,
  readOnly = false,
}: {
  value?: InputValue;
  defaultValue?: InputValue;
  format?: InputFormat;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(() => {
    const initial = value ?? defaultValue ?? "";
    return format ? format.transform(initial).toString() : initial.toString();
  });
  const [compositionValue, setCompositionValue] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const isComposing = useRef(false);
  const compositionChanged = useRef(false);

  const isControlled = value !== undefined;
  const rawValue = isControlled ? value.toString() : uncontrolledValue;
  /**
   * 화면에 표시할 값. format이 있으면 transform 적용.
   * controlled 모드에서는 매 렌더마다 derive — 부모가 거부한 입력은 다시 표시되지 않는다.
   */
  const displayValue = format
    ? compositionValue ?? format.transform(rawValue).toString()
    : rawValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const typedValue = e.target.value;
    if (format) {
      const nativeEvent = e.nativeEvent as Event & { isComposing?: boolean };
      if (isComposing.current || nativeEvent.isComposing) {
        compositionChanged.current = true;
        setCompositionValue(typedValue);
        if (!isControlled) setUncontrolledValue(typedValue);
        onChange?.(e);
        return;
      }
      const node = e.target;
      const { selectionStart, selectionEnd, selectionDirection } = node;
      const nativeInputType = (e.nativeEvent as Event & { inputType?: unknown })
        .inputType;
      const inputType =
        typeof nativeInputType === "string" ? nativeInputType : undefined;
      const { display: sanitized, raw: rawForParent } = applyInputFormat(
        typedValue,
        format,
        inputType,
      );
      if (!isControlled) setUncontrolledValue(sanitized);
      // 네이티브 setter로 실제 DOM value를 rawForParent로 설정한 뒤
      // 원본 이벤트를 그대로 전달 — e.target이 실제 DOM 엘리먼트이므로
      // name, type 등 모든 프로퍼티가 보존된다 (RHF register 호환).
      setNativeValue(node, rawForParent);
      try {
        onChange?.(e);
      } finally {
        // 호출이 끝나면 입력 직후의 DOM 값과 선택 영역을 먼저 복원한다.
        // 일반 setter를 써 React의 값 추적도 실제 표시 값과 동기화한다.
        node.value = typedValue;
        if (selectionStart !== null && selectionEnd !== null) {
          node.setSelectionRange(
            selectionStart,
            selectionEnd,
            selectionDirection ?? undefined,
          );
        }
        if (sanitized !== typedValue) {
          node.value = sanitized;
          if (selectionStart !== null && selectionEnd !== null) {
            node.setSelectionRange(
              getFormattedCursorPosition(typedValue, sanitized, selectionStart),
              getFormattedCursorPosition(typedValue, sanitized, selectionEnd),
              selectionDirection ?? undefined,
            );
          }
        }
      }
    } else {
      if (!isControlled) setUncontrolledValue(typedValue);
      onChange?.(e);
    }
  };

  const handleCompositionStart = (
    e: React.CompositionEvent<HTMLInputElement>,
  ) => {
    if (!format) return;
    isComposing.current = true;
    compositionChanged.current = false;
    setCompositionValue(e.currentTarget.value);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposing.current = false;
    setCompositionValue(null);
    if (!format || !compositionChanged.current) {
      compositionChanged.current = false;
      return;
    }
    compositionChanged.current = false;

    // 조합 중에는 원본 입력을 그대로 전달하고, 확정 후 포맷된 원본 값을 한 번 더 알린다.
    // React의 값 추적이 조합 중 마지막 값과 같을 수 있어 input 이벤트를 다시 감지하게 한다.
    const node = e.currentTarget;
    const typedValue = node.value;
    const { selectionStart, selectionEnd, selectionDirection } = node;
    node.value = typedValue === "" ? "0" : "";
    setNativeValue(node, typedValue);
    if (selectionStart !== null && selectionEnd !== null) {
      node.setSelectionRange(
        selectionStart,
        selectionEnd,
        selectionDirection ?? undefined,
      );
    }
    node.dispatchEvent(
      new InputEvent("input", { bubbles: true, inputType: "insertCompositionText" }),
    );
  };

  // react-hook-form `register` 사용 시 register가 반환하는 ref가 restProps에 섞여 들어옴.
  // 외부 forwardRef + RHF register ref + 내부 inputRef 셋 다 병합해, clearable의 native dispatch가
  // 항상 같은 노드를 향하도록 한다.
  const setMergedInputRef =
    (
      externalRef: React.ForwardedRef<HTMLInputElement>,
      rhfRef?: React.Ref<HTMLInputElement>,
    ) =>
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof externalRef === "function") {
        externalRef(node);
      } else if (externalRef !== null) {
        // RefObject.current는 readonly지만 라이브러리 관례상 ref 콜백이 여기서 값을 씀.
        Object.assign(externalRef, { current: node });
      }
      if (typeof rhfRef === "function") {
        rhfRef(node);
      } else if (rhfRef != null && "current" in rhfRef) {
        Object.assign(rhfRef, { current: node });
      }
    };

  const handleClear = () => {
    if (readOnly) return;
    // input의 native value를 빈 값으로 세팅한 뒤 input 이벤트를 디스패치해
    // 기존 handleChange/onChange 흐름을 그대로 탄다. react-hook-form/format
    // 등 부수 로직이 자연스럽게 따라옴.
    const node = inputRef.current;
    if (!node) return;
    setNativeValue(node, "");
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.focus();
  };

  return {
    displayValue,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    setMergedInputRef,
    handleClear,
  };
}
