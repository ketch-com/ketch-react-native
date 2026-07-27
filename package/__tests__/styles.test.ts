import { StyleSheet } from 'react-native';

import styles from '../src/KetchServiceProvider/styles';

describe('KetchServiceProvider styles', () => {
  it('positions the WebView overlay full-screen without absoluteFillObject', () => {
    const container = StyleSheet.flatten(styles.container);

    expect(container).toMatchObject({
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 99999,
    });
  });

  it('still fills the screen when StyleSheet.absoluteFillObject is removed (RN 0.85)', () => {
    const legacySpread = {
      ...(undefined as typeof StyleSheet.absoluteFillObject),
      backgroundColor: 'transparent',
      zIndex: 99999,
    };

    expect(StyleSheet.flatten(legacySpread)).not.toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
    });

    expect(StyleSheet.flatten(styles.container)).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
    });
  });
});
