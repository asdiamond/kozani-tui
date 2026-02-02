import { useKeyboard } from "@opentui/react"

export function useConnectionListKeys({
  disabled,
  inConnection,
  schemaBrowserOpen,
  selectedIndex,
  optionsLength,
  setSelectedIndex,
  onOpenSelected,
  onAdd,
  onDelete,
  onLogout,
  onBack,
}: {
  disabled: boolean
  inConnection: boolean
  schemaBrowserOpen: boolean
  selectedIndex: number
  optionsLength: number
  setSelectedIndex: (index: number) => void
  onOpenSelected: () => void
  onAdd: () => void
  onDelete: () => void
  onLogout: () => void
  onBack: () => void
}) {
  useKeyboard((key) => {
    if (disabled) {
      return
    }

    if (inConnection) {
      if (schemaBrowserOpen) {
        return
      }
      if (key.name === "q" || key.name === "escape") {
        onBack()
      }
      if (key.ctrl && key.name === "l") {
        onLogout()
      }
      return
    }

    if (key.name === "j") {
      setSelectedIndex(Math.min(selectedIndex + 1, Math.max(optionsLength - 1, 0)))
    } else if (key.name === "k") {
      setSelectedIndex(Math.max(selectedIndex - 1, 0))
    } else if (key.name === "g") {
      setSelectedIndex(0)
    } else if (key.name === "G") {
      setSelectedIndex(Math.max(optionsLength - 1, 0))
    } else if (key.name === "return" && optionsLength > 0) {
      onOpenSelected()
    } else if (key.name === "a") {
      onAdd()
    } else if (key.name === "d") {
      onDelete()
    } else if (key.ctrl && key.name === "l") {
      onLogout()
    }
  })
}
