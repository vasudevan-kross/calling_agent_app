import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Nav } from '@/components/nav'
import { AnimatedBackground } from '@/components/animated-background'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Calling Application',
  description: 'AI-powered cold calling with lead management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AnimatedBackground />
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  )
}
