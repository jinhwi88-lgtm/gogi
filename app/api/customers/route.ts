import { NextRequest, NextResponse } from 'next/server'
import { getAllCustomers, insertCustomer, getRecentCustomers } from '@/lib/db'

export async function GET(req: NextRequest) {
  const recent = req.nextUrl.searchParams.get('recent')
  if (recent) return NextResponse.json(getRecentCustomers(5))
  return NextResponse.json(getAllCustomers())
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: '거래처명 필수' }, { status: 400 })
  try {
    const customer = insertCustomer(name.trim())
    return NextResponse.json(customer, { status: 201 })
  } catch {
    return NextResponse.json({ error: '이미 존재하는 거래처명' }, { status: 409 })
  }
}
