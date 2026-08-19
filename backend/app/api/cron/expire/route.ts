import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

// GET /api/cron/expire — pembersih order kedaluwarsa. Dipanggil Vercel Cron.
// Diamankan dengan header Authorization: Bearer <CRON_SECRET>.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const rows = (await sql`
    update orders set status = 'EXPIRED'
     where status = 'PENDING' and expires_at < now()
    returning id
  `) as { id: string }[];

  return NextResponse.json({ expired: rows.length });
}
