// Convert user-entered URLs to make the link work correctly
// if protocol missing, default to https:// . leave existing http:// or https:// untouched.
export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url = raw.trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url; // if already starts with protocol
  if (/^\/\//.test(url)) return 'https:' + url; // If starts with '//' (protocol-relative), keep as is prefixed with https:
  
  return 'http://' + url.replace(/^https?:\/\//i, ''); // Add http:// by default
}
