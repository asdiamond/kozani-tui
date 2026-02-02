import { TextAttributes } from "@opentui/core"

export function LoadingScreen({ message }: { message: string }) {
  return (
    <box alignItems="center" justifyContent="center" flexGrow={1}>
      <text attributes={TextAttributes.DIM}>{message}</text>
    </box>
  )
}
