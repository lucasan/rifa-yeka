import { validateReserveInput, ReserveValidationError } from '@/lib/reserve';

describe('validateReserveInput', () => {
  const ok = { name: 'Ana Pérez', phone: '3001234567', numbers: [3, 47, 88, 12, 91] };

  it('accepts valid input', () => {
    expect(() => validateReserveInput(ok)).not.toThrow();
  });

  it('rejects fewer than 5 numbers', () => {
    expect(() => validateReserveInput({ ...ok, numbers: [1, 2, 3, 4] }))
      .toThrow(ReserveValidationError);
  });

  it('rejects duplicate numbers', () => {
    expect(() => validateReserveInput({ ...ok, numbers: [1, 1, 2, 3, 4] }))
      .toThrow(/duplicate/);
  });

  it('rejects out-of-range numbers', () => {
    expect(() => validateReserveInput({ ...ok, numbers: [3, 47, 88, 12, 100] }))
      .toThrow(/range/);
  });

  it('rejects short name', () => {
    expect(() => validateReserveInput({ ...ok, name: 'A' })).toThrow(/name/);
  });

  it('rejects malformed phone', () => {
    expect(() => validateReserveInput({ ...ok, phone: 'abc' })).toThrow(/phone/);
  });

  it('accepts Colombian phone with +57 prefix', () => {
    expect(() => validateReserveInput({ ...ok, phone: '+573001234567' })).not.toThrow();
  });

  it('normalizes phone by stripping non-digits', () => {
    const result = validateReserveInput({ ...ok, phone: '+57 300 123 4567' });
    expect(result.phone).toBe('+573001234567');
  });
});
