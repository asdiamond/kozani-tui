import { createCliRenderer, TextAttributes } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useState, useEffect } from "react"
import { Octokit } from "@octokit/rest"
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

interface GitHubUser {
  login: string
  name: string | null
}

function MainApp() {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const credentials = await getStoredCredentials()
      if (!credentials) {
        setLoading(false)
        return
      }

      try {
        const octokit = new Octokit({ auth: credentials.token })
        const { data } = await octokit.users.getAuthenticated()
        setUser({ login: data.login, name: data.name })
        logInfo("Fetched user:", data.login)
      } catch (err) {
        log("Failed to fetch user:", err)
      }
      setLoading(false)
    }

    fetchUser()
  }, [])

  if (loading) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text attributes={TextAttributes.DIM}>Loading...</text>
      </box>
    )
  }

  return (
    <box alignItems="center" justifyContent="center" flexGrow={1}>
      <box flexDirection="column" alignItems="center" gap={1}>
        <ascii-font font="tiny" text="Kozani" />
        <text fg="#00FF00">✓ Authenticated</text>
        {user && (
          <text attributes={TextAttributes.DIM}>
            Logged in as @{user.login}{user.name ? ` (${user.name})` : ""}
          </text>
        )}
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
