import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL belum di-set. Copy .env.example ke .env lalu isi.');
    }
    client = neon(url);
  }
  return client;
}

// Lazy proxy: koneksi baru dibuat saat query pertama dijalankan (bukan saat import),
// supaya `next build` tidak gagal ketika DATABASE_URL belum ada.
export const sql = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args: unknown[]) {
    return (getClient() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as NeonQueryFunction<false, false>;
