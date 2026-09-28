import { NextResponse } from 'next/server';
import { getAllRuns } from '@/lib/execution-store';

export async function GET() {
  const runs = getAllRuns();
  return NextResponse.json({ runs });
}
