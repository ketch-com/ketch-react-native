import { TurboModuleRegistry, NativeModules } from 'react-native';
import type { Spec } from 'react-native-webview/lib/NativeRNCWebView';

let KetchModule: Spec;

try {
  KetchModule = TurboModuleRegistry.get<Spec>('KetchModule')!;
} catch {
  KetchModule = NativeModules.KetchModule as Spec;
}

export default KetchModule;
