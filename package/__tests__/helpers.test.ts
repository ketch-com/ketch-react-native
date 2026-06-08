import { createUrlParamsObject } from '../src/util/helpers';
import { KetchDataCenter, LogLevel } from '../src/enums';

describe('createUrlParamsObject', () => {
  it('includes ketch_att when ketchAtt is set', () => {
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.US,
      ketchAtt: 'denied',
    });

    expect(params.ketch_att).toBe('denied');
    expect(params.organizationCode).toBe('acme');
  });

  it('maps data center and log level', () => {
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.US,
      logLevel: LogLevel.ERROR,
    });

    expect(params.ketch_mobilesdk_url).toContain('web/v3');
    expect(params.ketch_log).toBe(LogLevel.ERROR);
  });
});
