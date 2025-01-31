import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '../lib/contexts/auth-context'
import { Noto_Sans_JP } from 'next/font/google'

const notoSansJP = Noto_Sans_JP({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
})

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
    <html lang="ja" className={notoSansJP.className}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 