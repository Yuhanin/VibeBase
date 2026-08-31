import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'VibeBase', description: 'AI-native project management for vibe coding' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="de"><body>{children}</body></html>
}
