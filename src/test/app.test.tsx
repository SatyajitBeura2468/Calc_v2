import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('primary application interactions', () => {
  it('evaluates keyboard input and commits it to history', async () => {
    const user = userEvent.setup(); render(<App />)
    const editor = screen.getByLabelText('Calculation expression')
    await user.clear(editor); await user.type(editor, '2+3*4'); fireEvent.keyDown(editor, { key:'Enter' })
    await waitFor(() => expect(screen.getByText('14', { selector: 'output' })).toBeInTheDocument())
    await user.click(screen.getAllByLabelText('Open workspaces and history').at(-1)!)
    expect(await screen.findByText('2+3*4', { selector: '.recall-entry span' })).toBeInTheDocument()
  })
  it('inserts a keypad key at the current caret', async () => {
    const user = userEvent.setup(); render(<App />); const editor = screen.getByLabelText('Calculation expression') as HTMLTextAreaElement
    await user.clear(editor); await user.type(editor, '12+34'); editor.setSelectionRange(2,2); await user.click(screen.getByRole('button', { name:'9' })); expect(editor.value).toBe('129+34')
  })
  it('navigates and executes the command palette with arrows', async () => {
    const user = userEvent.setup(); render(<App />); fireEvent.keyDown(window, { key:'k', ctrlKey:true }); const search = await screen.findByPlaceholderText(/Type a command/)
    await user.type(search, 'open graph'); fireEvent.keyDown(search, { key:'ArrowDown' }); fireEvent.keyDown(search, { key:'ArrowUp' }); fireEvent.keyDown(search, { key:'Enter' })
    expect(screen.getByRole('button', { name:'Graph' })).toHaveClass('active')
  })
  it('creates a real workspace', async () => {
    const user = userEvent.setup(); render(<App />); await user.click(screen.getAllByLabelText('Open workspaces and history').at(-1)!); await user.click(screen.getByRole('button', { name:/New/ })); expect(screen.getByText('Workspace 2', { selector: '.workspace-tabs span' })).toBeInTheDocument()
  })
})
