import { TextAttributes } from "@opentui/core"
import type { SelectOption } from "@opentui/core"
import { useEffect, useMemo, useState } from "react"
import { useAppData } from "../hooks/useAppData"
import { useConnectionListKeys } from "../hooks/useConnectionListKeys"
import { AddConnectionForm } from "./AddConnectionForm"
import { ConnectionPage } from "./ConnectionPage.tsx"
import { ConnectionsList } from "./ConnectionsList"
import { LoadingScreen } from "./LoadingScreen"
import { Logo } from "./Logo"
import { deleteConnection } from "../connections"

export function MainApp({ onLogout }: { onLogout: () => void }) {
  const { user, connections, loading, reload } = useAppData()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [schemaBrowserOpen, setSchemaBrowserOpen] = useState(false)

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

  useEffect(() => {
    if (connections.length === 0) {
      setSelectedIndex(0)
      return
    }
    setSelectedIndex((prev) => Math.min(prev, connections.length - 1))
  }, [connections])

  const handleDelete = () => {
    const id = options[selectedIndex]?.value as string | undefined
    if (!id) {
      return
    }
    void (async () => {
      await deleteConnection(id)
      await reload()
    })()
  }

  useConnectionListKeys({
    disabled: showAddForm,
    inConnection: !!selectedConnection,
    schemaBrowserOpen,
    selectedIndex,
    optionsLength: options.length,
    setSelectedIndex,
    onOpenSelected: () => setSelectedConnectionId(options[selectedIndex]?.value ?? null),
    onAdd: () => setShowAddForm(true),
    onDelete: handleDelete,
    onLogout,
    onBack: () => setSelectedConnectionId(null),
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
      <ConnectionPage
        connection={selectedConnection}
        onBackHint={
          "<q> back  <ctrl+l> logout  <s> schema browser  <j>/<k> move  <enter> toggle"
        }
        onSchemaBrowserToggle={setSchemaBrowserOpen}
      />
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
      <ConnectionsList
        connections={connections}
        options={options}
        selectedIndex={selectedIndex}
        onChangeIndex={setSelectedIndex}
        onSelectOption={setSelectedConnectionId}
      />
    </box>
  )
}
