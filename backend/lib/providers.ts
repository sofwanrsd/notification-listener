// Registry provider pembayaran.
// Saat ini gateway HANYA mendukung DANA. Menambah provider baru = tambahkan 1
// entri di sini + buat parser-nya di sisi Android.

export interface ProviderInfo {
  id: string;
  displayName: string;
  androidPackages: string[];
}

export const PROVIDERS: ProviderInfo[] = [
  // dana_bisnis TERVERIFIKASI dari HP: pkg id.dana, notif "Rp<n> diterima DANA Bisnis."
  { id: 'dana_bisnis', displayName: 'DANA', androidPackages: ['id.dana'] },
];

export function isKnownProvider(id: string): boolean {
  return PROVIDERS.some((p) => p.id === id);
}
