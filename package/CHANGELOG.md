## Changelog

In order to migrate to the most recent version of the core, you need to apply all migration steps from your version to the recent one.

# Migration to "0.6.3"
- Breaking changes for the `onConsentUpdated` listener. 
The `onConsentUpdated` method argument is changed to `Consent` object instead of serialized `string`.
So when using this method you will no longer have a need to use `JSON.parse`, as the `Consent` object instance is returned right on. `819d0dd`