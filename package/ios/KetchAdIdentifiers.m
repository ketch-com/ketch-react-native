#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KetchAdIdentifiers, NSObject)

RCT_EXTERN_METHOD(getIdfv:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
