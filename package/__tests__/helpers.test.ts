import {
  createUrlParamsObject,
  getWebViewConfigKey,
} from '../src/util/helpers';
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

  it('maps UAT data center to dev CDN', () => {
    const params = createUrlParamsObject({
      organizationCode: 'acme',
      propertyCode: 'prop',
      dataCenter: KetchDataCenter.UAT,
    });

    expect(params.ketch_mobilesdk_url).toBe('https://dev.ketchcdn.com/web/v3');
  });

  it('changes web view config key when data center changes', () => {
    const base = {
      organizationCode: 'acme',
      propertyCode: 'prop',
    };
    const usKey = getWebViewConfigKey({
      ...base,
      dataCenter: KetchDataCenter.US,
    });
    const uatKey = getWebViewConfigKey({
      ...base,
      dataCenter: KetchDataCenter.UAT,
    });

    expect(usKey).not.toBe(uatKey);
  });
});
