# iterm2-mcp

[中文](README.md) | [English](README_EN.md)

一个 Model Context Protocol (MCP) 服务器，提供对 iTerm2 终端会话的访问能力。

### 特性

**高效的 Token 使用：** iterm2-mcp 让模型能够只查看它感兴趣的输出内容。即使是长时间运行的命令，模型通常也只需要查看最后几行输出。

**自然集成：** 你与模型共享 iTerm。你可以询问屏幕上的内容，或者将任务委托给模型，观察它逐步执行。

**完整的终端控制和 REPL 支持：** 模型可以启动并与 REPL 交互，也可以发送 ctrl-c、ctrl-z 等控制字符。

**依赖精简：** iterm2-mcp 以最少的依赖构建，可通过 npx 运行。它被设计为易于添加到 Claude Desktop 和其他 MCP 客户端中，开箱即用。


## 安全注意事项

* 用户有责任安全地使用该工具。
* 无内置限制：iterm2-mcp 不会评估所执行命令的安全性。
* 模型可能会有意外行为。用户应监控活动并在适当时中止操作。
* 对于多步骤任务，如果模型偏离方向，你可能需要中断它。建议先从较小、聚焦的任务开始，直到你熟悉模型的行为方式。

### 工具

- `write_to_terminal` - 向活动的 iTerm2 终端写入内容，通常用于执行命令。返回命令产生的输出行数。
- `read_from_terminal` - 从活动的 iTerm2 终端读取指定行数的输出。
- `send_control_character` - 向活动的 iTerm2 终端发送控制字符。
- `get_terminal_list` - 返回所有打开的 iTerm2 窗口、标签页和会话的信息，包括当前活动的会话。

所有工具都支持可选的 `sessionId` 参数，用于指定操作的目标会话。通过 `get_terminal_list` 获取会话 ID。

### 环境要求

* iTerm2 必须正在运行
* Node.js 18 或更高版本


## 通过 Claude Code CLI 安装

```bash
claude mcp add iterm2-mcp -- node /path/to/iterm2-mcp/build/index.js
```

## 开发

安装依赖：
```bash
npm install
```

构建服务器：
```bash
npm run build
```

开发模式（自动重新构建）：
```bash
npm run watch
```

### 调试

由于 MCP 服务器通过 stdio 通信，调试可能会有一定难度。推荐使用 [MCP Inspector](https://github.com/modelcontextprotocol/inspector)，可通过以下包脚本启动：

```bash
npm run inspector
npm run debug <command>
```

Inspector 会提供一个 URL，可在浏览器中访问调试工具。
