## Changelog

In order to migrate to the most recent version of the core, you need to apply all migration steps from your version to the recent one.
# Migration to "0.6.3"
- Breaking changes for the `onConsentUpdated` listener. Updating `onConsentUpdated` method argument (`Consent` that we pass into the listener).
Now the returned data is serialized (was `string`). No need to use `JSON.parse` anymore. `819d0dd`