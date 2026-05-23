import type { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Cluster Manager</p>
          <h1>Developer Environment Access</h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
