import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useMemo, useState } from "react"
import type { Connection } from "../connections"
import { ConnectionSchemaPage } from "./ConnectionSchemaPage.tsx"
import { ConnectionHeader } from "./ConnectionHeader"

export function ConnectionPage({
  connection,
  onBackHint,
  onSchemaBrowserToggle,
}: {
  connection: Connection
  onBackHint: string
  onSchemaBrowserToggle?: (open: boolean) => void
}) {
  const parsedUrl = useMemo(() => {
    try {
      return new URL(connection.url)
    } catch {
      return null
    }
  }, [connection.url])

  const connectionMeta = useMemo(() => {
    const user = parsedUrl?.username || "unknown"
    const host = parsedUrl?.hostname || "unknown"
    const createdAt = new Date(connection.createdAt).toLocaleString()
    return { user, host, createdAt }
  }, [connection.createdAt, parsedUrl])

  const [showSchemaPage, setShowSchemaPage] = useState(false)

  useKeyboard((key) => {
    if (showSchemaPage) {
      return
    }
    if (key.name === "s") {
      key.preventDefault()
      key.stopPropagation()
      setShowSchemaPage(true)
    }
  })

  if (showSchemaPage) {
    return (
      <ConnectionSchemaPage
        connection={connection}
        onClose={() => setShowSchemaPage(false)}
        onBackHint={onBackHint}
        onSchemaBrowserToggle={onSchemaBrowserToggle}
      />
    )
  }

  return (
    <box flexDirection="column" flexGrow={1} padding={1} gap={1}>
      <ConnectionHeader
        connection={connection}
        onBackHint={onBackHint}
        hintLine={
          <text attributes={TextAttributes.DIM}>
            <span fg="#7aa2f7">&lt;s&gt;</span> schema browser
          </text>
        }
      />
      <box
        flexDirection="column"
        flexGrow={1}
        border
        borderStyle="single"
        borderColor="#2f7dd1"
        padding={1}
      >
        <box flexDirection="column" gap={1} flexGrow={1}>
          <text attributes={TextAttributes.DIM}>No content yet.</text>
        </box>
      </box>
    </box>
  )
}
