export function getAvailableStock(
  inventories: Array<{ quantity: number; reservedQuantity?: number }> | undefined | null,
): number {
  if (!inventories || inventories.length === 0) return 0
  return inventories.reduce((sum, inv) => {
    return sum + Math.max(0, (inv.quantity || 0) - (inv.reservedQuantity || 0))
  }, 0)
}
