import React from 'react';
import {StyleSheet, Text, TextInput, TextInputProps, View} from 'react-native';

const styles = StyleSheet.create({
  label: {
    color: 'black',
    fontWeight: '600',
  },

  input: {
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    height: 40,
    minWidth: 115,
  },

  inputView: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
});

type LabeledTextInputProps = {
  label?: string;
  rightAdornment?: React.ReactElement;
};

type Props = TextInputProps & LabeledTextInputProps;

export const LabeledTextInput: React.FC<Props> = ({
  label = ' ',
  rightAdornment,
  ...rest
}) => {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {rightAdornment ? (
        <View style={styles.inputView}>
          <TextInput style={styles.input} {...rest} />
          {rightAdornment}
        </View>
      ) : (
        <TextInput style={styles.input} {...rest} />
      )}
    </View>
  );
};
