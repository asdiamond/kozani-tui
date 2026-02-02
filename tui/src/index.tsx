import { createCliRenderer, TextAttributes } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useState, useEffect } from "react"
import { Octokit } from "@octokit/rest"
import { isAuthenticated, login, getStoredCredentials } from "./auth"
import { getConnections, saveConnection, type Connection } from "./connections"
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

function AddConnectionForm({ onSaved }: { onSaved: () => void }) {
  const [step, setStep] = useState<"url" | "name" | "saving">("url")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleUrlSubmit = (value: string) => {
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

  const handleNameSubmit = async (name: string) => {
    const connectionName = name.trim() || "My Database"
    setStep("saving")
    try {
      await saveConnection(connectionName, url)
      onSaved()
    } catch (err) {
      setError("Failed to save connection")
      setStep("url")
    }
  }

  if (step === "url") {
    return (
      <box flexDirection="column" gap={1}>
        <text>Enter database URL:</text>
        <text attributes={TextAttributes.DIM}>e.g. postgresql://user:pass@localhost:5432/mydb</text>
        {error && <text fg="#FF0000">{error}</text>}
        <input
          width={80}
          focused
          placeholder="postgresql://..."
          onSubmit={handleUrlSubmit as any}
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
          onSubmit={handleNameSubmit as any}
        />
      </box>
    )
  }

  return <text attributes={TextAttributes.DIM}>Saving...</text>
}

function MainApp() {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadData = async () => {
    const credentials = await getStoredCredentials()
    if (credentials) {
      try {
        const octokit = new Octokit({ auth: credentials.token })
        const { data } = await octokit.users.getAuthenticated()
        setUser({ login: data.login, name: data.name })
        logInfo("Fetched user:", data.login)
      } catch (err) {
        log("Failed to fetch user:", err)
      }
    }

    const conns = await getConnections()
    setConnections(conns)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text attributes={TextAttributes.DIM}>Loading...</text>
      </box>
    )
  }

  if (showAddForm) {
    return (
      <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
        <ascii-font font="tiny" text="Kozani" />
        <AddConnectionForm
          onSaved={() => {
            setShowAddForm(false)
            loadData()
          }}
        />
      </box>
    )
  }

  return (
    <box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} gap={1}>
      <ascii-font font="tiny" text="Kozani" />
      <text fg="#00FF00">✓ Authenticated</text>
      {user && (
        <text attributes={TextAttributes.DIM}>
          Logged in as @{user.login}{user.name ? ` (${user.name})` : ""}
        </text>
      )}
      
      <box flexDirection="column" marginTop={1} gap={1}>
        <text attributes={TextAttributes.BOLD}>Connections:</text>
        {connections.length === 0 ? (
          <text attributes={TextAttributes.DIM}>No connections yet</text>
        ) : (
          connections.map((conn) => (
            <text key={conn.id}>• {conn.name}</text>
          ))
        )}
        <text> </text>
        <text attributes={TextAttributes.DIM}>Press Enter to add a connection</text>
        <input
          width={1}
          focused
          onSubmit={() => setShowAddForm(true)}
        />
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
