import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '정육 거래내역서',
  description: '정육점 거래내역 자동 작성',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
