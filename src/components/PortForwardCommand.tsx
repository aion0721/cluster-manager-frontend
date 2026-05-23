import { useEffect, useState } from 'react'
import { getPortForwardCommand } from '../api/users'
import type { PortForwardCommandResponse } from '../types/user'

type PortForwardCommandProps = {
  userId?: string
}

export function PortForwardCommand({ userId }: PortForwardCommandProps) {
  const [command, setCommand] = useState<PortForwardCommandResponse>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCommand() {
      if (!userId) {
        setCommand(undefined)
        return
      }

      setLoading(true)
      setError('')
      setCopied(false)

      try {
        const response = await getPortForwardCommand(userId)
        if (!cancelled) {
          setCommand(response)
        }
      } catch (caught) {
        if (!cancelled) {
          setCommand(undefined)
          setError(caught instanceof Error ? caught.message : 'Failed to load command.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCommand()

    return () => {
      cancelled = true
    }
  }, [userId])

  async function copyCommand() {
    if (!command?.command) {
      return
    }

    await navigator.clipboard.writeText(command.command)
    setCopied(true)
  }

  return (
    <section className="card">
      <div className="section-heading split-heading">
        <div>
          <h2>Port Forward</h2>
          <p>Run this command on the user's local terminal.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={copyCommand}
          disabled={!command?.command}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {loading ? <p className="muted-text">Loading command...</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}
      {command ? <pre className="command-box">{command.command}</pre> : null}
      {!userId ? <p className="muted-text">Select a user to show the command.</p> : null}
    </section>
  )
}
