import type { InputFormat, InputValue } from "./types";

/**
 * 숫자에 콤마를 추가해요
 */
function addCommas(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 콤마를 제거해요
 */
function removeCommas(value: string): string {
  return value.replace(/,/g, "");
}

/**
 * 전화번호에 하이픈을 추가해요
 * @example "01012345678" → "010-1234-5678"
 */
export function transformToPhoneNumber(value: InputValue): string {
  const cleaned = value.toString().replace(/[^\d]/g, "");

  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  if (cleaned.length <= 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
}

/**
 * 전화번호에서 하이픈을 제거해요
 * @example "010-1234-5678" → "01012345678"
 */
export function resetFromPhoneNumber(value: InputValue): string {
  return value.toString().replace(/-/g, "");
}

/**
 * 사업자등록번호에 하이픈을 추가해요
 * @example "1234567890" → "12-345-67890"
 */
export function transformToBusinessNumber(value: InputValue): string {
  const cleaned = value.toString().replace(/[^\d]/g, "").slice(0, 10);

  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
}

/**
 * 사업자등록번호에서 하이픈을 제거해요
 * @example "12-345-67890" → "1234567890"
 */
export function resetFromBusinessNumber(value: InputValue): string {
  return value.toString().replace(/[^\d]/g, "").slice(0, 10);
}

/**
 * 금액에 콤마를 추가해요
 * @example "1000000" → "1,000,000"
 */
export function transformToPrice(value: InputValue): string {
  const cleaned = value.toString().replace(/[^\d]/g, "");
  if (!cleaned) return "";
  return addCommas(cleaned);
}

/**
 * 금액에서 콤마를 제거해요
 * @example "1,000,000" → "1000000"
 */
export function resetFromPrice(value: InputValue): string {
  return removeCommas(value.toString());
}

/**
 * 내장 Format 객체
 */
export const inputFormats = {
  /**
   * 전화번호 포맷
   * transform: "01012345678" → "010-1234-5678"
   * reset: "010-1234-5678" → "01012345678"
   */
  phoneNumber: {
    transform: transformToPhoneNumber,
    reset: resetFromPhoneNumber,
  } as InputFormat,

  /**
   * 사업자등록번호 포맷
   * transform: "1234567890" → "12-345-67890"
   * reset: "12-345-67890" → "1234567890"
   */
  businessNumber: {
    transform: transformToBusinessNumber,
    reset: resetFromBusinessNumber,
  } as InputFormat,

  /**
   * 금액 포맷
   * transform: "1000000" → "1,000,000"
   * reset: "1,000,000" → "1000000"
   */
  price: {
    transform: transformToPrice,
    reset: resetFromPrice,
  } as InputFormat,
} as const;
