export function formatNumber(value: number | string): string {
  const str = String(value).replace(/\D/g, "");
  if (!str) return "";
  const num = parseInt(str, 10);
  if (isNaN(num)) return "";
  return num.toLocaleString("en-US");
}

export function parseFormattedNumber(value: string): number {
  const cleaned = String(value).replace(/\D/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}
export function formatIQD(amount: number | string): string {
  const num =
    typeof amount === "string"
      ? parseFormattedNumber(amount)
      : Number(amount);
  if (isNaN(num)) return "0 IQD";
  return `${num.toLocaleString("en-US")} IQD`;
}

export function formatAmountDisplay(amount: number | string): string {
  return formatIQD(amount);
}
