# iterm2-mcp 

[中文](README.md) | [English](README_EN.md)

A Model Context Protocol local server that provides access to your iTerm2 session.

### Features

**Efficient Token Use:** iterm2-mcp gives the model the ability to inspect only the output that the model is interested in. The model typically only wants to see the last few lines of output even for long running commands. 

**Natural Integration:** You share iTerm2 with the model. You can ask questions about what's on the screen, or delegate a task to the model and watch as it performs each step.

**Full Terminal Control and REPL support:** The model can start and interact with REPL's as well as send control characters like ctrl-c, ctrl-z, etc.

**Easy on the Dependencies:** iterm2-mcp is built with minimal dependencies and is runnable via npx. It's designed to be easy to add to Claude Desktop and other MCP clients. It should just work.


## Safety Considerations

* The user is responsible for using the tool safely.
* No built-in restrictions: iterm2-mcp makes no attempt to evaluate the safety of commands that are executed.
* Models can behave in unexpected ways. The user is expected to monitor activity and abort when appropriate.
* For multi-step tasks, you may need to interrupt the model if it goes off track. Start with smaller, focused tasks until you're familiar with how the model behaves. 

### Tools
- `write_to_terminal` - Writes to the active iTerm2 terminal, often used to run a command. Returns the number of lines of output produced by the command.
- `read_from_terminal` - Reads the requested number of lines from the active iTerm2 terminal.
- `send_control_character` - Sends a control character to the active iTerm2 terminal.
- `get_terminal_list` - Returns information about all open iTerm2 windows, tabs, and sessions, including which session is currently active.

### Requirements

* iTerm2 must be running
* Node version 18 or greater


## Installing via Claude Code CLI

```bash
claude mcp add iterm2-mcp -- node /path/to/iterm2-mcp/build/index.js
```

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
npm run debug <command>
```

The Inspector will provide a URL to access debugging tools in your browser.
