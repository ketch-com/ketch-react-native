#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KetchAtt, NSObject)

RCT_EXTERN_METHOD(getStatusString:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestTrackingAuthorization:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
