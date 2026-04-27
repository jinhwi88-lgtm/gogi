import { NextRequest, NextResponse } from 'next/server'
import { settleCustomerCredits } from '@/lib/db'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  settleCustomerCredits(Number(id))
  return NextResponse.json({ ok: true })
}
