import QRCode from 'qrcode';

// Logika konversi QRIS statis -> dinamis di-port dari repo:
//   https://github.com/sofwanrsd/qrisin  (core/qris.js)

/** Hitung CRC16 (CRC16-CCITT-FALSE) untuk checksum QRIS (tag 63). */
export function toCRC16(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Ubah QRIS statis menjadi QRIS dinamis dengan nominal tertentu:
 * - Ganti tag "010211" (statis) -> "010212" (dinamis)
 * - Sisipkan tag 54 (nominal) sebelum "5802ID"
 * - Hitung ulang CRC di akhir
 */
export function generateDynamicQR(baseQR: string, nominal: number | string): string {
  if (!baseQR) throw new Error('QRIS statis tidak boleh kosong');
  const nom = String(nominal);
  if (!nom) throw new Error('Nominal wajib diisi');

  const noCRC = baseQR.slice(0, -4);
  const makeDynamic = noCRC.replace('010211', '010212');

  const split = makeDynamic.split('5802ID');
  if (split.length < 2) {
    throw new Error('QRIS statis tidak valid (tag 5802ID tidak ditemukan)');
  }

  const tag54 = '54' + nom.length.toString().padStart(2, '0') + nom + '5802ID';
  const withoutCRC = split[0] + tag54 + split[1];
  return withoutCRC + toCRC16(withoutCRC);
}

/** Render payload QRIS menjadi gambar PNG (data URL base64) siap ditampilkan. */
export async function generateQrPng(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
}
