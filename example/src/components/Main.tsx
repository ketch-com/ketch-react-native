/**
 * Sample React Native Main
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  Button,
  Image,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInputEndEditingEventData,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import {RadioList} from './UI';

import {
  useKetchService,
  KetchDataCenter,
  PreferenceTab,
} from '@ketch-com/ketch-react-native';
import DefaultPreference from 'react-native-default-preference';
import {Section} from './Section/Section';
import {LabeledTextInput} from './LabeledTextInput/LabeledTextInput';
import {dataCenterLabels, preferenceTabLabels} from '../labels';

// Comput list options
const API_REGIONS = Object.values(KetchDataCenter).map(region => ({
  key: region,
  label: dataCenterLabels[region],
}));

const PREFERENCE_TABS = Object.values(PreferenceTab).map(preferenceTab => ({
  key: preferenceTab as string,
  label: preferenceTabLabels[preferenceTab],
}));

function Main(): React.JSX.Element {
  const {showConsentExperience, showPreferenceExperience} = useKetchService();

  return (
    <SafeAreaView style={styles.background}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/doceree_logo_long.png')}
          style={styles.docereeImage}
        />
        <Image
          source={require('../assets/o_plus.png')}
          style={styles.ketchImage}
        />
        <Image
          source={require('../assets/ketch_round_logo.png')}
          style={styles.ketchImage}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>React Native{'\n'}SDK Demo</Text>
        <View style={styles.actionButtons}>
          <GradientButton title="Consent" onClick={showConsentExperience} />
          <GradientButton
            title="Preference"
            onClick={showPreferenceExperience}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const GradientButton: React.FC<{title: string; onClick?: () => void}> = ({
  title,
  onClick,
}) => (
  <LinearGradient
    colors={['#af63e1', '#6d40f3']}
    start={{x: 0, y: 0}}
    end={{x: 1, y: 0}}
    style={styles.gradient}>
    <TouchableOpacity onPress={onClick}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  </LinearGradient>
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
  },

  imageContainer: {
    marginTop: 40,
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  ketchImage: {
    width: 50,
    height: 50,
  },

  docereeImage: {
    width: 200,
    height: 50,
  },

  body: {
    display: 'flex',
    gap: 10,
    marginTop: 50,
  },

  title: {
    color: 'black',
    fontSize: 48,
    fontWeight: '400',
    marginBottom: 40,
    textAlign: 'center',
  },

  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 20,
  },

  gradient: {
    width: 150,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },

  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default Main;
