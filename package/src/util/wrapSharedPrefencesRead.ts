const wrapSharedPrefencesRead =
  (SharedPreferences: any) =>
  (key: string): Promise<string> => {
    return SharedPreferences.getItemAsync(key).then(
      (value: string | null) => value ?? ''
    );
  };

export default wrapSharedPrefencesRead;
