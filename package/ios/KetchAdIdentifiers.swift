import Foundation
import React
import UIKit

@objc(KetchAdIdentifiers)
class KetchAdIdentifiers: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func getIdfv(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(UIDevice.current.identifierForVendor?.uuidString)
  }
}
