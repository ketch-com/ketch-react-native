import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const styles = StyleSheet.create({
  title: {
    color: 'black',
    fontSize: 20,
  },

  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    color: 'grey',
  },
});

type Props = {
  title?: string;
  subtitle?: string;
  children?: React.ReactElement;
};

export const Section: React.FC<Props> = ({title, subtitle, children}) => {
  return (
    <View>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
};
