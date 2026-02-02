import { TextAttributes } from "@opentui/core"
import type { SelectOption } from "@opentui/core"

export function ConnectionsList({
  connections,
  options,
  selectedIndex,
  onChangeIndex,
  onSelectOption,
}: {
  connections: { id: string }[]
  options: SelectOption[]
  selectedIndex: number
  onChangeIndex: (index: number) => void
  onSelectOption: (id: string | null) => void
}) {
  return (
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
          onChange={(index) => onChangeIndex(index)}
          onSelect={(index, option) => {
            onChangeIndex(index)
            onSelectOption((option?.value as string | undefined) ?? null)
          }}
        />
      )}
      <text attributes={TextAttributes.DIM}>
        j/k to move, Enter to select, a to add, d to delete
      </text>
      <text attributes={TextAttributes.DIM}>ctrl+l to logout</text>
    </box>
  )
}
