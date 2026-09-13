export function downloadCsv(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export function exportFileName(entity: string) {
  return `${entity}-export-${new Date().toISOString().split('T')[0]}.csv`
}