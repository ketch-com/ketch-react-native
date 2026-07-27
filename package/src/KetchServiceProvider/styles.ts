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

  hidden: { opacity: 0, pointerEvents: 'none' },
});
