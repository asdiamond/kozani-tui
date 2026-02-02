# Kozani

A terminal UI built with OpenTUI and React.

## How It Works

The TUI lives in `/tui`. On startup, it checks for stored GitHub credentials in `~/.kozani/credentials.json`. If not authenticated, it shows a login screen that uses GitHub's OAuth device flow—user gets a code to enter at github.com/login/device, and the app polls until auth completes.

Once authenticated, the token is saved locally (with `600` permissions) and used to fetch the user's GitHub profile via Octokit. The main screen displays who's logged in.

## Key Files

- `src/index.tsx` - React components for login and main screens
- `src/auth.ts` - GitHub OAuth device flow + credential storage
- `src/logger.ts` - File-based debug logging (writes to `debug.log`)

## Running

```bash
cd tui
bun dev
```

Debug logs: `tail -f debug.log` in a separate terminal.
