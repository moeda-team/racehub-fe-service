// This deliberately matches the client-safe subset of the server's mailbox
// validation. The backend remains authoritative for all API requests.
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(value);
}
