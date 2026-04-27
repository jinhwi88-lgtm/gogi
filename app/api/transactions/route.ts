import { NextRequest, NextResponse } from 'next/server'
import { getAll, insert } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') ?? undefined
  const date = searchParams.get('date') ?? undefined
  const rows = getAll(search, date)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const row = insert(body)
  return NextResponse.json(row, { status: 201 })
}
