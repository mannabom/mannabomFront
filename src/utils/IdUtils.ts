/**
 * 외부 API ID는 값의 크기나 형식에 관여하지 않고 문자열로 보존합니다.
 * 이전 서버의 숫자 응답은 JSON 파싱 후에도 안전한 양의 정수인 경우에만 호환합니다.
 */
export const toExternalId = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (
      !normalized ||
      normalized === '0' ||
      normalized === '-1' ||
      /^(?:null|undefined|nan)$/i.test(normalized) ||
      /[\u0000-\u001F\u007F]/.test(normalized)
    ) {
      return null;
    }
    return normalized;
  }

  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return String(value);
  }

  return null;
};

export const requireExternalId = (
  value: unknown,
  fieldName = 'id',
): string => {
  const normalized = toExternalId(value);
  if (!normalized) {
    throw new Error(`${fieldName}가 없는 잘못된 서버 응답입니다.`);
  }
  return normalized;
};
