/**
 * 한 번의 사용자 동작과 그 네트워크 재시도에 공통으로 사용할 키를 만든다.
 *
 * 결제용 보안 토큰이 아니라 중복 처리 방지용 식별자이므로 암호학적 난수일
 * 필요는 없다. 호출부에서 네트워크 재시도 바깥에서 한 번만 생성해야 한다.
 */
export const createIdempotencyKey = (scope: string): string => {
  const normalizedScope =
    scope.trim().replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 40) || 'request';
  const random = `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;

  return `${normalizedScope}-${Date.now().toString(36)}-${random}`;
};
