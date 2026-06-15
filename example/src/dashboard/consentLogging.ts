import type {Consent} from '@ketch-com/ketch-react-native';

export function formatConsent(consent: Consent): string {
  const parts: string[] = [];

  if (consent.purposes) {
    const entries = Object.entries(consent.purposes);
    const allowed = entries.filter(([, value]) => value).map(([key]) => key).sort();
    const denied = entries.filter(([, value]) => !value).map(([key]) => key).sort();
    parts.push(
      `purposes(${entries.length}) allowed=[${allowed.join(',')}] denied=[${denied.join(',')}]`,
    );
  } else {
    parts.push('purposes=undefined');
  }

  if (consent.vendors?.length) {
    parts.push(`vendors(${consent.vendors.length})=[${[...consent.vendors].sort().join(',')}]`);
  }

  if (consent.protocols && Object.keys(consent.protocols).length > 0) {
    const protocolSummary = Object.entries(consent.protocols)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    parts.push(`protocols={${protocolSummary}}`);
  }

  return parts.join('; ');
}

export function formatAttState(current: string, previous: string): string {
  return `ketch_att=${current} ketch_att_prev=${previous}`;
}
