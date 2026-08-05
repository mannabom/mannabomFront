import { requireExternalId, toExternalId } from '../src/utils/IdUtils';

describe('external ID normalization', () => {
  it('preserves opaque string IDs without numeric conversion', () => {
    expect(toExternalId(' 9223372036854775807 ')).toBe(
      '9223372036854775807',
    );
    expect(toExternalId('profile-01HXYZ')).toBe('profile-01HXYZ');
  });

  it('supports only safe positive legacy numeric IDs', () => {
    expect(toExternalId(123)).toBe('123');
    expect(toExternalId(0)).toBeNull();
    expect(toExternalId(-1)).toBeNull();
    expect(toExternalId(Number.NaN)).toBeNull();
    expect(toExternalId(undefined)).toBeNull();
    expect(toExternalId(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
  });

  it('rejects missing IDs and requires mandatory IDs explicitly', () => {
    expect(toExternalId('   ')).toBeNull();
    expect(toExternalId('0')).toBeNull();
    expect(toExternalId('-1')).toBeNull();
    expect(toExternalId('null')).toBeNull();
    expect(toExternalId('undefined')).toBeNull();
    expect(toExternalId('room\ninjected-header:value')).toBeNull();
    expect(() => requireExternalId(null, 'profileId')).toThrow(
      'profileId가 없는 잘못된 서버 응답입니다.',
    );
  });
});
