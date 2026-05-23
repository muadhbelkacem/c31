import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { normalizeRoleArray, isProductionAcceptedInternship } from '../../lib/jobMapper';

let cachedRoles: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getProcessedData(): Promise<any[]> {
  const now = Date.now();
  if (cachedRoles && now - lastFetchTime < CACHE_TTL) return cachedRoles;

  try {
    const filePath = path.join(process.cwd(), 'public', 'intern_data.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    if (!Array.isArray(data)) return [];

    cachedRoles = normalizeRoleArray(data).filter(role => isProductionAcceptedInternship(role));
    lastFetchTime = now;
    return cachedRoles;
  } catch (error) {
    console.error('Error processing role data:', error);
    return [];
  }
}

export async function GET() {
  const roles = await getProcessedData();
  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('action') === 'clear-cache') {
    cachedRoles = null;
    lastFetchTime = 0;
    return NextResponse.json({ message: 'Cache cleared' });
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
