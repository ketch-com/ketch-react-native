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

async function runTest() {
  const driver = await remote(wdOpts);
  try {
    console.log(await driver.getPageSource());
    console.log(
      await driver
        .$(
          '//android.widget.TextView[@text="Edit App.tsx! to change this screen and then come back to see your edits."]',
        )
        .isDisplayed(),
    );
    console.log(
      await driver
        .$('//android.view.ViewGroup[@resource-id="appium-test"]')
        .isDisplayed(),
    );
  } finally {
    await driver.pause(1000);
    await driver.deleteSession();
  }
}

runTest().catch(console.error);

// describe('Android tests', () => {
//   let driver;

//   beforeAll(async () => {
//     // Setup driver
//     driver = await wdio.remote(wdOpts);
//   });

//   // afterAll(async () => {
//   //   // Tear down driver
//   //   await driver.deleteSession();
//   // });

//   test('element text should be correct', async () => {
//     // Replace the below with your actual element selector and expected text
//     const element = await driver.$('#appText');
//     const elements = await driver.$$('#appText');
//     console.log(element);
//     console.log(elements);
//     // const element = driver.findElementById('appText');
//     // const text = await element.getText();
//     // console.log(text);

//     // Jest assertion
//     expect('abc').toBe('abc');
//   });
// });

// async function runTest() {
//   const driver = await remote(wdOpts);
//   try {
//     // Replace the below test actions with actions specific to your app
//     const elements = await driver.getPageSource();
//     // driver.waitUntil(
//     //   () => driver.execute(() => document.readyState === 'complete'),
//     //   {
//     //     timeout: 60 * 1000, // 60 seconds
//     //     timeoutMsg: 'Message on failure',
//     //   },
//     // );
//     console.log(elements);
//     // const someElement = await driver.$('id:appium-test');
//     // await someElement.click();
//     // Add more actions as needed
//   } finally {
//     await driver.pause(1000);
//     await driver.deleteSession();
//   }
// }

// runTest().catch(console.error);
