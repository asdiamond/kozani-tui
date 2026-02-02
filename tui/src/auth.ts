import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device"
import { homedir } from "os"
import { join } from "path"
import { mkdir, readFile, writeFile, unlink } from "fs/promises"
import { log, logError, logInfo } from "./logger"

const GITHUB_CLIENT_ID = "Ov23liUaGKjbJU8RGoM9"

const CONFIG_DIR = join(homedir(), ".config", "kozani")
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json")

interface Credentials {
  token: string
  tokenType: string
}

interface Verification {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export async function getStoredCredentials(): Promise<Credentials | null> {
  try {
    const data = await readFile(CREDENTIALS_FILE, "utf-8")
    logInfo("Found stored credentials")
    return JSON.parse(data) as Credentials
  } catch {
    log("No stored credentials found")
    return null
  }
}

async function saveCredentials(credentials: Credentials): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  await writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2))
}

export async function logout(): Promise<void> {
  try {
    await unlink(CREDENTIALS_FILE)
  } catch {
    // File doesn't exist, that's fine
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const credentials = await getStoredCredentials()
  return credentials !== null
}

export interface LoginCallbacks {
  onVerification: (verification: { userCode: string; verificationUri: string }) => void
  onSuccess: (token: string) => void
  onError: (error: Error) => void
}

export async function login(callbacks: LoginCallbacks): Promise<void> {
  logInfo("Starting GitHub device flow login")
  
  const auth = createOAuthDeviceAuth({
    clientType: "oauth-app",
    clientId: GITHUB_CLIENT_ID,
    scopes: ["read:user"],
    onVerification: (verification: Verification) => {
      log("Received verification code:", verification.user_code)
      log("Verification URL:", verification.verification_uri)
      callbacks.onVerification({
        userCode: verification.user_code,
        verificationUri: verification.verification_uri,
      })
    },
  })

  try {
    log("Polling for authentication...")
    const result = await auth({ type: "oauth" })
    
    logInfo("Authentication successful, saving credentials")
    await saveCredentials({
      token: result.token,
      tokenType: result.type,
    })

    callbacks.onSuccess(result.token)
  } catch (error) {
    logError("Authentication failed:", error)
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}
