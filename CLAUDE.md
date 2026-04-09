# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iterm2-mcp is a Model Context Protocol (MCP) server that lets AI models interact with iTerm2 terminals on macOS. It bridges AI assistants and the active terminal session via AppleScript, exposing four tools: `write_to_terminal`, `read_from_terminal`, `send_control_character`, and `get_terminal_list`.

**Single production dependency:** `@modelcontextprotocol/sdk`

**Requires:** macOS, iTerm2 running, Node.js 18+

## Common Commands

```bash
npm run build           # TypeScript compile to build/ and chmod the entry point
npm test                # Run unit tests (Jest + ts-jest with ESM)
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run e2e             # Run end-to-end tests against a live iTerm2 session
npm run inspector       # Launch MCP Inspector for debugging the server
```

Run a single test file:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js --config=jest.config.cjs test/unit/CommandExecutor.test.ts
```

## Architecture

All iTerm2 communication goes through macOS AppleScript (`osascript`) invocations.

**`src/index.ts`** — MCP server entry point. Registers the three tools and handles requests via stdio transport. Tracks terminal buffer line counts before/after commands to report output size.

**`src/CommandExecutor.ts`** — Sends commands to iTerm2. Handles AppleScript escaping (backslashes, quotes, control characters) while preserving Unicode. Multiline commands use AppleScript string concatenation (`"line1" & return & "line2"`). Polls iTerm2's `is processing` property and monitors CPU usage (<1% threshold) to detect command completion.

**`src/TtyOutputReader.ts`** — Reads terminal contents from iTerm2's current session via AppleScript. Static `retrieveBuffer()` for full buffer, instance `call(lines?)` for last N lines.

**`src/SendControlCharacter.ts`** — Converts letter names to ASCII control codes (A-Z → 1-26) with special cases for `]` (telnet escape, ASCII 29) and `ESCAPE`/`ESC` (ASCII 27).

**`src/TerminalListRetriever.ts`** — Enumerates all open iTerm2 windows, tabs, and sessions via AppleScript. Returns structured JSON with session IDs that can be passed to the other three tools via optional `sessionId` parameter.

**`src/ProcessTracker.ts`** — Monitors active processes on a TTY using `ps`. Scores processes to find the "most interesting" one (considers CPU, state, REPL/package-manager detection). Builds command chains showing process hierarchy and aggregates resource metrics.

## Testing

- Unit tests live in `test/unit/` and use heavy mocking (AppleScript calls, fs, child_process)
- E2E tests in `test/e2e/` run against a live iTerm2 instance — not suitable for CI
- Jest config uses ESM mode (`--experimental-vm-modules`) and maps `.js` imports back to `.ts` sources
- Coverage excludes `src/index.ts`

## Key Implementation Details

- **AppleScript escaping:** Only control characters (ASCII 0-31, 127) are escaped to Unicode; emoji, accents, and CJK characters pass through unmodified
- **Command completion detection:** Two-phase polling — first iTerm2's `is processing` flag, then CPU-based readiness check on the TTY's foreground process (350ms poll interval, 1s threshold)
- **ESM throughout:** The project uses ES modules (Node16 module resolution). Imports within source use `.js` extensions even for `.ts` files.
