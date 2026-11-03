import type { ApiPayrollFrequency } from '@/types';

export interface PayrollPeriod {
  periodStartDate: string;
  periodEndDate: string;
}

/** `Date` → `YYYY-MM-DD` (fecha local, sin corrimiento de UTC). */
function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISO(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/**
 * Resuelve el período que le toca pagar a un empleado según su frecuencia y
 * la fecha de referencia. **Espejo exacto** de
 * `shared/domain/payroll/period.ts` del backend (que es quien manda al cargar
 * o al pagar): existe en el front para recalcular el período al cambiar la
 * frecuencia en línea, sin una llamada al servidor.
 */
export function resolvePayrollPeriod(
  frequency: ApiPayrollFrequency,
  referenceDate: string,
): PayrollPeriod {
  const reference = parseISO(referenceDate);

  switch (frequency) {
    case 'DAILY': {
      const iso = toISO(reference);
      return { periodStartDate: iso, periodEndDate: iso };
    }

    case 'WEEKLY': {
      const day = reference.getDay();
      const offsetToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(reference);
      start.setDate(reference.getDate() + offsetToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { periodStartDate: toISO(start), periodEndDate: toISO(end) };
    }

    case 'FORTNIGHTLY': {
      const year = reference.getFullYear();
      const month = reference.getMonth();
      if (reference.getDate() <= 15) {
        return {
          periodStartDate: toISO(new Date(year, month, 1)),
          periodEndDate: toISO(new Date(year, month, 15)),
        };
      }
      const lastDay = new Date(year, month + 1, 0).getDate();
      return {
        periodStartDate: toISO(new Date(year, month, 16)),
        periodEndDate: toISO(new Date(year, month, lastDay)),
      };
    }

    case 'MONTHLY': {
      const year = reference.getFullYear();
      const month = reference.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      return {
        periodStartDate: toISO(new Date(year, month, 1)),
        periodEndDate: toISO(new Date(year, month, lastDay)),
      };
    }
  }
}
