import { TextAttributes } from "@opentui/core"
import { useEffect, useState } from "react"
import { login } from "../auth"
import { Logo } from "./Logo"
import { log, logInfo } from "../logger"

interface VerificationInfo {
  userCode: string
  verificationUri: string
}

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [state, setState] = useState<"idle" | "waiting" | "error">("idle")
  const [verification, setVerification] = useState<VerificationInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    logInfo("LoginScreen mounted, state:", state)
  }, [state])

  const startLogin = () => {
    logInfo("startLogin called!")
    setState("waiting")
    login({
      onVerification: (v) => {
        setVerification(v)
      },
      onSuccess: () => {
        onLoginSuccess()
      },
      onError: (err) => {
        setState("error")
        setError(err.message)
      },
    })
  }

  if (state === "idle") {
    return (
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
        <Logo />
        <text attributes={TextAttributes.DIM}>Press Enter to login with GitHub</text>
        <input
          width={1}
          focused
          onSubmit={() => {
            log("onSubmit triggered!")
            startLogin()
          }}
        />
      </box>
    )
  }

  if (state === "waiting" && verification) {
    return (
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
        <Logo />
        <box flexDirection="column" alignItems="center" gap={1}>
          <text>Open this URL in your browser:</text>
          <text selectable>
            <a href={verification.verificationUri} fg="#00FFFF">
              {verification.verificationUri}
            </a>
          </text>
          <text> </text>
          <text>And enter this code:</text>
          <text
            fg="#00FF00"
            attributes={TextAttributes.BOLD}
            selectable
            selectionBg="#3a3a3a"
            selectionFg="#ffffff"
          >
            {verification.userCode}
          </text>
          <text> </text>
          <text attributes={TextAttributes.DIM}>Waiting for authentication...</text>
        </box>
      </box>
    )
  }

  if (state === "error") {
    return (
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <text fg="#FF0000">Error: {error}</text>
        <text attributes={TextAttributes.DIM}>Press Enter to try again</text>
        <input width={1} focused onSubmit={() => setState("idle")} />
      </box>
    )
  }

  return (
    <box alignItems="center" justifyContent="center" flexGrow={1}>
      <text attributes={TextAttributes.DIM}>Loading...</text>
    </box>
  )
}
