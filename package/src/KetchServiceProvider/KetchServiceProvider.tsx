import { Platform, NativeModules, Image } from 'react-native';
import React, {
  useContext,
  useRef,
  useState,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import { View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { KetchServiceContext } from '../context';
import type {
  PreferenceExperienceOptions,
  KetchMobile,
  KetchService,
  OnMessageEventData,
} from '../types';
import { Action, reducer } from './reducer';
import {
  EventName,
  KetchDataCenter,
  LogLevel,
  PrivacyProtocol,
} from '../enums';
import styles from './styles';
import { createOptionsString, createUrlParamsString } from '../util';
import { savePrivacyToStorage } from '../util';

interface KetchServiceProviderParams extends KetchMobile {
  children: JSX.Element;
}

const deviceLanguage: string =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
    : NativeModules.I18nManager.localeIdentifier;

const indexHtml = require('../assets/local-index.html');

const BASE_URL =
  Platform.OS === 'ios'
    ? Image.resolveAssetSource(indexHtml).uri
    : 'file:///android_asset/custom/local-index.html';

console.log('BASE_URL', BASE_URL);

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
  children,
  onEnvironmentUpdated,
  onRegionUpdated,
  onJurisdictionUpdated,
  onIdentitiesUpdated,
  onConsentUpdated,
  onPrivacyProtocolUpdated,
  onError,
}) => {
  const webViewRef = useRef<WebView>(null);
  const isForceConsentExperienceShown = useRef(false);
  const isForcePreferenceExperienceShown = useRef(false);

  const [source, setSource] = useState(BASE_URL);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitialLoadEnd, setIsInitialLoadEnd] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);

  // Set flag and warn if no identities passed
  const noIdentities = !Object.keys(identities).length;
  if (noIdentities) {
    console.warn(
      'You must pass at least one identity to KetchServiceProvider to use the Ketch React Native SDK.'
    );
  }

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
    onError,
  });

  useEffect(() => {
    if (isInitialLoadEnd) {
      const urlParams = createUrlParamsString(parameters);

      const sourceUri =
        BASE_URL +
        `?a=a&orgCode=${parameters.organizationCode}&propertyName=${parameters.propertyCode}` +
        urlParams;

      console.log('BASE_URL', sourceUri);

      setSource(sourceUri);
    }
  }, [parameters, isInitialLoadEnd]);

  const showConsentExperience = useCallback(() => {
    webViewRef.current?.injectJavaScript('ketch("showConsent")');
  }, []);

  const showPreferenceExperience = useCallback(
    (preferencesOptions: Partial<PreferenceExperienceOptions> = {}) => {
      let expression = 'ketch("showPreferences")';

      // Merge the preference options passed as a component property with those passed in this function call
      const mergedOptions = {
        ...preferenceExperienceOptions,
        ...preferencesOptions, // The function call preference options take priority
      };

      if (mergedOptions) {
        const preferencesOptionsSerialized = createOptionsString(mergedOptions);

        console.log(
          'preferencesOptionsSerialized',
          preferencesOptionsSerialized
        );

        expression = `ketch("showPreferences", ${preferencesOptionsSerialized})`;
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

  const updateParameters = useCallback(
    (params: Partial<KetchMobile>) => {
      console.log(params);
      dispatch({ type: Action.UPDATE_PARAMETERS, payload: params });
    },
    [dispatch]
  );

  const handleMessageRecieve = (e: WebViewMessageEvent) => {
    const data = JSON.parse(e.nativeEvent.data) as OnMessageEventData;

    console.log('message', JSON.stringify(data));
    setIsServiceReady(true);

    switch (data.event) {
      case EventName.willShowExperience:
        setIsVisible(true);
        break;

      case EventName.hideExperience:
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
        parameters.onIdentitiesUpdated?.(data.data);
        break;

      case EventName.consent:
        parameters.onConsentUpdated?.(data.data);
        break;

      case EventName.updateUSPrivacy:
        const usPrivacyArray = JSON.parse(data.data);
        savePrivacyToStorage(usPrivacyArray);
        parameters.onPrivacyProtocolUpdated?.(
          PrivacyProtocol.USPrivacy,
          usPrivacyArray
        );
        break;

      case EventName.updateGPP:
        const gppArray = JSON.parse(data.data);
        savePrivacyToStorage(gppArray);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.GPP, gppArray);
        break;

      case EventName.updateTCF:
        const tcfArray = JSON.parse(data.data);
        savePrivacyToStorage(tcfArray);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.TCF, tcfArray);
        break;

      case EventName.error:
        onError?.(data.data);
        break;

      default:
        break;
    }
  };

  const onLoadEnd = () => {
    setIsInitialLoadEnd(true);
  };

  // Simply render children if no identities passed as SDK cannot be used
  return noIdentities ? (
    children
  ) : (
    <KetchServiceContext.Provider
      value={{
        showConsentExperience,
        showPreferenceExperience,
        dismissExperience,
        updateParameters,
      }}
    >
      {children}

      <View
        style={[styles.container, isVisible ? styles.shown : styles.hidden]}
      >
        <WebView
          ref={webViewRef}
          source={{ uri: source }}
          allowingReadAccessToURL={source}
          originWhitelist={['*']}
          javaScriptEnabled
          allowFileAccess
          webviewDebuggingEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          onMessage={handleMessageRecieve}
          onLoadEnd={onLoadEnd}
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
