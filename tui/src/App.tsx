import { useEffect, useState } from "react"
import { isAuthenticated } from "./auth"
import { LoginScreen } from "./components/LoginScreen"
import { LoadingScreen } from "./components/LoadingScreen"
import { MainApp } from "./components/MainApp"
import { logInfo } from "./logger"

type AuthState = "checking" | "unauthenticated" | "authenticated"

export function App() {
  const [authState, setAuthState] = useState<AuthState>("checking")

  useEffect(() => {
    logInfo("App mounted, checking auth...")
    isAuthenticated().then((authenticated) => {
      logInfo("Auth check complete, authenticated:", authenticated)
      setAuthState(authenticated ? "authenticated" : "unauthenticated")
    })
  }, [])

  if (authState === "checking") {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (authState === "unauthenticated") {
    return <LoginScreen onLoginSuccess={() => setAuthState("authenticated")} />
  }

  return <MainApp />
}
