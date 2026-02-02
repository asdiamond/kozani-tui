import { createCliRenderer, TextAttributes } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useState, useEffect } from "react"
import { isAuthenticated, login, getStoredCredentials } from "./auth"
import { log, logInfo } from "./logger"

type AuthState = "checking" | "unauthenticated" | "authenticating" | "authenticated"

interface VerificationInfo {
  userCode: string
  verificationUri: string
}

function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
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
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <ascii-font font="tiny" text="Kozani" />
        <text attributes={TextAttributes.DIM}>Press Enter to login with GitHub</text>
        <input
          width={1}
          focused
          onSubmit={(value) => {
            log("onSubmit triggered! value:", value)
            startLogin()
          }}
        />
      </box>
    )
  }

  if (state === "waiting" && verification) {
    return (
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
        <ascii-font font="tiny" text="Kozani" />
        <box flexDirection="column" alignItems="center" gap={1}>
          <text>Open this URL in your browser:</text>
          <text fg="#00FFFF" selectable>{verification.verificationUri}</text>
          <text> </text>
          <text>And enter this code:</text>
          <text fg="#00FF00" attributes={TextAttributes.BOLD} selectable>{verification.userCode}</text>
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

function MainApp() {
  return (
    <box alignItems="center" justifyContent="center" flexGrow={1}>
      <box flexDirection="column" alignItems="center" gap={1}>
        <ascii-font font="tiny" text="Kozani" />
        <text fg="#00FF00">✓ Authenticated</text>
        <text attributes={TextAttributes.DIM}>Welcome! You're logged in.</text>
      </box>
    </box>
  )
}

function App() {
  const [authState, setAuthState] = useState<AuthState>("checking")

  useEffect(() => {
    logInfo("App mounted, checking auth...")
    isAuthenticated().then((authenticated) => {
      logInfo("Auth check complete, authenticated:", authenticated)
      setAuthState(authenticated ? "authenticated" : "unauthenticated")
    })
  }, [])

  if (authState === "checking") {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text attributes={TextAttributes.DIM}>Checking authentication...</text>
      </box>
    )
  }

  if (authState === "unauthenticated" || authState === "authenticating") {
    return <LoginScreen onLoginSuccess={() => setAuthState("authenticated")} />
  }

  return <MainApp />
}

const renderer = await createCliRenderer()
createRoot(renderer).render(<App />)
