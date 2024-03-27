import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 99999,
  },

  webView: {
    backgroundColor: 'transparent',
  },

  shown: {display: 'flex'},

  hidden: {display: 'none'},
});
