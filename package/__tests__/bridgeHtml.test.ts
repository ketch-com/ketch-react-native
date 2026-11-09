import { getIndexHtml } from '../src/assets';
import type { KetchMobile } from '../src/types';

const parameters = {
  organizationCode: 'org',
  propertyCode: 'prop',
} as unknown as KetchMobile;

describe('getIndexHtml', () => {
  it('does not emit tapOutside, so tapping outside the banner leaves it open', () => {
    const html = getIndexHtml(parameters);

    expect(html).not.toContain('tapOutside');
    expect(html).not.toContain("addEventListener('touchstart'");
  });
});
