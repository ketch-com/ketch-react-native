import { useKetchService } from "@ketch-com/ketch-react-native";
import { Button } from "react-native";

// TODO: transfer all UI from example/src/Main
const KetchDashboard = () => {
  const ketch = useKetchService();

  const showConsent = () => {
    ketch.showConsentExperience();
  };

  // const showPreferences = () => {
  //   ketch.showPreferenceExperience({
  //     tab: initialTab,
  //     showConsentsTab: displayedTabs.includes(PreferenceTab.ConsentsTab),
  //     showOverviewTab: displayedTabs.includes(PreferenceTab.OverviewTab),
  //     showSubscriptionsTab: displayedTabs.includes(
  //       PreferenceTab.SubscriptionsTab,
  //     ),
  //     showRightsTab: displayedTabs.includes(PreferenceTab.RightsTab),
  //   });
  // };

  return (
    <Button
      title="Show modal"
      onPress={showConsent}
    />
  );
};

export default KetchDashboard;
