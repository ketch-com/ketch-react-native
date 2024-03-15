import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';

const ListItemSeparator = () => <View style={styles.separator} />;

const renderListHeader = (title: string) => () => <Text>{title}</Text>;

export const RadioList = ({
  title,
  data,
  isCheckbox,
  getIsChecked,
  onPressItem,
}: {
  title: string;
  data: {key: string; label: string}[];
  isCheckbox: boolean;
  getIsChecked: (key: string) => boolean;
  onPressItem: (key: string) => void;
}) => {
  const renderItem = ({item}: {item: {key: string; label: string}}) => {
    const onPress = () => {
      onPressItem(item.key);
    };

    return (
      <RadioOption
        label={item.label}
        isCheckbox={isCheckbox}
        isChecked={getIsChecked(item.key)}
        onPress={onPress}
      />
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      ListHeaderComponent={renderListHeader(title)}
      ListHeaderComponentStyle={styles.listHeader}
      ItemSeparatorComponent={ListItemSeparator}
      scrollEnabled={false}
      contentContainerStyle={styles.listContentContainer}
    />
  );
};

export const RadioOption = ({
  label,
  isChecked,
  isCheckbox,
  onPress,
}: {
  label: string;
  isChecked: boolean;
  isCheckbox: boolean;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={styles.radioContainer}>
    <View
      style={[
        styles.circle,
        isCheckbox && styles.checkBox,
        isChecked && styles.checked,
      ]}
    />
    <Text>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  circle: {
    width: 12,
    height: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'grey',
  },

  checkBox: {
    borderRadius: 0,
  },

  checked: {backgroundColor: 'black'},

  listContentContainer: {
    borderWidth: 1,
    borderColor: 'grey',
    padding: 8,
  },

  listHeader: {marginBottom: 12},

  separator: {height: 8},
});
