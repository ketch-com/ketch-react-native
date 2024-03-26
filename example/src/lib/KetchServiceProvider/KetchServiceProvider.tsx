import {Platform, NativeModules} from 'react-native';
import React, {
  useContext,
  useRef,
  useState,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import {View} from 'react-native';
import WebView, {type WebViewMessageEvent} from 'react-native-webview';

import {KetchServiceContext} from '../context';
import {
  PreferenceExperienceOptions,
  type KetchMobile,
  type KetchService,
  OnMessageEventData,
} from '../types';
import {Action, reducer} from './reducer';
import {EventName, KetchDataCenter, LogLevel, PrivacyProtocol} from '../enums';
import styles from './styles';
import {createOptionsString, createUrlParamsString} from '../util/helpers';
import {savePrivacyToStorage} from '../util/services';

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
  identities = {email: 'test@ketch.com'},
  languageCode = deviceLanguage,
  regionCode,
  jurisdictionCode = 'default',
  environmentName,
  dataCenter = KetchDataCenter.US,
  logLevel = LogLevel.ERROR,
  forceConsentExperience = false,
  forcePreferenceExperience = false,
  preferenceExperienceOptions,
  children,
  onEnvironmentUpdated,
  onRegionUpdated,
  onJurisdictionUpdated,
  onIdentitiesUpdated,
  onConsentUpdated,
  onPrivacyStringUpdated,
  onError,
}) => {
  const webViewRef = useRef<WebView>(null);
  const source = require('../index.html');

  const [isVisible, setIsVisible] = useState(false);

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
    onPrivacyStringUpdated,
    onError,
  });

  useEffect(() => {
    const urlParams = createUrlParamsString(parameters);

    console.log('parameters', parameters);

    webViewRef.current?.injectJavaScript(
      `location.assign(location.origin+location.pathname+"?orgCode=${parameters.organizationCode}&propertyName=${parameters.propertyCode}"+"${urlParams}")`,
    );
  }, [parameters]);

  const showConsentExperience = useCallback(() => {
    webViewRef.current?.injectJavaScript('ketch("showConsent")');
  }, []);

  const showPreferenceExperience = useCallback(
    (preferencesOptions?: Partial<PreferenceExperienceOptions>) => {
      let expression = 'ketch("showPreferences")';

      if (preferencesOptions) {
        const preferencesOptionsSerialized =
          createOptionsString(preferencesOptions);

        console.log(
          'preferencesOptionsSerialized',
          preferencesOptionsSerialized,
        );

        expression = `ketch("showPreferences", ${preferencesOptionsSerialized})`;
      }

      webViewRef.current?.injectJavaScript(expression);
    },
    [],
  );

  useEffect(() => {
    if (forceConsentExperience) {
      showConsentExperience();
    }

    if (forcePreferenceExperience) {
      showPreferenceExperience(preferenceExperienceOptions);
    }
  }, [
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
      dispatch({type: Action.UPDATE_PARAMETERS, payload: params});
    },
    [dispatch],
  );

  const handleMessageRecieve = (e: WebViewMessageEvent) => {
    const data = JSON.parse(e.nativeEvent.data) as OnMessageEventData;

    console.log('message', JSON.stringify(data));

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

      case EventName.updateCCPA:
        savePrivacyToStorage(data.data);
        parameters.onPrivacyStringUpdated?.(
          PrivacyProtocol.USPrivacy,
          data.data,
        );
        break;

      case EventName.updateGPP:
        savePrivacyToStorage(data.data);
        parameters.onPrivacyStringUpdated?.(PrivacyProtocol.GPP, data.data);
        break;

      case EventName.updateTCF:
        savePrivacyToStorage(data.data);
        parameters.onPrivacyStringUpdated?.(PrivacyProtocol.TCF, data.data);
        break;

      case EventName.error:
        onError?.(data.data);
        break;

      default:
        break;
    }
  };

  return (
    <KetchServiceContext.Provider
      value={{
        showConsentExperience,
        showPreferenceExperience,
        dismissExperience,
        updateParameters,
      }}>
      {children}

      <View
        style={[styles.container, isVisible ? styles.shown : styles.hidden]}>
        <WebView
          ref={webViewRef}
          source={source}
          javaScriptEnabled
          webviewDebuggingEnabled
          domStorageEnabled
          onMessage={handleMessageRecieve}
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
