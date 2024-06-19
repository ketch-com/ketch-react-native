# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   yarn
   ```

2. Start the app

   ```bash
   yarn start
   ```

> If running your app on Android, you must hit S to switch to a development build

- [Development build][development-build] - **For Android you must use this** - See [this page](https://docs.expo.dev/develop/development-builds/create-a-build/) to setup a development build
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/) - Must be using a development build first per the above step
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Using a Development Build

If you look at this example app, you'll see two things:

1. A native package `expo-shared-preferences` is installed

2. That package is only imported in the [SharedPreferences.android.ts](utils/SharedPreferences.android.ts) file, which has the `android` platform extension

The iOS platform doesn't need a separate package as it can use React Native's [Settings][rn-settings] module.

When running the app on Android, you have to switch to [development build](https://docs.expo.dev/develop/development-builds/create-a-build/) by pressing S in the terminal after running `yarn start`.

When you run the Android app on an emulator for the first time (by pressing A in the terminal), it will create the `android/app` directory in your project. Next it will build a standalone native Android app with Gradle, and install it on your emulator.

For iOS, you're free to use Expo Go or a development buid.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

[development-build]: https://docs.expo.dev/develop/development-builds/introduction/
[rn-settings]: https://reactnative.dev/docs/settings
