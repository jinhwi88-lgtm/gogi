import { NextRequest, NextResponse } from 'next/server'
import { getPriceRules, upsertPriceRule, removePriceRule } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json(getPriceRules(Number(id)))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { cutKey, price } = await req.json()
  const rule = upsertPriceRule(Number(id), cutKey, price)
  return NextResponse.json(rule, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { ruleId } = await req.json()
  removePriceRule(Number(ruleId))
  return NextResponse.json({ ok: true })
}
