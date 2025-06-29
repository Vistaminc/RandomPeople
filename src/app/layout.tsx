import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '随机选人 - 现代化抽奖系统',
  description: '功能强大的随机抽奖应用，支持多种抽奖模式和文件格式',
  keywords: ['抽奖', '随机选择', '点名', '抽签'],
  authors: [{ name: 'VacuolePaoo' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
} 