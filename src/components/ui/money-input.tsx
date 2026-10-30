import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, type InputProps } from './input';

/** Agrupación en-US mientras se escribe (misma convención que formatCurrency). */
const GROUP_FORMATTER = new Intl.NumberFormat('es-US', {
  maximumFractionDigits: 2,
});

/**
 * Currency es-US con 2 decimales — misma convención que `formatCurrency`:
 * `5000` → `"5,000.00"`. Se aplica al salir del campo y al precargar.
 */
function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function displayValue(value: number): string {
  return Number.isFinite(value) && value !== 0 ? formatMoney(value) : '';
}

/**
 * Muestra el número agrupado mientras se escribe sin pisar los decimales en
 * curso: `12500` → `12,500`, pero `12.50` se queda en `12.50` (no `12.5`).
 */
function formatWhileTyping(raw: string): string {
  if (raw === '') return '';
  const dot = raw.indexOf('.');
  if (dot === -1) {
    const integer = Number.parseFloat(raw);
    return Number.isFinite(integer) ? GROUP_FORMATTER.format(integer) : raw;
  }
  const integerPart = raw.slice(0, dot);
  const decimals = raw.slice(dot + 1);
  const integer = Number.parseFloat(integerPart || '0');
  const grouped = Number.isFinite(integer)
    ? GROUP_FORMATTER.format(integer)
    : integerPart;
  return decimals === '' ? `${grouped}.` : `${grouped}.${decimals}`;
}

/**
 * Interpreta lo tecleado:
 * - comas **nuestras** (las de agrupación del texto formateado anterior) se
 *   quitan: borrar en `"5,000"` da `"5,000"`→`"5,000"[sin último]` = `"500"`,
 *   nunca `"5.00"`;
 * - comas **tecledas por el usuario** = decimal a la española si lleva 1-2
 *   dígitos (`12,5` → `12.5`);
 * - punto con grupos de 3 = miles (`5.000` → `5000`); resto de puntos =
 *   decimal (`12.50` → `12.5`).
 * Devuelve `NaN` sin dígitos (zod muestra el error de campo obligatorio).
 */
function parseMoneyInput(
  input: string,
  isGroupingComma?: (index: number) => boolean,
): { raw: string; value: number } {
  // Limpia conservando los índices originales para clasificar las comas
  let cleaned = '';
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === ',') {
      if (isGroupingComma?.(i)) continue; // nuestra, de agrupación
      cleaned += char; // tecleada por el usuario
    } else if ((char >= '0' && char <= '9') || char === '.') {
      cleaned += char;
    }
  }

  const lastComma = cleaned.lastIndexOf(',');
  if (lastComma !== -1) {
    const before = cleaned.slice(0, lastComma);
    const after = cleaned.slice(lastComma + 1);
    if (!before.includes('.') && /^\d{1,2}$/.test(after)) {
      cleaned = `${before}.${after}`;
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  // Miles a la española: "5.000" / "1.234.567" (grupos exactos de 3)
  if (/^\d{1,3}(?:\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '');
  } else {
    const dot = cleaned.indexOf('.');
    if (dot !== -1) {
      cleaned =
        cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
    }
  }

  const value = Number.parseFloat(cleaned);
  return { raw: cleaned, value: Number.isFinite(value) ? value : Number.NaN };
}

/**
 * Mapea la posición del cursor desde el texto tecleado (`raw`, ya saneado)
 * hasta el texto formateado, contando dígitos **y** las comas de agrupación
 * que introduce el formato (en-US: grupos de 3 desde la derecha). Sin esto,
 * el cursor queda antes de las comas/punto y los siguientes caracteres se
 * insertan en el medio (p.ej. "5000.00" → "500,000.00").
 */
function caretFromRaw(raw: string, rawCaret: number): number {
  const dot = raw.indexOf('.');
  const intLen = dot === -1 ? raw.length : dot;

  if (rawCaret <= intLen) {
    const total = intLen;
    const before = rawCaret;
    if (total === 0 || before === 0) return before;
    const commasTotal = Math.floor((total - 1) / 3);
    const commasBefore = commasTotal - Math.floor((total - before) / 3);
    return before + Math.max(0, commasBefore);
  }

  // Cursor en la zona decimal: entero completo (con sus comas) + lo tecleado
  const commasTotal = intLen < 2 ? 0 : Math.floor((intLen - 1) / 3);
  return intLen + commasTotal + (rawCaret - intLen);
}

export interface MoneyInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** Valor numérico — react-hook-form lo mantiene como `number`. */
  value: number;
  /** Entrega el número interpretado; `NaN` cuando el campo queda vacío. */
  onValueChange: (value: number) => void;
}

