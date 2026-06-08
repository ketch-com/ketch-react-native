import AppTrackingTransparency
import Foundation
import React

@objc(KetchAtt)
class KetchAtt: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func getStatusString(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    if #available(iOS 14, *) {
      resolve(ATTrackingManager.trackingAuthorizationStatus.ketchAttString)
    } else {
      resolve("notDetermined")
    }
  }
}

@available(iOS 14, *)
private extension ATTrackingManager.AuthorizationStatus {
  var ketchAttString: String {
    switch self {
    case .notDetermined: return "notDetermined"
    case .restricted: return "restricted"
    case .denied: return "denied"
    case .authorized: return "authorized"
    @unknown default: return "unknown"
    }
  }
}
