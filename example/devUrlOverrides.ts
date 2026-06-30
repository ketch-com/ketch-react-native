/**
 * Flip ENABLED to redirect UAT tag script URLs to local dev servers.
 */
export const DEV_URL_OVERRIDES_ENABLED = false;

const localKetchSdkFor = (host: string): Record<string, string> => ({
  'https://cdn.ketchjs.com/ketchtag/stable/v2.12/ketch-sdk.js': `http://${host}:9000/ketch-sdk.js`,
  'https://cdn.uat.ketchjs.com/ketchtag/stable/v2.12/ketch-sdk.js': `http://${host}:9000/ketch-sdk.js`,
  'ketch-sdk.js': `http://${host}:9000/ketch-sdk.js`,
});

export const forSimulator = localKetchSdkFor('localhost');
export const forAndroidEmulator = localKetchSdkFor('10.0.2.2');
