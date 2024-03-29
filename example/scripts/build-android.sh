#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")/.."

# Create assets directory
mkdir -p android/app/src/main/assets/

# Create an android asset file and go back to the project directory
cd android/app/src/main/assets/ && > index.android.bundle && cd -

# Bundle the Android Assets
react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# Remove existing build
rm -rf android/app/build

# Go to android folder, clean and assemble debug
cd android && ./gradlew clean assembleRelease && cd ..