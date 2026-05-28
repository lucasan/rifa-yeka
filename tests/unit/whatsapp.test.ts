import { buildPagueUrl } from '@/lib/whatsapp';

describe('buildPagueUrl', () => {
  it('builds wa.me url with pre-filled message including name and numbers', () => {
    const url = buildPagueUrl({ name: 'Ana Pérez', numbers: [3, 47, 88, 12, 91] });
    expect(url).toMatch(/^https:\/\/wa\.me\/573244255786\?text=/);
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('Ana Pérez');
    expect(decoded).toContain('03, 47, 88, 12, 91');
  });

  it('pads single-digit numbers to two digits', () => {
    const url = buildPagueUrl({ name: 'X', numbers: [0, 5, 9, 10, 99] });
    const decoded = decodeURIComponent(url.split('text=')[1]);
    expect(decoded).toContain('00, 05, 09, 10, 99');
  });
});
