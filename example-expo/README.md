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

In the output, you'll find options to open the app in a

- [development build][development-build] - we're going to need this, because for Android you must use it
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## How to run this app on iOS and Android

If you look at this example app, you'll see two things:

1. A native package `expo-shared-preferences` is installed
2. That package is only imported in the file prefixed with `android` platform

Why this native package is installed? Because iOS can use React Native's [Settings][rn-settings] module, so it doesn't need an additional external native package. So this package only allows Android app to access Android's native APIs.

For Android app, when you start the app, you have to switch to development build - press s in the terminal. When you run Android app on emulator for the first time (press a in the terminal to start this process), it'll create the android/ app in your project directory, and then it'll build a standalone native Android app with Gradle, and install it on your emulator.

For iOS though, technically you're free to use Expo Go, as long as you import Android native packages only for Android, as we do in this example app. Also if you don't have any additional iOS native modules installed. If you do, you probably already have an Xcode project in your root directory, and you don't need any changes made on your end. To use Expo Go, simply scan the QR code with your iPhone's camera app, and it'll open the app in Expo Go on your iPhone, even if you already switched to development build in the terminal, so no need to switch back to Expo Go.

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
