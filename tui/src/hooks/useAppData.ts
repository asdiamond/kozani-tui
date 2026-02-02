import { Octokit } from "@octokit/rest"
import { useCallback, useEffect, useState } from "react"
import { getStoredCredentials } from "../auth"
import { getConnections, type Connection } from "../connections"
import { log, logInfo } from "../logger"

export interface GitHubUser {
  login: string
  name: string | null
}

export function useAppData() {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { user, connections, loading, reload: loadData }
}
