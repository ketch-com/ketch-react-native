const wrapSharedPrefences =
  (SharedPreferences: any) => (key: string, value: string) => {
    return SharedPreferences.setItemAsync(key, value);
  };

export default wrapSharedPrefences;
