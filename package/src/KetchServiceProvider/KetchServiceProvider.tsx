import { Platform, NativeModules } from 'react-native';
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
import { createOptionsString, createUrlParamsString } from '../util/helpers';
import { savePrivacyToStorage } from '../util/services';

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
  const source = require('../index.html');

  const [isVisible, setIsVisible] = useState(false);
  const [isInitialLoadEnd, setIsInitialLoadEnd] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);

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

      webViewRef.current?.injectJavaScript(
        `location.assign(location.origin+location.pathname+"?orgCode=${parameters.organizationCode}&propertyName=${parameters.propertyCode}"+"${urlParams}")`
      );
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
        savePrivacyToStorage(data.data);
        parameters.onPrivacyProtocolUpdated?.(
          PrivacyProtocol.USPrivacy,
          data.data
        );
        break;

      case EventName.updateGPP:
        savePrivacyToStorage(data.data);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.GPP, data.data);
        break;

      case EventName.updateTCF:
        savePrivacyToStorage(data.data);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.TCF, data.data);
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

  return (
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
          originWhitelist={['*']}
          // allowFileAccessFromFileURLs
          // allowUniversalAccessFromFileURLs
          // allowingReadAccessToURL
          source={source}
          javaScriptEnabled
          webviewDebuggingEnabled
          domStorageEnabled
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
