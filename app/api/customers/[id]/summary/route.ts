import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSummary } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const summary = getCustomerSummary(Number(id))
  if (!summary) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(summary)
}
