const HEX = /^#([0-9a-f]{3,8})$/i;
const FUNCTIONAL = /^rgba?\(([^)]+)\)$/i;

/** Parses hex / rgb() / rgba() into linear-ish 0-1 RGB. Returns null on miss. */
export const parseColor = (value: string): [number, number, number] | null => {
  const trimmed = value.trim();

  const hex = HEX.exec(trimmed);
  if (hex) {
    let digits = hex[1]!;
    if (digits.length === 3 || digits.length === 4) {
      digits = digits
        .split('')
        .map((char) => char + char)
        .join('');
    }
    if (digits.length < 6) {
      return null;
    }
    return [
      parseInt(digits.slice(0, 2), 16) / 255,
      parseInt(digits.slice(2, 4), 16) / 255,
      parseInt(digits.slice(4, 6), 16) / 255,
    ];
  }

  const functional = FUNCTIONAL.exec(trimmed);
  if (functional) {
    const parts = functional[1]!
      .split(/[,/\s]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length < 3) {
      return null;
    }
    const channel = (raw: string): number =>
      raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw) / 255;
    const rgb: [number, number, number] = [
      channel(parts[0]!),
      channel(parts[1]!),
      channel(parts[2]!),
    ];
    return rgb.some((component) => Number.isNaN(component)) ? null : rgb;
  }

  return null;
};

export const mixColor = (
  a: [number, number, number],
  b: [number, number, number],
  amount: number,
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * amount,
  a[1] + (b[1] - a[1]) * amount,
  a[2] + (b[2] - a[2]) * amount,
];
