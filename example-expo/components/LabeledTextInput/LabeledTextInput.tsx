import React from 'react';
import {StyleSheet, Text, TextInput, TextInputProps, View} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  label: {
    color: 'black',
    fontWeight: '600',
  },

  input: {
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 5,
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
  autoCapitalize = 'none',
  autoComplete = 'off',
  autoCorrect = false,
  ...rest
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {rightAdornment ? (
        <View style={styles.inputView}>
          <TextInput
            style={styles.input}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            {...rest}
          />
          {rightAdornment}
        </View>
      ) : (
        <TextInput
          style={styles.input}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          {...rest}
        />
      )}
    </View>
  );
};
