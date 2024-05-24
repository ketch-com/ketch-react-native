import { Platform, NativeModules } from 'react-native';
import React, {
  useContext,
  useRef,
  useState,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { KetchServiceContext } from '../context';
import type {
  PreferenceExperienceOptions,
  KetchMobile,
  KetchService,
  OnMessageEventData,
  Consent,
} from '../types';
import { Action, reducer } from './reducer';
import {
  EventName,
  KetchDataCenter,
  LogLevel,
  PrivacyProtocol,
} from '../enums';
import styles from './styles';
import {
  createOptionsString,
  createUrlParamsObject,
  savePrivacyToStorage,
  usePrevious,
} from '../util';

import content from '../assets/index';

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
  const [isVisible, setIsVisible] = useState(false);
  const [isLoadEnd, setIsLoadEnd] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);

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
    onError,
  });

  const prevParameters = usePrevious(parameters);
  const injectedJs = useMemo(() => {
    const urlParams = createUrlParamsObject(parameters);

    return `window.parameters = ${JSON.stringify(urlParams)}; true;`;
  }, [parameters]);

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

  useEffect(() => {
    if (isLoadEnd && prevParameters !== parameters) {
      webViewRef.current?.reload();

      setIsLoadEnd(false);
    }
  }, [isLoadEnd, parameters, prevParameters]);

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

  const handleMessageReceive = (e: WebViewMessageEvent) => {
    const data = JSON.parse(e.nativeEvent.data) as OnMessageEventData;

    setIsServiceReady(true);

    console.log(`Message: ${data.event}`);

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
        consent.current = JSON.parse(data.data || {}) as Consent;
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
        console.log('Error:', JSON.stringify(data.data));
        onError?.(data.data);
        break;

      default:
        break;
    }
  };

  const onLoadEnd = () => {
    if (!isLoadEnd) {
      webViewRef.current?.injectJavaScript('initKetchTag(); true;');
      setIsLoadEnd(true);
    }
  };

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
          source={{ html: content, baseUrl: 'http://localhost' }}
          injectedJavaScriptBeforeContentLoaded={injectedJs}
          originWhitelist={['*']}
          javaScriptEnabled
          allowFileAccess
          webviewDebuggingEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          onMessage={handleMessageReceive}
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
