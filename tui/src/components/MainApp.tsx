import { TextAttributes } from "@opentui/core"
import type { SelectOption } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useMemo, useState } from "react"
import { useAppData } from "../hooks/useAppData"
import { AddConnectionForm } from "./AddConnectionForm"
import { LoadingScreen } from "./LoadingScreen"
import { Logo } from "./Logo"

export function MainApp({ onLogout }: { onLogout: () => void }) {
  const { user, connections, loading, reload } = useAppData()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  const options = useMemo<SelectOption[]>(
    () =>
      connections.map((conn) => ({
        name: conn.name,
        description: conn.url,
        value: conn.id,
      })),
    [connections]
  )

  const selectedConnection =
    selectedConnectionId ? connections.find((conn) => conn.id === selectedConnectionId) : null

  useKeyboard((key) => {
    if (showAddForm) {
      return
    }

    if (selectedConnection) {
      if (key.name === "q" || key.name === "escape") {
        setSelectedConnectionId(null)
      }
      if (key.name === "l") {
        onLogout()
      }
      return
    }

    if (key.name === "j") {
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(options.length - 1, 0)))
    } else if (key.name === "k") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (key.name === "g") {
      setSelectedIndex(0)
    } else if (key.name === "G") {
      setSelectedIndex(Math.max(options.length - 1, 0))
    } else if (key.name === "return" && options.length > 0) {
      setSelectedConnectionId(options[selectedIndex]?.value ?? null)
    } else if (key.name === "a") {
      setShowAddForm(true)
    } else if (key.name === "l") {
      onLogout()
    }
  })

  if (loading) {
    return <LoadingScreen message="Loading..." />
  }

  if (showAddForm) {
    return (
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
        <Logo />
        <AddConnectionForm
          onSaved={() => {
            setShowAddForm(false)
            reload()
          }}
          onCancel={() => setShowAddForm(false)}
        />
      </box>
    )
  }

  if (selectedConnection) {
    return (
      <box flexDirection="column" flexGrow={1} padding={1} gap={1}>
        <box alignItems="center" justifyContent="space-between">
          <text attributes={TextAttributes.BOLD}>{selectedConnection.name}</text>
          <text attributes={TextAttributes.DIM}>q to go back, l to logout</text>
        </box>
        <box flexDirection="column" gap={1} flexGrow={1}>
          <text attributes={TextAttributes.DIM}>Connection URL:</text>
          <text selectable>{selectedConnection.url}</text>
          <text> </text>
          <text attributes={TextAttributes.DIM}>Created:</text>
          <text>{new Date(selectedConnection.createdAt).toLocaleString()}</text>
        </box>
      </box>
    )
  }

  return (
    <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
      <Logo />
      <text fg="#00FF00">✓ Authenticated</text>
      {user && (
        <text attributes={TextAttributes.DIM}>
          Logged in as @{user.login}
          {user.name ? ` (${user.name})` : ""}
        </text>
      )}
      <box flexDirection="column" marginTop={1} gap={1} width={80}>
        <text attributes={TextAttributes.BOLD}>Connections:</text>
        {connections.length === 0 ? (
          <text attributes={TextAttributes.DIM}>No connections yet. Press a to add one.</text>
        ) : (
          <select
            style={{ height: 10 }}
            options={options}
            selectedIndex={selectedIndex}
            focused
            onChange={(index) => setSelectedIndex(index)}
            onSelect={(index, option) => {
              setSelectedIndex(index)
              setSelectedConnectionId((option?.value as string | undefined) ?? null)
            }}
          />
        )}
        <text attributes={TextAttributes.DIM}>
          j/k to move, Enter to select, a to add
        </text>
        <text attributes={TextAttributes.DIM}>l to logout</text>
      </box>
    </box>
  )
}
