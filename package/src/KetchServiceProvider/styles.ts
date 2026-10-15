import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 99999,
  },

  webView: {
    backgroundColor: 'transparent',
  },

  shown: { display: 'flex' },

  /**
   * Collapse the always-mounted container to 0x0 while no experience is
   * shown. `pointerEvents: 'none'` alone is not enough on Android: the
   * native android.webkit.WebView swallows touches directly and does not
   * honour a React-level parent pointerEvents, so a full-screen hidden
   * WebView blocks every tap on the underlying app. With zero area the
   * WebView stays mounted (JS engine, injectJavaScript and onMessage keep
   * working) but can no longer receive touches.
   */
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
});
