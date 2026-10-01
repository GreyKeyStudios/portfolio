import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'The Stack House — Grey Key Studios',
  description: 'An interactive 3D portfolio by Michael Walton.',
  generator: 'v0.app',
  // No `icons`: the v0 template pointed at /icon.svg, /apple-icon.png and two
  // 32px PNGs that never existed, so every page made four 404 requests. Add a
  // real square Grey Key mark under public/ before declaring icons again.
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
