import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';

const ListItemSeparator = () => <View style={styles.separator} />;

export const RadioList = ({
  title,
  data,
  isCheckbox,
  getIsChecked,
  onPressItem,
  numColumns = 2,
  columnWidth,
}: {
  title: string;
  data: {key: string; label: string}[];
  isCheckbox: boolean;
  getIsChecked: (key: string) => boolean;
  onPressItem: (key: string) => void;
  numColumns?: number;
  columnWidth?: number;
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
        columnWidth={columnWidth}
      />
    );
  };

  return (
    <View>
      <Text style={styles.label}>{title}</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        ItemSeparatorComponent={ListItemSeparator}
        scrollEnabled={false}
        contentContainerStyle={styles.listContentContainer}
        numColumns={numColumns}
      />
    </View>
  );
};

export const RadioOption = ({
  label,
  isChecked,
  isCheckbox,
  onPress,
  columnWidth,
}: {
  label: string;
  isChecked: boolean;
  isCheckbox: boolean;
  onPress: () => void;
  columnWidth?: number;
}) => (
  <Pressable
    onPress={onPress}
    style={{...styles.radioContainer, width: columnWidth}}>
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
    gap: 4,
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
    borderWidth: 0,
    borderRadius: 6,
    borderColor: 'grey',
  },

  separator: {height: 8, width: 16},

  label: {
    color: 'black',
    fontWeight: '600',
    marginBottom: 4,
  },
});
