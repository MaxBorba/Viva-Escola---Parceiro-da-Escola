/**
 * Utilities for Brazilian Brasília timezone (UTC-3)
 */

export function getBrasiliaCurrentDateTime(): {
  iso: string;
  formatted: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm:ss
  displayDate: string; // DD/MM/YYYY
  displayTime: string; // HH:mm:ss
} {
  const now = new Date();
  
  // Format to Brasília timezone
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const day = parts.find(p => p.type === 'day')?.value || '01';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const year = parts.find(p => p.type === 'year')?.value || '2026';
  const hour = parts.find(p => p.type === 'hour')?.value || '12';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  const second = parts.find(p => p.type === 'second')?.value || '00';

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}:${second}`;
  const displayDate = `${day}/${month}/${year}`;
  const displayTime = `${hour}:${minute}`;
  const formatted = `${displayDate} às ${displayTime} (Horário de Brasília)`;

  return {
    iso: now.toISOString(),
    formatted,
    dateStr,
    timeStr,
    displayDate,
    displayTime
  };
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(dateString: string): string {
  if (!dateString) return '-';
  try {
    if (dateString.includes('-')) {
      const [y, m, d] = dateString.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Calcula a data de retenção de 06 meses (180 dias) para os registros
 */
export function getSixMonthsRetentionDate(baseDate?: string): {
  iso: string;
  formatted: string;
  daysRemaining: number;
} {
  const base = baseDate ? new Date(baseDate) : new Date();
  const retention = new Date(base);
  retention.setMonth(retention.getMonth() + 6);

  const now = new Date();
  const diffMs = retention.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const day = String(retention.getDate()).padStart(2, '0');
  const month = String(retention.getMonth() + 1).padStart(2, '0');
  const year = retention.getFullYear();

  return {
    iso: retention.toISOString(),
    formatted: `${day}/${month}/${year}`,
    daysRemaining
  };
}

