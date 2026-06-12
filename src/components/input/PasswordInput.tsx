import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

import { Input } from "./Input";
import type { InputProps } from "./types";

type PasswordInputProps = Omit<InputProps, "type" | "trailingIcon">;

/**
 * 비밀번호 입력 — 마스킹 토글(눈 아이콘) 내장.
 * `Input`을 그대로 감싸서 type/trailingIcon만 제어. 다른 prop은 모두 통과.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ disabled, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        {...rest}
        ref={ref}
        disabled={disabled}
        type={visible ? "text" : "password"}
        trailingIcon={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
            className="flex items-center justify-center text-text-tertiary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
