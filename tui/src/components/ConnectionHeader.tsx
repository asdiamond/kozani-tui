import { TextAttributes } from "@opentui/core"
import { useMemo } from "react"
import type { Connection } from "../connections"
import { Logo } from "./Logo"

export function ConnectionHeader({
  connection,
  onBackHint,
  hintLine,
}: {
  connection: Connection
  onBackHint: string
  hintLine: React.ReactNode
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

  const backHint = (
    <text attributes={TextAttributes.DIM}>
      {onBackHint.split(/(\<[^>]+\>)/g).map((chunk, idx) => {
        if (chunk.startsWith("<") && chunk.endsWith(">")) {
          return (
            <span key={`${chunk}-${idx}`} fg="#7aa2f7">
              {chunk}
            </span>
          )
        }
        return chunk
      })}
    </text>
  )

  return (
    <box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
      <box flexDirection="column" gap={0}>
        <text attributes={TextAttributes.BOLD}>{connection.name}</text>
        <text fg="#f4a261">user: {connectionMeta.user}</text>
        <text fg="#f4a261">host: {connectionMeta.host}</text>
        <text fg="#f4a261">created_at: {connectionMeta.createdAt}</text>
        {backHint}
        {hintLine}
      </box>
      <Logo />
    </box>
  )
}
