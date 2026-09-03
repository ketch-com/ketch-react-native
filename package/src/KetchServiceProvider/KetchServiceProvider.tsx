import React, {
  useContext,
  useRef,
  useState,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  type ReactElement,
} from 'react';

import { Platform, View, Linking, StatusBar, Dimensions } from 'react-native';
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
  type TriggerName,
} from '../enums';

import { KetchServiceContext } from '../context';
import { Action, reducer } from './reducer';
import {
  buildTriggerExpression,
  createOptionsString,
  getWebViewConfigKey,
  savePrivacyToStorage,
  getDeviceLanguageTag,
  getGPPHDRGppString,
  getSavedString,
  getTCFTCString,
  getUSPrivacyString,
  isValidTriggerFunctionName,
  normalizeKetchMobileSdkUrl,
  toHideExperienceArgument,
  toWillShowExperienceType,
} from '../util';
import {
  getIndexHtml,
  injectCssIntoHtml,
  injectWebResourceUrlOverridesIntoHtml,
  getWebResourceUrlOverridesInjectionScript,
} from '../assets';
import styles from './styles';
import nativeStorage from '../util/nativeStorage';
import {
  clearManagedIdentity,
  managedIdentityKey,
  resolveManagedIdentity,
  setCachedManagedIdentity,
  withResolvedManagedIdentity,
  type ResolvedManagedIdentity,
} from '../util/managedIdentity';
import wrapSharedPrefences from '../util/wrapSharedPrefences';
import wrapSharedPrefencesRead from '../util/wrapSharedPrefencesRead';
import { KetchHeadless } from '../headless';
import type {
  ConsentConfig,
  ConsentUpdate,
  FullConfigurationRequest,
  InvokeRightRequest,
  PreferenceQRRequest,
  SubscriptionsRequest,
} from '../headless/headlessTypes';
import { jurisdictionCodeFromConfig } from '../headless/headlessTypes';
import {
  trackingAuthorizationStatusString,
  ATT_LAST_STORAGE_KEY,
} from '../trackingAuthorization';

interface KetchServiceProviderParams extends KetchMobile {
  children: ReactElement;
  /**
   * Initial CSS override string to inject into the WebView.
   * Must be pure CSS (no HTML tags).
   */
  cssOverride?: string;
}

const containsHTMLTags = (css: string): boolean => /<[a-zA-Z]/.test(css);
const isWithin1kb = (css: string): boolean =>
  typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(css).length <= 1024
    : css.length <= 1024;

