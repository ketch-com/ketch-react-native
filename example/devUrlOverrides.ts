/**
 * Flip ENABLED to redirect UAT tag script URLs to local dev servers.
 */
export const DEV_URL_OVERRIDES_ENABLED = false;

/** Android emulator alias for the host machine's loopback interface. */
const ANDROID_EMULATOR_HOST = '10.0.2.2';

const buildLocalKetchSdkOverrides = (
  host: string,
): Record<string, string> => {
  const localSdkUrl = `http://${host}:9000/ketch-sdk.js`;
  return {
    'https://cdn.ketchjs.com/ketchtag/stable/v2.12/ketch-sdk.js': localSdkUrl,
    'https://cdn.uat.ketchjs.com/ketchtag/stable/v2.12/ketch-sdk.js':
      localSdkUrl,
    'ketch-sdk.js': localSdkUrl,
  };
};

export const forSimulator = buildLocalKetchSdkOverrides('localhost');
export const forAndroidEmulator =
  buildLocalKetchSdkOverrides(ANDROID_EMULATOR_HOST);
