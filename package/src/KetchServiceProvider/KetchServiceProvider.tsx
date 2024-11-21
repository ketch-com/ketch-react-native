import React, {
  useContext,
  useRef,
  useState,
  useReducer,
  useCallback,
  useEffect,
} from 'react';

import {
  Platform,
  NativeModules,
  View,
  Linking,
  StatusBar,
  Dimensions,
} from 'react-native';
import WebView, {
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';

import type {
  PreferenceExperienceOptions,
  KetchMobile,
  KetchService,
  OnMessageEventData,
  Consent,
} from '../types';

import {
  EventName,
  KetchDataCenter,
  LogLevel,
  PrivacyProtocol,
} from '../enums';

import { KetchServiceContext } from '../context';
import { Action, reducer } from './reducer';
import { createOptionsString, savePrivacyToStorage } from '../util';
import { getIndexHtml } from '../assets';
import styles from './styles';
import crossPlatformSave from '../util/crossPlatformSave';
import wrapSharedPrefences from '../util/wrapSharedPrefences';

interface KetchServiceProviderParams extends KetchMobile {
  children: JSX.Element;
}

const deviceLanguage: string =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    : NativeModules.I18nManager.localeIdentifier;

export const KetchServiceProvider: React.FC<KetchServiceProviderParams> = ({
  organizationCode,
  propertyCode,
  identities,
  languageCode = deviceLanguage,
  regionCode,
  jurisdictionCode,
  environmentName,
  dataCenter = KetchDataCenter.US,
  logLevel = LogLevel.ERROR,
  forceConsentExperience = false,
  forcePreferenceExperience = false,
  preferenceExperienceOptions = {},
  preferenceStorage,
  children,
  onEnvironmentUpdated,
  onRegionUpdated,
  onJurisdictionUpdated,
  onIdentitiesUpdated,
  onConsentUpdated,
  onPrivacyProtocolUpdated,
  onHideExperience,
  onError,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);

  // Calculate android insets manually
  const topPadding =
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const window = Dimensions.get('window'); // Usable screen area
  const screen = Dimensions.get('screen'); // Full screen area
  const bottomPadding =
    Platform.OS === 'android' ? (screen.height - window.height) / 2 : 0;

  // Internal state values which shouldn't cause re-render
  const isForceConsentExperienceShown = useRef(false);
  const isForcePreferenceExperienceShown = useRef(false);
  const consent = useRef<Consent>();

  const [parameters, dispatch] = useReducer(reducer, {
    organizationCode,
    propertyCode,
    identities,
    languageCode,
    regionCode,
    jurisdictionCode,
    environmentName,
    dataCenter,
    logLevel,
    onEnvironmentUpdated,
    onRegionUpdated,
    onJurisdictionUpdated,
    onIdentitiesUpdated,
    onConsentUpdated,
    onPrivacyProtocolUpdated,
    onHideExperience,
    onError,
  });

  const showConsentExperience = useCallback(() => {
    webViewRef.current?.injectJavaScript('ketch("showConsent"); true;');
  }, []);

  const showPreferenceExperience = useCallback(
    (preferencesOptions: Partial<PreferenceExperienceOptions> = {}) => {
      let expression = 'ketch("showPreferences"); true;';

      // Merge the preference options passed as a component property with those passed in this function call
      const mergedOptions = {
        ...preferenceExperienceOptions,
        ...preferencesOptions, // The function call preference options take priority
      };

      if (mergedOptions) {
        const preferencesOptionsSerialized = createOptionsString(mergedOptions);
        expression = `ketch("showPreferences", ${preferencesOptionsSerialized}); true;`;
      }

      webViewRef.current?.injectJavaScript(expression);
    },
    [preferenceExperienceOptions]
  );

  useEffect(() => {
    if (isServiceReady) {
      if (forceConsentExperience && !isForceConsentExperienceShown.current) {
        showConsentExperience();

        isForceConsentExperienceShown.current = true;
      }

      if (
        forcePreferenceExperience &&
        !isForcePreferenceExperienceShown.current
      ) {
        showPreferenceExperience(preferenceExperienceOptions);

        isForcePreferenceExperienceShown.current = true;
      }
    }
  }, [
    isServiceReady,
    forceConsentExperience,
    forcePreferenceExperience,
    preferenceExperienceOptions,
    showConsentExperience,
    showPreferenceExperience,
  ]);

  const dismissExperience = useCallback(() => {
    setIsVisible(false);
  }, []);

  const getConsent = useCallback(() => consent.current, []);

  const updateParameters = useCallback(
    (params: Partial<KetchMobile>) => {
      dispatch({ type: Action.UPDATE_PARAMETERS, payload: params });
    },
    [dispatch]
  );

  const storePreference = preferenceStorage
    ? (() => {
        if ('setItemAsync' in preferenceStorage) {
          return wrapSharedPrefences(preferenceStorage);
        }
        if (typeof preferenceStorage === 'function') {
          return preferenceStorage;
        }

        console.warn(
          'KetchServiceProvider preferenceStorage should be a function or an expected interface, falling back to cross-platform storage helper'
        );
        return crossPlatformSave;
      })()
    : crossPlatformSave;

  const handleMessageReceive = (e: WebViewMessageEvent) => {
    const data = JSON.parse(e.nativeEvent.data) as OnMessageEventData;
    setIsServiceReady(true);
    console.log(`Message: ${data.event}`);

    switch (data.event) {
      case EventName.willShowExperience:
        setIsVisible(true);
        break;

      case EventName.hideExperience:
        parameters.onHideExperience?.(data.data);
        setIsVisible(false);
        break;

      case EventName.tapOutside:
        setIsVisible(false);
        break;

      case EventName.environment:
        parameters.onEnvironmentUpdated?.(data.data);
        break;

      case EventName.regionInfo:
        parameters.onRegionUpdated?.(data.data);
        break;

      case EventName.jurisdiction:
        parameters.onJurisdictionUpdated?.(data.data);
        break;

      case EventName.identities:
        const updatedIdentities = JSON.parse(data.data) as Record<
          string,
          string
        >;
        parameters.onIdentitiesUpdated?.(updatedIdentities);
        break;

      case EventName.consent:
        consent.current = JSON.parse(data.data || {}) as Consent;
        parameters.onConsentUpdated?.(consent.current);
        break;

      case EventName.updateUSPrivacy:
        const usPrivacyArray = JSON.parse(data.data);
        savePrivacyToStorage(usPrivacyArray, storePreference);
        parameters.onPrivacyProtocolUpdated?.(
          PrivacyProtocol.USPrivacy,
          usPrivacyArray
        );
        break;

      case EventName.updateGPP:
        const gppArray = JSON.parse(data.data);
        savePrivacyToStorage(gppArray, storePreference);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.GPP, gppArray);
        break;

      case EventName.updateTCF:
        const tcfArray = JSON.parse(data.data);
        savePrivacyToStorage(tcfArray, storePreference);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.TCF, tcfArray);
        break;

      case EventName.error:
        console.log('Error:', JSON.stringify(data.data));
        onError?.(data.data);
        break;

      default:
        break;
    }
  };

  // Set safe area padding for android
  const injectedJavaScript = `
  document.documentElement.style.setProperty('--safe-area-inset-top', '${topPadding}px');
  document.documentElement.style.setProperty('--safe-area-inset-bottom', '${bottomPadding}px');
  `;

  // Simply render children if no identities passed as SDK cannot be used
  return (
    <KetchServiceContext.Provider
      value={{
        showConsentExperience,
        showPreferenceExperience,
        dismissExperience,
        getConsent,
        updateParameters,
      }}
    >
      {children}
      <View
        style={[styles.container, isVisible ? styles.shown : styles.hidden]}
      >
        <WebView
          ref={webViewRef}
          source={{
            html: getIndexHtml(parameters),
            baseUrl: 'http://localhost',
          }}
          injectedJavaScript={
            Platform.OS === 'android' ? injectedJavaScript : undefined
          }
          originWhitelist={['*']}
          javaScriptEnabled
          allowFileAccess
          webviewDebuggingEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          onMessage={handleMessageReceive}
          onShouldStartLoadWithRequest={(request: WebViewNavigation) => {
            /**
             * Below forces links clicked within the webview (e.g. TOS or Privacy Policy links) to
             * open in an external web browser. This is the default behavior in Android but not iOS,
             * and is desirable because opening links in the same webview creates identity issues.
             */
            if (
              request.navigationType === 'click' &&
              request.url.startsWith('http')
            ) {
              Linking.openURL(request.url); // Open link in external browser
              return false; // Prevent WebView from loading the clicked link
            }
            return true; // Otherwise load other links as normal (e.g. API requests)
          }}
          style={styles.webView}
        />
      </View>
    </KetchServiceContext.Provider>
  );
};

export const useKetchService = () => {
  const context = useContext(KetchServiceContext);
  return context ? context : ({} as KetchService);
};
