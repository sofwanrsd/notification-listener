// Registry provider pembayaran.
// Menambah provider baru = tambahkan 1 entri di sini + buat parser-nya di sisi Android.
// Package name diverifikasi dari Google Play & repo github.com/suriyadi15/qrishook.
// Format notif untuk dana_bisnis & gopay_merchant belum terverifikasi — cek via mode debug Android.

export interface ProviderInfo {
  id: string;
  displayName: string;
  androidPackages: string[];
}

export const PROVIDERS: ProviderInfo[] = [
  // dana_bisnis TERVERIFIKASI dari HP: pkg id.dana, notif "Rp<n> diterima DANA Bisnis."
  { id: 'dana_bisnis', displayName: 'DANA Bisnis', androidPackages: ['id.dana'] },
  { id: 'interactive_qris', displayName: 'InterActive QRIS', androidPackages: ['com.interactive.qrisid'] },
  { id: 'gopay_merchant', displayName: 'GoPay Merchant', androidPackages: ['com.gojek.gopaymerchant'] },
];

export function isKnownProvider(id: string): boolean {
  return PROVIDERS.some((p) => p.id === id);
}
