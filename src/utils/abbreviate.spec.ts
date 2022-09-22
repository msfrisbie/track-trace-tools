import { abbreviateString } from "@/utils/abbreviate";

describe("abbreviate.ts", () => {
  it('abbreviateString returns correct first three characters from string', () => {
    expect(abbreviateString('5%-ax4 mars',0,3)).toBe('5%a');
    expect(abbreviateString('A-E-4 DeathMonkey',0,3)).toBe('AE4');
    expect(abbreviateString('Glorious Cookies 4/20/2022',0,3)).toBe('Glo');
  })

  it('abbreviateString performs correct length evaluations', () => {
    expect(abbreviateString('5%-ax4 mars',0,3)).toHaveLength(3);
    expect(abbreviateString('A-E-4 DeathMonkey',0,3)).toHaveLength(3);
    expect(abbreviateString('Glorious Cookies 4/20/2022',0,3)).toHaveLength(3);
  })

  it('abbreviateString performs empty evaluation', () => {
    expect(abbreviateString('',0,3)).toBe('');
  })
});