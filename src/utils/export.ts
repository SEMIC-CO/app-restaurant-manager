/**
 * Escapa una celda CSV: envuelve en comillas cuando contiene `;`, comillas o
 * saltos de línea (reglas de RFC 4180, con `;` como separador para Excel
 * en español).
 */
function escapeCell(value: string | number): string {
  const text = String(value ?? '');
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Etiqueta legible de un rango `AAAA-MM-DD` para exportaciones:
 * `"AAAA-MM-DD a AAAA-MM-DD"`, o `"todo el histórico"` cuando no hay fechas.
 */
export function formatRangeLabel(
  range:
    | { dateFrom?: string | null; dateTo?: string | null }
    | null
    | undefined,
): string {
  if (!range || (!range.dateFrom && !range.dateTo)) return 'todo el histórico';
  return `${range.dateFrom ?? '…'} a ${range.dateTo ?? '…'}`;
}

/**
 * Descarga un archivo CSV (UTF-8 con BOM, separador `;`) a partir de
 * encabezados y filas. El BOM hace que Excel detecte la codificación.
 *
 * ```ts
 * downloadCsv('reporte-financiero', ['Método', 'Total'], [['Cash', 600]]);
 * ```
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  const lines = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) => row.map(escapeCell).join(';')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
