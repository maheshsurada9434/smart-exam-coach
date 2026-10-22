import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { NAV } from './nav'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('App shell', () => {
  it('shows all 9 sections in the sidebar', async () => {
    renderAt('/')
    await screen.findByRole('heading', { name: 'Welcome to Smart Exam Coach' })
    const sidebar = screen.getAllByRole('navigation', { name: 'Main' })[0]!
    expect(NAV).toHaveLength(9)
    for (const n of NAV) expect(within(sidebar).getByRole('link', { name: n.label })).toBeInTheDocument()
  })

  it('shows an honest not-built notice on unbuilt sections', async () => {
    renderAt('/performance')
    expect(await screen.findByRole('heading', { name: 'Performance', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/planned for Day 7/)).toBeInTheDocument()
  })

  it('toggles dark mode and remembers it', async () => {
    renderAt('/')
    await screen.findByRole('heading', { name: 'Welcome to Smart Exam Coach' })
    await userEvent.click(screen.getAllByRole('button', { name: 'Switch to dark mode' })[0]!)
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('sec-theme')).toBe('dark')
  })
})