export const KetchServiceProvider: React.FC<KetchServiceProviderParams> = ({
  organizationCode,
  propertyCode,
  identities,
  languageCode = getDeviceLanguageTag(),
  regionCode,
  jurisdictionCode,
  environmentName,
  dataCenter = KetchDataCenter.US,
  logLevel = LogLevel.ERROR,
  age,
  ageLower,
  ageUpper,
  ketchAtt,
  ketchAttPrev,
  forceConsentExperience = false,
  forcePreferenceExperience = false,
  preferenceExperienceOptions = {},
  preferenceStorage,
  webResourceUrlOverrides,
  ketchMobileSdkUrl,
  autoLoad = true,
  children,
  onEnvironmentUpdated,
  onRegionUpdated,
  onJurisdictionUpdated,
  onIdentitiesUpdated,
  onConsentUpdated,
  onPrivacyProtocolUpdated,
  onWillShowExperience,
  onHideExperience,
  onHasShownExperience,
  onNativeStoragePut,
  onError,
  cssOverride: initialCssOverride,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [shouldLoadWebView, setShouldLoadWebView] = useState(autoLoad);
  const [webViewReloadNonce, setWebViewReloadNonce] = useState(0);
  const [resolvedKetchAtt, setResolvedKetchAtt] = useState<string | undefined>(
    undefined
  );
  const [resolvedKetchAttPrev, setResolvedKetchAttPrev] = useState<
    string | undefined
  >(undefined);
  const [isAttReady, setIsAttReady] = useState(Platform.OS !== 'ios');
  const [resolvedManagedIdentity, setResolvedManagedIdentity] = useState<
    ResolvedManagedIdentity | undefined
  >(undefined);
  const [isManagedIdentityReady, setIsManagedIdentityReady] = useState(false);
  const resolvedManagedIdentityKeyRef = useRef<string | undefined>(undefined);

  // CSS override state
  const [cssOverrideState, setCssOverrideState] = useState<string | undefined>(
    () => {
      if (typeof initialCssOverride === 'string') {
        if (containsHTMLTags(initialCssOverride)) {
          console.warn(
            '[Ketch] CSS override rejected: must not contain HTML tags!'
          );
          return undefined;
        }
        if (!isWithin1kb(initialCssOverride)) {
          console.warn(
            '[Ketch] CSS override rejected: CSS too long (>1kb limit)!'
          );
          return undefined;
        }
        return initialCssOverride;
      }
      return undefined;
    }
  );

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
  const consent = useRef<Consent>({});

  // Deferred trigger() call, fired once the tag reports its config is loaded.
  // Depth is 1: a later trigger supersedes an earlier pending one.
  const pendingTriggerRef = useRef<string | null>(null);
  const isConfigLoadedRef = useRef(false);

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
    age,
    ageLower,
    ageUpper,
    ketchAtt,
    ketchAttPrev,
    webResourceUrlOverrides,
    ketchMobileSdkUrl,
    onEnvironmentUpdated,
    onRegionUpdated,
    onJurisdictionUpdated,
    onIdentitiesUpdated,
    onConsentUpdated,
    onPrivacyProtocolUpdated,
    onWillShowExperience,
    onHideExperience,
    onHasShownExperience,
    onNativeStoragePut,
    onError,
  });

  const headlessApi = useMemo(
    () =>
      new KetchHeadless({
        dataCenter: parameters.dataCenter,
        baseUrl: normalizeKetchMobileSdkUrl(parameters.ketchMobileSdkUrl),
      }),
    [parameters.dataCenter, parameters.ketchMobileSdkUrl]
  );

  /**
   * Region code, preferring a locally set regionCode over a GeoIP lookup.
   * The lookup is cached for the lifetime of `headlessApi`.
   */
  const getRegion = useCallback(async (): Promise<string | undefined> => {
    if (parameters.regionCode) return parameters.regionCode;
    return headlessApi.getRegion();
  }, [headlessApi, parameters.regionCode]);

  /**
   * Jurisdiction code, preferring a locally set jurisdictionCode over the value
   * resolved by the CDN configuration.
   */
  const getJurisdiction = useCallback(async (): Promise<string | undefined> => {
    if (parameters.jurisdictionCode) return parameters.jurisdictionCode;
    const config = await headlessApi.getFullConfiguration({
      organizationCode: parameters.organizationCode,
      propertyCode: parameters.propertyCode,
      environmentCode: parameters.environmentName,
      languageCode: parameters.languageCode,
      regionCode: parameters.regionCode,
    });
    return jurisdictionCodeFromConfig(config);
  }, [
    headlessApi,
    parameters.jurisdictionCode,
    parameters.organizationCode,
    parameters.propertyCode,
    parameters.environmentName,
    parameters.languageCode,
    parameters.regionCode,
  ]);

  const getBootstrapConfiguration = useCallback(
    () =>
      headlessApi.getBootstrapConfiguration(
        parameters.organizationCode,
        parameters.propertyCode
      ),
    [headlessApi, parameters.organizationCode, parameters.propertyCode]
  );

  const getFullConfiguration = useCallback(
    (request: FullConfigurationRequest) =>
      headlessApi.getFullConfiguration(request),
    [headlessApi]
  );

  const fetchConsent = useCallback(
    (config: ConsentConfig) => headlessApi.getConsent(config),
    [headlessApi]
  );

  const setConsentOnServer = useCallback(
    (update: ConsentUpdate) => headlessApi.setConsentOnServer(update),
    [headlessApi]
  );

  const invokeRight = useCallback(
    (request: InvokeRightRequest) => headlessApi.invokeRight(request),
    [headlessApi]
  );

  const getSubscriptions = useCallback(
    (request: SubscriptionsRequest) => headlessApi.getSubscriptions(request),
    [headlessApi]
  );

  const setSubscriptions = useCallback(
    (request: SubscriptionsRequest) => headlessApi.setSubscriptions(request),
    [headlessApi]
  );

  const preferenceQRUrl = useCallback(
    (request: PreferenceQRRequest) => headlessApi.preferenceQRUrl(request),
    [headlessApi]
  );

  const managedIdentityCacheKey = managedIdentityKey(
    parameters.organizationCode,
    parameters.propertyCode
  );

  // Only the identities section is needed, and it does not vary by environment,
  // jurisdiction or language, so none of those are passed. Keeping them out also
  // stops a language or region change from re-resolving the identifier.
  const loadIdentityConfiguration = useCallback(
    () =>
      headlessApi.getIdentityConfiguration({
        organizationCode: parameters.organizationCode,
        propertyCode: parameters.propertyCode,
      }),
    [headlessApi, parameters.organizationCode, parameters.propertyCode]
  );

  /**
   * The identity map the SDK supplies, including the Ketch-managed identifier.
   * Resolves rather than reading the cache, so a call made before the effect below
   * has finished still returns the identifier instead of omitting it.
   */
  const getIdentities = useCallback(
    (): Promise<Record<string, string>> =>
      withResolvedManagedIdentity(
        parameters.identities,
        managedIdentityCacheKey,
        loadIdentityConfiguration
      ),
    [parameters.identities, managedIdentityCacheKey, loadIdentityConfiguration]
  );

  /**
   * Wipes the stored Ketch-managed identifier. A new one is minted on the next
   * launch, which starts a new consent record. Identities passed as props are
   * unaffected.
   *
   * Deliberately leaves `resolvedManagedIdentity` alone: it feeds `webViewMountKey`,
   * so clearing it would remount the webview and re-boot the tag mid-session. The
   * already-booted tag keeps the old value until the next launch.
   */
  const clearIdentities = useCallback(async (): Promise<void> => {
    await clearManagedIdentity();
  }, []);

  const webViewParameters = useMemo(() => {
    const att = parameters.ketchAtt ?? resolvedKetchAtt;
    const attPrev = parameters.ketchAttPrev ?? resolvedKetchAttPrev;
    const withAtt = att ? { ...parameters, ketchAtt: att } : parameters;
    const withAttPrev = attPrev
      ? { ...withAtt, ketchAttPrev: attPrev }
      : withAtt;
    if (!resolvedManagedIdentity) {
      return withAttPrev;
    }
    return {
      ...withAttPrev,
      identities: {
        [resolvedManagedIdentity.variable]: resolvedManagedIdentity.value,
        ...parameters.identities,
      },
    };
  }, [
    parameters,
    resolvedKetchAtt,
    resolvedKetchAttPrev,
    resolvedManagedIdentity,
  ]);

  const webViewMountKey = useMemo(
    () =>
      `${getWebViewConfigKey(webViewParameters)}|${cssOverrideState ?? ''}|${webViewReloadNonce}`,
    [webViewParameters, cssOverrideState, webViewReloadNonce]
  );

  // A remount discards the booted tag, but a trigger already queued against it is carried
  // over rather than dropped — the caller was already told trigger() succeeded, so it is
  // drained against the new tag once onConfigLoaded fires again.
  useEffect(() => {
    isConfigLoadedRef.current = false;
  }, [webViewMountKey]);

  const webResourceUrlOverrideScript = useMemo(
    () =>
      getWebResourceUrlOverridesInjectionScript(
        webViewParameters.webResourceUrlOverrides
      ),
    [webViewParameters.webResourceUrlOverrides]
  );

  /**
   * Resolve the Ketch-managed identifier before the webview mounts. Injecting it later
   * would change `webViewMountKey` and re-boot the tag.
   */
  useEffect(() => {
    let cancelled = false;
    // Only the first resolve for a given property gates the mount. A reload re-checks
    // config in the background: the stored identifier does not change, so unmounting
    // the webview to wait on the network again would blank a working experience.
    // A different property does gate, since the space code in state is then the
    // previous property's and the tag would find no identity under it.
    if (resolvedManagedIdentityKeyRef.current !== managedIdentityCacheKey) {
      setIsManagedIdentityReady(false);
    }

    const resolve = async () => {
      // Shared with the headless client, which memoises per property, so a headless
      // call made before this effect finishes waits on the same work rather than
      // starting its own or sending the request without an identifier.
      const resolved = await resolveManagedIdentity(
        managedIdentityCacheKey,
        loadIdentityConfiguration
      );
      if (cancelled) return;
      setCachedManagedIdentity(resolved);
      setResolvedManagedIdentity(resolved);
    };

    resolve()
      .catch((err) => {
        // The property may not use a managed identity, or the config fetch may have
        // failed. Neither should stop the experience from rendering.
        console.warn('[Ketch] managed identity resolution failed', err);
      })
      .finally(() => {
        if (cancelled) return;
        resolvedManagedIdentityKeyRef.current = managedIdentityCacheKey;
        setIsManagedIdentityReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [managedIdentityCacheKey, loadIdentityConfiguration, webViewReloadNonce]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsAttReady(true);
      return;
    }

    let cancelled = false;
    setIsAttReady(false);

    const resolveAtt = async () => {
      const attPrev =
        Platform.OS === 'ios'
          ? (await nativeStorage.read(ATT_LAST_STORAGE_KEY)) || 'notDetermined'
          : undefined;

      if (parameters.ketchAtt) {
        if (!cancelled) {
          setResolvedKetchAttPrev(attPrev);
          setResolvedKetchAtt(parameters.ketchAtt);
          setIsAttReady(true);
        }
        return;
      }

      const att = await trackingAuthorizationStatusString();
      if (!cancelled) {
        setResolvedKetchAttPrev(attPrev);
        setResolvedKetchAtt(att ?? 'notDetermined');
        setIsAttReady(true);
      }
    };

    resolveAtt().catch((err) => {
      console.warn('[Ketch] ATT resolution failed', err);
      if (!cancelled) {
        setResolvedKetchAttPrev((prev) => prev ?? 'notDetermined');
        setResolvedKetchAtt(
          (prev) => prev ?? parameters.ketchAtt ?? 'notDetermined'
        );
        setIsAttReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [parameters.ketchAtt, webViewReloadNonce]);

  /**
   * Load or reload the webview
   */
  const load = useCallback(() => {
    if (shouldLoadWebView) {
      // Remount — reload() drops parameters on Android (react-native-webview#2826).
      setWebViewReloadNonce((prev) => prev + 1);
    } else {
      setShouldLoadWebView(true);
    }
  }, [shouldLoadWebView]);

  /**
   * Show the consent experience
   */
  const showConsentExperience = useCallback(() => {
    // If the webview is not yet loaded when this is called, we load it initially with
    // ?ketch_show=consent
    if (!webViewRef.current) {
      dispatch({ type: Action.KetchShowConsent, payload: {} });
      setShouldLoadWebView(true);
    } else {
      // If the webview is already loaded, we inject the JavaScript to show the consent experience
      webViewRef.current.injectJavaScript('ketch("showConsent"); true;');
    }
  }, []);

  /**
   * Show the preference experience
   */
  const showPreferenceExperience = useCallback(
    (preferencesOptions: Partial<PreferenceExperienceOptions> = {}) => {
      // If the webview is not yet loaded when this is called, we load it initially with
      // ?ketch_show=preferences
      if (!webViewRef.current) {
        dispatch({ type: Action.KetchShowPreference, payload: {} });
        setShouldLoadWebView(true);
      } else {
        // If the webview is already loaded, we inject the JavaScript to show the preference experience
        let expression = 'ketch("showPreferences"); true;';

        // Merge the preference options passed as a component property with those passed in this function call
        const mergedOptions = {
          ...preferenceExperienceOptions,
          ...preferencesOptions, // The function call preference options take priority
        };

        if (mergedOptions) {
          const preferencesOptionsSerialized =
            createOptionsString(mergedOptions);
          expression = `ketch("showPreferences", ${preferencesOptionsSerialized}); true;`;
        }

        webViewRef.current?.injectJavaScript(expression);
      }
    },
    [preferenceExperienceOptions]
  );

  /**
   * Dismiss the experience
   */
  const dismissExperience = useCallback(() => {
    setIsVisible(false);
  }, []);

  /**
   * Fire an onFunction rule trigger
   */
  const trigger = useCallback(
    (
      triggerName: TriggerName,
      functionName: string,
      options: Record<string, unknown> = {}
    ): boolean => {
      if (!isValidTriggerFunctionName(functionName)) {
        console.warn(
          "[Ketch] trigger rejected: functionName must be non-blank and contain only letters, digits, '_', '-', or '.'"
        );
        return false;
      }

      if (isVisible) {
        console.warn(
          `[Ketch] Not triggering '${functionName}' as an experience is already being shown`
        );
        return false;
      }

      const expression = buildTriggerExpression(
        triggerName,
        functionName,
        options
      );

      // true means accepted (injected now or queued) — not that an experience
      // appeared. A queued call only runs after onConfigLoaded; if that never
      // arrives the expression stays pending and is not reported as failure.
      if (
        shouldLoadWebView &&
        isConfigLoadedRef.current &&
        webViewRef.current
      ) {
        pendingTriggerRef.current = null;
        webViewRef.current.injectJavaScript(expression);
      } else {
        pendingTriggerRef.current = expression;
        setShouldLoadWebView(true);
      }

      return true;
    },
    [isVisible, shouldLoadWebView]
  );

  /**
   * Get consent state
   */
  const getConsent = useCallback(() => consent.current, []);

  /**
   * Update KetchServiceProvider parameters
   */
  const updateParameters = useCallback(
    (params: Partial<KetchMobile>) => {
      dispatch({ type: Action.UPDATE_PARAMETERS, payload: params });
    },
    [dispatch]
  );

  // Force show the consent or preference experience initially once the webview loads
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

  /**
   * Method for SDK clients to update CSS at runtime.
   * - Filters out any HTML tags
   * - Limits to 1kb
   * - Triggers WebView remount if updated
   */
  const setCssOverride = useCallback((css: string) => {
    if (containsHTMLTags(css)) {
      console.warn(
        '[Ketch] CSS override rejected: must not contain HTML tags!'
      );
      setCssOverrideState(undefined);
      setWebViewReloadNonce((prev) => prev + 1);
      return;
    }
    if (!isWithin1kb(css)) {
      console.warn('[Ketch] CSS override rejected: CSS too long (>1kb limit)!');
      setCssOverrideState(undefined);
      setWebViewReloadNonce((prev) => prev + 1);
      return;
    }
    setCssOverrideState(css);
  }, []);

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
        return nativeStorage.write;
      })()
    : nativeStorage.write;

  // A preferenceStorage configured as a plain PreferenceBackend function is write-only by
  // construction, so reads fall back to the cross-platform helper in that case too.
  const readPreference = preferenceStorage
    ? (() => {
        if (
          'getItemAsync' in preferenceStorage &&
          preferenceStorage.getItemAsync
        ) {
          return wrapSharedPrefencesRead(preferenceStorage);
        }

        console.warn(
          'KetchServiceProvider preferenceStorage has no getItemAsync; privacy string accessors will read via the cross-platform storage helper instead, which may not reflect what was written'
        );
        return nativeStorage.read;
      })()
    : nativeStorage.read;

  const getSavedStringForContext = useCallback(
    (key: string) => getSavedString(key, readPreference),
    [readPreference]
  );
  const getTCFTCStringForContext = useCallback(
    () => getTCFTCString(readPreference),
    [readPreference]
  );
  const getUSPrivacyStringForContext = useCallback(
    () => getUSPrivacyString(readPreference),
    [readPreference]
  );
  const getGPPHDRGppStringForContext = useCallback(
    () => getGPPHDRGppString(readPreference),
    [readPreference]
  );

  const handleMessageReceive = (e: WebViewMessageEvent) => {
    const data = JSON.parse(e.nativeEvent.data) as OnMessageEventData;
    setIsServiceReady(true);

    switch (data.event) {
      // The tag is booted and can accept imperative calls. Drain a deferred trigger here
      // rather than on isServiceReady, which flips on the first message of any kind.
      case EventName.onConfigLoaded: {
        isConfigLoadedRef.current = true;
        const pendingTrigger = pendingTriggerRef.current;
        // Only clear after a successful inject; keep the queue if the ref is
        // gone (e.g. remount race) so the next onConfigLoaded can drain it.
        if (pendingTrigger && webViewRef.current) {
          pendingTriggerRef.current = null;
          webViewRef.current.injectJavaScript(pendingTrigger);
        }
        break;
      }

      case EventName.willShowExperience:
        parameters.onWillShowExperience?.(toWillShowExperienceType(data.data));
        setIsVisible(true);
        break;

      case EventName.hasShownExperience:
        parameters.onHasShownExperience?.();
        break;

      case EventName.hideExperience:
        parameters.onHideExperience?.(toHideExperienceArgument(data.data));
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
        // Update the consent object with the new purpose consent data
        const consentObject = JSON.parse(data.data || '{}') as Consent;
        consent.current.purposes = consentObject.purposes;
        parameters.onConsentUpdated?.(consent.current);
        break;

      case EventName.updateUSPrivacy:
        const usPrivacyArray = JSON.parse(data.data);

        // Update the consent object with the new US Privacy string
        if (usPrivacyArray.length > 0) {
          consent.current.protocols = {
            ...consent.current.protocols,
            usps: usPrivacyArray[0],
          };
        }

        savePrivacyToStorage(usPrivacyArray, storePreference);
        parameters.onPrivacyProtocolUpdated?.(
          PrivacyProtocol.USPrivacy,
          usPrivacyArray
        );
        break;

      case EventName.updateGPP:
        const gppArray = JSON.parse(data.data);

        // Update the consent object with the new GPP string
        if (gppArray.length > 0) {
          consent.current.protocols = {
            ...consent.current.protocols,
            gpp: gppArray[0],
          };
        }

        savePrivacyToStorage(gppArray, storePreference);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.GPP, gppArray);
        break;

      case EventName.updateTCF:
        const tcfArray = JSON.parse(data.data);

        // Update the consent object with the new TCF string
        if (tcfArray.length > 0) {
          consent.current.protocols = {
            ...consent.current.protocols,
            tcf: tcfArray[0],
          };
        }

        savePrivacyToStorage(tcfArray, storePreference);
        parameters.onPrivacyProtocolUpdated?.(PrivacyProtocol.TCF, tcfArray);
        break;

      case EventName.error:
        console.log('Error:', JSON.stringify(data.data));
        onError?.(data.data);
        break;

      case EventName.openAppSettings:
        if (Platform.OS === 'ios') {
          Linking.openSettings().catch((error) => {
            console.warn('Failed to open app settings:', error);
          });
        }
        break;

      case EventName.nativeStoragePut: {
        if (!data.data) {
          break;
        }
        try {
          const payload = JSON.parse(data.data) as {
            key?: string;
            value?: unknown;
          };
          const key = payload.key?.trim();
          if (!key) {
            break;
          }
          const value = String(payload.value ?? '');
          nativeStorage
            .write(key, value)
            .then(() => parameters.onNativeStoragePut?.(key, value))
            .catch((err) => {
              const message = err instanceof Error ? err.message : String(err);
              console.warn('[Ketch] nativeStoragePut save failed', err);
              onError?.(`nativeStoragePut save failed: ${message}`);
            });
        } catch (err) {
          console.warn('[Ketch] nativeStoragePut parse failed', err);
        }
        break;
      }

      default:
        break;
    }
  };

  // Set safe area padding for android
  const injectedJavaScript = `
  document.documentElement.style.setProperty('--safe-area-inset-top', '${topPadding}px');
  document.documentElement.style.setProperty('--safe-area-inset-bottom', '${bottomPadding}px');
  `;

  const contextValue = useMemo(
    () => ({
      showConsentExperience,
      showPreferenceExperience,
      dismissExperience,
      trigger,
      getConsent,
      updateParameters,
      load,
      setCssOverride,
      getRegion,
      getJurisdiction,
      getSavedString: getSavedStringForContext,
      getTCFTCString: getTCFTCStringForContext,
      getUSPrivacyString: getUSPrivacyStringForContext,
      getGPPHDRGppString: getGPPHDRGppStringForContext,
      getBootstrapConfiguration,
      getFullConfiguration,
      fetchConsent,
      setConsentOnServer,
      invokeRight,
      getSubscriptions,
      setSubscriptions,
      preferenceQRUrl,
      getIdentities,
      clearIdentities,
    }),
    [
      showConsentExperience,
      showPreferenceExperience,
      dismissExperience,
      trigger,
      getConsent,
      updateParameters,
      load,
      setCssOverride,
      getRegion,
      getJurisdiction,
      getSavedStringForContext,
      getTCFTCStringForContext,
      getUSPrivacyStringForContext,
      getGPPHDRGppStringForContext,
      getBootstrapConfiguration,
      getFullConfiguration,
      fetchConsent,
      setConsentOnServer,
      invokeRight,
      getSubscriptions,
      setSubscriptions,
      preferenceQRUrl,
      getIdentities,
      clearIdentities,
    ]
  );

  return (
    <KetchServiceContext.Provider value={contextValue}>
      {children}
      {shouldLoadWebView && isAttReady && isManagedIdentityReady && (
        <View
          style={[styles.container, isVisible ? styles.shown : styles.hidden]}
        >
          <WebView
            key={webViewMountKey}
            ref={webViewRef}
            source={{
              html: injectCssIntoHtml(
                injectWebResourceUrlOverridesIntoHtml(
                  getIndexHtml(webViewParameters),
                  webViewParameters.webResourceUrlOverrides
                ),
                cssOverrideState
              ),
              baseUrl: 'http://localhost',
            }}
            injectedJavaScriptBeforeContentLoaded={webResourceUrlOverrideScript}
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
      )}
    </KetchServiceContext.Provider>
  );
};

export const useKetchService = () => {
  const context = useContext(KetchServiceContext);
  return context ? context : ({} as KetchService);
};
