import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIXTURES_DIR = path.join(process.cwd(), 'fixtures', 'ai');
const HASH_RE = /^[a-f0-9]{1,64}$/i;

const blockProd = (): NextResponse | null => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Fixture API is disabled in production builds' },
      { status: 403 }
    );
  }
  return null;
};

const fixturePath = (hash: string): string => path.join(FIXTURES_DIR, `${hash}.json`);

const validateHash = (hash: unknown): string => {
  if (typeof hash !== 'string' || !HASH_RE.test(hash)) {
    throw new Error('Invalid hash');
  }
  return hash.toLowerCase();
};

const ensureDir = async (): Promise<void> => {
  await fs.mkdir(FIXTURES_DIR, { recursive: true });
};

export async function GET(req: NextRequest) {
  const blocked = blockProd();
  if (blocked) return blocked;

  await ensureDir();
  const hash = req.nextUrl.searchParams.get('hash');

  if (hash) {
    try {
      const safe = validateHash(hash);
      const content = await fs.readFile(fixturePath(safe), 'utf8');
      return NextResponse.json(JSON.parse(content));
    } catch (err: any) {
      if (err.code === 'ENOENT') return NextResponse.json(null);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  try {
    const files = await fs.readdir(FIXTURES_DIR);
    const entries = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(FIXTURES_DIR, file), 'utf8');
          return [file.replace(/\.json$/, ''), JSON.parse(content)] as const;
        })
    );
    return NextResponse.json(Object.fromEntries(entries));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const blocked = blockProd();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const safe = validateHash(body?.hash);
    if (!body?.record || typeof body.record !== 'object') {
      return NextResponse.json({ error: 'Missing record' }, { status: 400 });
    }
    await ensureDir();
    await fs.writeFile(fixturePath(safe), JSON.stringify(body.record, null, 2), 'utf8');
    return NextResponse.json({ ok: true, hash: safe });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE() {
  const blocked = blockProd();
  if (blocked) return blocked;

  try {
    await ensureDir();
    const files = await fs.readdir(FIXTURES_DIR);
    await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map((f) => fs.unlink(path.join(FIXTURES_DIR, f)))
    );
    return NextResponse.json({ ok: true, cleared: files.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
