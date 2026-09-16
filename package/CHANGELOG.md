## Changelog

In order to migrate to the most recent version of the core, you need to apply all migration steps from your version to the recent one.

# Migration to "1.2.1"
- Breaking changes for the `getConsent` method.
`getConsent` is now the server consent read and takes a `ConsentConfig`, matching the iOS and Android SDKs.
The previous no-argument `getConsent()`, which read locally cached consent, is now `getCachedConsent()`.
TypeScript callers get a compile error on the old call shape; untyped JS callers get a thrown error naming the replacement.
- `fetchConsent`, `setConsentOnServer` and `preferenceQRUrl` are deprecated in favour of `getConsent`, `setConsent` and `getPreferenceQRUrl`.
The same three renames apply to `KetchHeadless` and `HeadlessApiClient`. The deprecated names still work and delegate to the new ones.

# Migration to "0.6.3"
- Breaking changes for the `onConsentUpdated` listener. 
The `onConsentUpdated` method argument is changed to `Consent` object instead of serialized `string`.
So when using this method you will no longer have a need to use `JSON.parse`, as the `Consent` object instance is returned right on. `819d0dd`