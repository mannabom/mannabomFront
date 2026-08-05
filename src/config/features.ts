/**
 * 아직 백엔드 계약과 운영 준비가 끝나지 않은 기능의 단일 제어 지점입니다.
 * 각 기능이 준비되기 전에는 테스트 빌드에서 진입 경로를 노출하지 않습니다.
 */
export const FEATURE_FLAGS = Object.freeze({
  store: false,
  gifticon: false,
  payments: false,
});
