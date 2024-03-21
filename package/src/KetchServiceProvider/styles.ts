import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 99999,
  },

  webView: {
    backgroundColor: 'transparent',
  },

  shown: { transform: [{ scale: 1 }] },

  hidden: { transform: [{ scale: 0 }] },
});