/**
 * Input de dinero: agrupa miles mientras se escribe (`12,345.50`) y al salir
 * del campo formatea a currency con 2 decimales (`5,000.00`) vía
 * `Intl.NumberFormat` (misma convención que `formatCurrency`).
 * Uso con react-hook-form vía `Controller`:
 *
 * ```tsx
 * <Controller
 *   control={control}
 *   name="price"
 *   render={({ field }) => (
 *     <MoneyInput value={field.value} onValueChange={field.onChange} />
 *   )}
 * />
 * ```
 */
export function MoneyInput({
  value,
  onValueChange,
  className,
  onFocus,
  onBlur,
  ...props
}: MoneyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const focusedRef = React.useRef(false);
  /** Posición del cursor (ya mapeada al texto formateado) a restaurar. */
  const caretPosRef = React.useRef<number | null>(null);
  const [text, setText] = React.useState(() => displayValue(value));
  /** Último texto que NOSOTROS formateamos: de ahí salen "nuestras" comas. */
  const lastFormattedRef = React.useRef(text);

  // Sincroniza cambios externos (precarga al editar, reset del formulario).
  // No depende solo del foco: si el texto visible ya representa al valor
  // (p.ej. "1,500.50" ↔ 1500.5), no se toca — así nunca se recortan los
  // decimales en curso aunque el evento de foco llegue tarde.
  React.useEffect(() => {
    if (focusedRef.current) return;
    const textNumber = parseMoneyInput(text).value;
    const textAlreadyMatches =
      text !== '' &&
      Number.isFinite(value) &&
      Number.isFinite(textNumber) &&
      Math.abs(textNumber - value) < 0.005;
    if (textAlreadyMatches) return;
    const formatted = displayValue(value);
    lastFormattedRef.current = formatted;
    setText(formatted);
  }, [value, text]);

  // Restaura el cursor tras el formato. `useLayoutEffect` corre antes del
  // siguiente teclado/pintado: si fuera `useEffect`, una tecla rápida podría
  // entrar en la ventana y quedar mal colocada (insertando en el medio).
  React.useLayoutEffect(() => {
    const element = inputRef.current;
    const position = caretPosRef.current;
    caretPosRef.current = null;
    if (!element || position === null || document.activeElement !== element) {
      return;
    }
    const clamped = Math.min(position, element.value.length);
    element.setSelectionRange(clamped, clamped);
  }, [text]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const display = event.target.value;
    const displayCaret = event.target.selectionStart ?? 0;
    const previous = lastFormattedRef.current;
    // ¿Qué comas puso el formulario (agrupación) y cuáles el usuario?
    const isGroupingComma = (index: number) => previous[index] === ',';

    const { raw, value: parsed } = parseMoneyInput(display, isGroupingComma);

    // Cursor: quita solo las comas de agrupación (la decimal del usuario
    // se conserva como punto en `raw`).
    let groupingBeforeCaret = 0;
    for (let i = 0; i < displayCaret && i < display.length; i += 1) {
      if (display[i] === ',' && isGroupingComma(i)) groupingBeforeCaret += 1;
    }
    const rawCaret = displayCaret - groupingBeforeCaret;
    caretPosRef.current = caretFromRaw(raw, rawCaret);

    const formatted = formatWhileTyping(raw);
    lastFormattedRef.current = formatted;
    setText(formatted);
    onValueChange(parsed);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    focusedRef.current = true;
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    focusedRef.current = false;
    onBlur?.(event);

    if (text === '') {
      onValueChange(Number.NaN); // campo vacío = valor inválido
      lastFormattedRef.current = '';
      return;
    }
    // Máximo 2 decimales (el backend rechaza más con maxDecimalPlaces: 2)
    const rounded = Number.isFinite(value)
      ? Number(value.toFixed(2))
      : Number.NaN;
    onValueChange(rounded);
    if (!Number.isFinite(rounded)) {
      lastFormattedRef.current = '';
      setText('');
      return;
    }
    // Currency con 2 decimales automáticos: 5000 → "5,000.00"
    const formatted = formatMoney(rounded);
    lastFormattedRef.current = formatted;
    setText(formatted);
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={cn(className)}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
