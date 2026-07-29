export function formatPrice(price: number | string | undefined | null): string {
  if (price == null || isNaN(Number(price))) return '0'
  return Number(price).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })
}
