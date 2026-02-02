import { join } from "path"
import { mkdir, readFile, writeFile, chmod } from "fs/promises"
import { CONFIG_DIR } from "./auth"
import { log, logInfo } from "./logger"

const CONNECTIONS_FILE = join(CONFIG_DIR, "connections.json")

export interface Connection {
  id: string
  name: string
  url: string
  createdAt: string
}

interface ConnectionsData {
  connections: Connection[]
}

export async function getConnections(): Promise<Connection[]> {
  try {
    const data = await readFile(CONNECTIONS_FILE, "utf-8")
    const parsed: ConnectionsData = JSON.parse(data)
    logInfo("Loaded", parsed.connections.length, "connections")
    return parsed.connections
  } catch {
    log("No connections file found")
    return []
  }
}

export async function saveConnection(name: string, url: string): Promise<Connection> {
  const connections = await getConnections()
  
  const newConnection: Connection = {
    id: crypto.randomUUID(),
    name,
    url,
    createdAt: new Date().toISOString(),
  }
  
  connections.push(newConnection)
  
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })
  await writeFile(CONNECTIONS_FILE, JSON.stringify({ connections }, null, 2))
  await chmod(CONNECTIONS_FILE, 0o600)
  
  logInfo("Saved connection:", name)
  return newConnection
}

export async function deleteConnection(id: string): Promise<void> {
  const connections = await getConnections()
  const filtered = connections.filter(c => c.id !== id)
  
  await writeFile(CONNECTIONS_FILE, JSON.stringify({ connections: filtered }, null, 2))
  await chmod(CONNECTIONS_FILE, 0o600)
  
  logInfo("Deleted connection:", id)
}
