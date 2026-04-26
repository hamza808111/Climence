export const MIN_PM25_THRESHOLD = 1;
export const MAX_PM25_THRESHOLD = 500;

export type AlertThresholdValidation =
  | { ok: true; pm25Threshold: number }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateAlertThresholdInput(input: unknown): AlertThresholdValidation {
  if (!isObject(input)) {
    return { ok: false, error: 'Invalid payload. Expected an object body.' };
  }

  const raw = input.pm25Threshold;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return { ok: false, error: 'Invalid payload. "pm25Threshold" must be a finite number.' };
  }

  if (raw < MIN_PM25_THRESHOLD || raw > MAX_PM25_THRESHOLD) {
    return {
      ok: false,
      error: `Invalid threshold. "pm25Threshold" must be between ${MIN_PM25_THRESHOLD} and ${MAX_PM25_THRESHOLD}.`,
    };
  }

  return { ok: true, pm25Threshold: Math.round(raw * 10) / 10 };
}
