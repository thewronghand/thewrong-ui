type ScaledRange = { min: bigint; max: bigint };

function decimalParts(value: string) {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integerPart = "", fraction = ""] = unsigned.split(".");
  return { negative, integer: integerPart || "0", fraction };
}

function expandScientific(value: string) {
  const [coefficient = "", exponentText] = value.toLowerCase().split("e");
  if (exponentText === undefined) return value;
  const exponent = Number(exponentText);
  const negative = coefficient.startsWith("-");
  const unsigned = negative ? coefficient.slice(1) : coefficient;
  const [integer = "", fraction = ""] = unsigned.split(".");
  const digits = `${integer}${fraction}`.replace(/^0+(?=\d)/, "");
  const decimalIndex = integer.length + exponent;
  const expanded =
    decimalIndex <= 0
      ? `0.${"0".repeat(-decimalIndex)}${digits}`
      : decimalIndex >= digits.length
        ? `${digits}${"0".repeat(decimalIndex - digits.length)}`
        : `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
  return negative ? `-${expanded}` : expanded;
}

function powerOfTen(exponent: number) {
  return 10n ** BigInt(exponent);
}

function scaledInput(value: string, decimalPlaces: number) {
  const { negative, integer, fraction } = decimalParts(value);
  const scale = powerOfTen(decimalPlaces);
  const fractional = BigInt(
    fraction.slice(0, decimalPlaces).padEnd(decimalPlaces, "0") || "0",
  );
  const magnitude = BigInt(integer) * scale + fractional;
  return negative ? -magnitude : magnitude;
}

function scaledBound(
  value: number | undefined,
  decimalPlaces: number,
  direction: "min" | "max",
) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const { negative, integer, fraction } = decimalParts(
    expandScientific(String(value)),
  );
  const scale = powerOfTen(decimalPlaces);
  const fractional = BigInt(
    fraction.slice(0, decimalPlaces).padEnd(decimalPlaces, "0") || "0",
  );
  const magnitude = BigInt(integer) * scale + fractional;
  const hasDiscardedFraction = /[1-9]/.test(fraction.slice(decimalPlaces));
  if (!negative) {
    return direction === "min" && hasDiscardedFraction
      ? magnitude + 1n
      : magnitude;
  }
  return direction === "max" && hasDiscardedFraction
    ? -(magnitude + 1n)
    : -magnitude;
}

function hasCandidateInRange(
  range: ScaledRange,
  min: bigint | undefined,
  max: bigint | undefined,
) {
  return (
    (min === undefined || range.max >= min) &&
    (max === undefined || range.min <= max)
  );
}

function hasReachableCompletion(
  value: string,
  decimalPlaces: number,
  min: number | undefined,
  max: number | undefined,
) {
  const { negative, integer, fraction } = decimalParts(value);
  const fractionPart = value.includes(".") ? fraction : undefined;
  const remaining = decimalPlaces - fraction.length;
  const base = scaledInput(value, decimalPlaces);
  const fractionLimit = powerOfTen(Math.max(0, remaining)) - 1n;
  const fractionalRange = negative
    ? { min: base - fractionLimit, max: base }
    : { min: base, max: base + fractionLimit };
  const minBound = scaledBound(min, decimalPlaces, "min");
  const maxBound = scaledBound(max, decimalPlaces, "max");
  if (hasCandidateInRange(fractionalRange, minBound, maxBound)) {
    return true;
  }
  if (fractionPart !== undefined || integer === "0") return false;

  // 정수 접두사는 뒤에 숫자를 붙여 만들 수 있는 구간만 검사한다.
  // 예를 들어 [50, 55]는 5로 시작할 수 있지만 6으로는 만들 수 없다.
  if (
    (!negative && maxBound === undefined) ||
    (negative && minBound === undefined)
  ) {
    return true;
  }
  const prefix = BigInt(integer);
  const scale = powerOfTen(decimalPlaces);
  for (let exponent = 1; exponent < 309; exponent += 1) {
    const power = powerOfTen(exponent);
    const lowerMagnitude = prefix * power;
    const upperMagnitude = (prefix + 1n) * power - 1n;
    const range = negative
      ? {
          min: -(upperMagnitude * scale + (scale - 1n)),
          max: -(lowerMagnitude * scale),
        }
      : {
          min: lowerMagnitude * scale,
          max: upperMagnitude * scale + (scale - 1n),
        };
    if (hasCandidateInRange(range, minBound, maxBound)) return true;
    if (
      (!negative &&
        maxBound !== undefined &&
        lowerMagnitude * scale > maxBound) ||
      (negative &&
        minBound !== undefined &&
        -(lowerMagnitude * scale) < minBound)
    )
      return false;
  }
  return false;
}

/** 입력 가능한 초안과 부모에 전달 가능한 숫자를 구분한다. */
export function validateDecimalDraft(
  next: string,
  {
    decimalPlaces,
    allowNegative,
    min,
    max,
  }: {
    decimalPlaces: number;
    allowNegative: boolean;
    min?: number;
    max?: number;
  },
): "reject" | "draft" | "empty" | "value" {
  const sign = allowNegative ? "-?" : "";
  const places = Math.max(0, Math.floor(decimalPlaces));
  const integer = "(?:0|[1-9]\\d*)";
  const fraction = places > 0 ? `(?:\\.\\d{0,${places}})?` : "";
  const leadingFraction = places > 0 ? `|\\.\\d{0,${places}}` : "";
  const pattern = new RegExp(
    `^${sign}(?:${integer}${fraction}${leadingFraction})?$`,
  );
  if (next !== "" && next !== "-" && !pattern.test(next)) return "reject";
  if (next === "-" && !allowNegative) return "reject";
  if (next === "") return "empty";
  if (next === "-") return "draft";
  if (!Number.isFinite(Number(next))) return "reject";
  if (!hasReachableCompletion(next, places, min, max)) return "reject";
  const scaled = scaledInput(next, places);
  const minBound = scaledBound(min, places, "min");
  const maxBound = scaledBound(max, places, "max");
  const inRange =
    (minBound === undefined || scaled >= minBound) &&
    (maxBound === undefined || scaled <= maxBound);
  return !next.endsWith(".") && inRange ? "value" : "draft";
}
