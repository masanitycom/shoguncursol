import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '../lib/contexts/auth-context'

export const metadata: Metadata = {
  title: 'Shogun Trade System',
  description: 'NFTトレーディングシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 