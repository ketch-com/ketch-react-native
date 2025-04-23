const path = require('path');
const {remote} = require('webdriverio');

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android',
  'appium:app': path.join(
    __dirname,
    '../android/app/build/outputs/apk/debug/app-debug.apk',
  ),
};

const wdOpts = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  logLevel: 'error',
  capabilities,
};

// Initialize the Appium driver
async function initDriver() {
  return await remote(wdOpts);
}

describe('Android', () => {
  let driver;

  // Before each test, create a new webdriver instance
  beforeEach(async () => {
    driver = await initDriver();
  });

  // After each test, tear down the webdriver instance
  afterEach(async () => {
    await driver.deleteSession();
  });

  it('should find test element', async () => {
    const element = await driver.$('//*[@resource-id="appium-test"]');
    const isDisplayed = await element.isDisplayed();
    expect(isDisplayed).toBeTruthy();
  });

  it('should not find test element', async () => {
    const element = await driver.$(
      '//*[@resource-id="appium-test-not-defined"]',
    );
    const isDisplayed = await element.isDisplayed();
    expect(isDisplayed).toBeFalsy();
  });
});
