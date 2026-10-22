import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { db } from '../db/db'
import { getPrefs } from '../db/prefs'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('Settings and Syllabus screens', () => {
  it('saves the chosen exam to IndexedDB, and the syllabus shows it', async () => {
    const { unmount } = renderAt('/settings')
    await userEvent.selectOptions(await screen.findByLabelText('Target exam'), 'SSC_GD')
    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }))
    await screen.findByText('Settings saved')
    expect((await getPrefs()).prefs.examCode).toBe('SSC_GD')
    unmount()

    renderAt('/syllabus')
    expect(await screen.findByRole('heading', { name: /80 questions · 160 marks · 60 min/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'SSC GD Constable (CBE)' })).toHaveAttribute('aria-selected', 'true')
  })

  it('rejects an out-of-range study time', async () => {
    renderAt('/settings')
    const input = await screen.findByLabelText('Study minutes per day')
    await userEvent.clear(input)
    await userEvent.type(input, '5')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled()
  })
})
