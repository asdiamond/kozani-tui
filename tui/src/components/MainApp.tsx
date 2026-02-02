import { TextAttributes } from "@opentui/core"
import { useState } from "react"
import { useAppData } from "../hooks/useAppData"
import { AddConnectionForm } from "./AddConnectionForm"
import { LoadingScreen } from "./LoadingScreen"

export function MainApp() {
  const { user, connections, loading, reload } = useAppData()
  const [showAddForm, setShowAddForm] = useState(false)

  if (loading) {
    return <LoadingScreen message="Loading..." />
  }

  if (showAddForm) {
    return (
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
        <ascii-font font="tiny" text="Kozani" />
        <AddConnectionForm
          onSaved={() => {
            setShowAddForm(false)
            reload()
          }}
        />
      </box>
    )
  }

  return (
    <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
      <ascii-font font="tiny" text="Kozani" />
      <text fg="#00FF00">✓ Authenticated</text>
      {user && (
        <text attributes={TextAttributes.DIM}>
          Logged in as @{user.login}
          {user.name ? ` (${user.name})` : ""}
        </text>
      )}
      <box flexDirection="column" marginTop={1} gap={1}>
        <text attributes={TextAttributes.BOLD}>Connections:</text>
        {connections.length === 0 ? (
          <text attributes={TextAttributes.DIM}>No connections yet</text>
        ) : (
          connections.map((conn) => <text key={conn.id}>• {conn.name}</text>)
        )}
        <text> </text>
        <text attributes={TextAttributes.DIM}>Press Enter to add a connection</text>
        <input width={1} focused onSubmit={() => setShowAddForm(true)} />
      </box>
    </box>
  )
}
