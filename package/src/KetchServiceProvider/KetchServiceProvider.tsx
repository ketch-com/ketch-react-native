// import React, {
//   createContext,
//   useContext,
//   useRef,
//   useState,
//   useReducer,
//   useCallback,
//   useEffect,
// } from 'react';
// import WebView, { type WebViewMessageEvent } from 'react-native-webview';

// import { ShownComponent, type KetchMobile, type KetchService } from '../types';
// import styles from './styles';
// import { Action, initialParameters, reducer } from './reducer';
// import { View } from 'react-native';

// interface KetchServiceProviderParams extends KetchMobile {
//   orgPropertyNameCode: string;
//   children: JSX.Element;
// }

// type EventName =
//   | 'consent'
//   | 'environment'
//   | 'geoip'
//   | 'identities'
//   | 'jurisdiction'
//   | 'regionInfo'
//   | 'willShowExperience'
//   | 'hideExperience';

// interface OnMessageEventData {
//   event: string;
//   data: EventName;
// }

// const KetchServiceContext = createContext<KetchService>({
//   shownComponent: null,
//   showConsent: () => {},
//   showPreferences: () => {},
//   hide: () => {},
//   updateParameters: () => {},
// });

// export const KetchServiceProvider = ({
//   organization,
//   orgPropertyNameCode,
//   children,
// }: KetchServiceProviderParams) => {
//   const webViewRef = useRef<WebView>(null);
//   const source = require('../index.html');

//   const [shownComponent, setShownComponent] = useState<ShownComponent | null>(
//     null
//   );
//   const [isVisible, setIsVisible] = useState(false);

//   const [parameters, dispatch] = useReducer(reducer, {
//     ...initialParameters,
//     organization,
//     orgPropertyNameCode,
//   });

//   useEffect(() => {
//     if (shownComponent === ShownComponent.CONSENT) {
//       webViewRef.current?.injectJavaScript(`ketch('showConsent')`);
//     }

//     if (shownComponent === ShownComponent.PREFERENCES) {
//       webViewRef.current?.injectJavaScript(`ketch('showPreferences')`);
//     }

//     if (shownComponent === null) {
//       setIsVisible(false);
//     }
//   }, [shownComponent]);

//   const showConsent = useCallback(() => {
//     setShownComponent(ShownComponent.CONSENT);
//   }, []);

//   const showPreferences = useCallback(() => {
//     setShownComponent(ShownComponent.PREFERENCES);
//   }, []);

//   const hide = useCallback(() => {
//     setShownComponent(null);
//   }, []);

//   const updateParameters = (params: Partial<KetchMobile>) => {
//     dispatch({ type: Action.UPDATE_PARAMETERS, payload: params });
//   };

//   const handleMessageRecieve = (e: WebViewMessageEvent) => {
//     const data = JSON.parse(e.nativeEvent.data) as OnMessageEventData;
//     console.log('onMessage', data);
//     switch (data.event) {
//       case 'willShowExperience':
//         setIsVisible(true);
//         break;

//       case 'hideExperience':
//       case 'experienceClosed':
//       case 'tapOutside':
//         setIsVisible(false);
//         break;

//       default:
//         break;
//     }
//   };

//   return (
//     <KetchServiceContext.Provider
//       value={{
//         shownComponent,
//         showConsent,
//         showPreferences,
//         hide,
//         updateParameters,
//       }}
//     >
//       {children}

//       <View
//         style={[styles.container, isVisible ? styles.shown : styles.hidden]}
//       >
//         <WebView
//           ref={webViewRef}
//           source={source}
//           javaScriptEnabled
//           webviewDebuggingEnabled
//           domStorageEnabled
//           injectedJavaScriptObject={{
//             orgCode: parameters.organization,
//             orgPropertyNameCode: parameters.orgPropertyNameCode,
//           }}
//           onMessage={handleMessageRecieve}
//           style={styles.webView}
//         />
//       </View>
//     </KetchServiceContext.Provider>
//   );
// };

// export const useKetchService = () => {
//   const context = useContext(KetchServiceContext);

//   return context ? context : ({} as KetchService);
// };
