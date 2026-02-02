import { appendFileSync, writeFileSync } from "fs"
import { join } from "path"

const LOG_FILE = join(process.cwd(), "debug.log")

// Clear log file on startup
writeFileSync(LOG_FILE, `--- Kozani Debug Log Started: ${new Date().toISOString()} ---\n`)

export function log(...args: unknown[]) {
  const timestamp = new Date().toISOString().split("T")[1]?.slice(0, 12) ?? ""
  const message = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
    .join(" ")
  appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`)
}

export function logError(...args: unknown[]) {
  log("[ERROR]", ...args)
}

export function logInfo(...args: unknown[]) {
  log("[INFO]", ...args)
}
