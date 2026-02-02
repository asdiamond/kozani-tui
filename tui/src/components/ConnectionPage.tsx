import { TextAttributes } from "@opentui/core"
import type { Connection } from "../connections"

export function ConnectionPage({
  connection,
  onBackHint,
}: {
  connection: Connection
  onBackHint: string
}) {
  return (
    <box flexDirection="column" flexGrow={1} padding={1} gap={1}>
      <box alignItems="center" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD}>{connection.name}</text>
        <text attributes={TextAttributes.DIM}>{onBackHint}</text>
      </box>
      <box flexDirection="column" gap={1} flexGrow={1}>
        <text attributes={TextAttributes.DIM}>Connection URL:</text>
        <text selectable>{connection.url}</text>
        <text> </text>
        <text attributes={TextAttributes.DIM}>Created:</text>
        <text>{new Date(connection.createdAt).toLocaleString()}</text>
      </box>
    </box>
  )
}
