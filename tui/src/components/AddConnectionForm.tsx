import { TextAttributes } from "@opentui/core"
import { useState } from "react"
import { saveConnection } from "../connections"

export function AddConnectionForm({ onSaved }: { onSaved: () => void }) {
  const [step, setStep] = useState<"url" | "name" | "saving">("url")
  const [url, setUrl] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleUrlSubmit = () => {
    const value = urlInput
    if (!value.trim()) {
      setError("URL cannot be empty")
      return
    }
    if (!value.includes("://")) {
      setError("Invalid URL format")
      return
    }
    setUrl(value.trim())
    setError(null)
    setStep("name")
  }

  const handleNameSubmit = () => {
    const name = nameInput
    const connectionName = name.trim() || "My Database"
    setStep("saving")
    void (async () => {
      try {
        await saveConnection(connectionName, url)
        onSaved()
      } catch {
        setError("Failed to save connection")
        setStep("url")
      }
    })()
  }

  if (step === "url") {
    return (
      <box flexDirection="column" gap={1}>
        <text>Enter database URL:</text>
        <text attributes={TextAttributes.DIM}>
          e.g. postgresql://user:pass@localhost:5432/mydb
        </text>
        {error && <text fg="#FF0000">{error}</text>}
        <input
          width={80}
          focused
          placeholder="postgresql://..."
          onInput={(value) => {
            setUrlInput(value)
            if (error) {
              setError(null)
            }
          }}
          onSubmit={handleUrlSubmit}
        />
      </box>
    )
  }

  if (step === "name") {
    return (
      <box flexDirection="column" gap={1}>
        <text>Connection name (optional):</text>
        <input
          width={30}
          focused
          placeholder="My Database"
          onInput={setNameInput}
          onSubmit={handleNameSubmit}
        />
      </box>
    )
  }

  return <text attributes={TextAttributes.DIM}>Saving...</text>
}
