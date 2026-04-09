#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import CommandExecutor from "./CommandExecutor.js";
import TtyOutputReader from "./TtyOutputReader.js";
import SendControlCharacter from "./SendControlCharacter.js";
import TerminalListRetriever from "./TerminalListRetriever.js";

const server = new Server(
  {
    name: "iterm2-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "write_to_terminal",
        description: "Writes text to the active iTerm2 terminal - often used to run a command in the terminal",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The command to run or text to write to the terminal"
            },
            sessionId: {
              type: "string",
              description: "Optional session ID to target a specific session. If omitted, targets the current session of the front window. Use get_terminal_list to discover session IDs."
            },
          },
          required: ["command"]
        }
      },
      {
        name: "read_from_terminal",
        description: "Reads the output from the active iTerm2 terminal",
        inputSchema: {
          type: "object",
          properties: {
            linesOfOutput: {
              type: "integer",
              description: "The number of lines of output to read."
            },
            sessionId: {
              type: "string",
              description: "Optional session ID to target a specific session. If omitted, targets the current session of the front window. Use get_terminal_list to discover session IDs."
            },
          },
          required: ["linesOfOutput"]
        }
      },
      {
        name: "send_control_character",
        description: "Sends a control character to the active iTerm2 terminal (e.g., Control-C, or special sequences like ']' for telnet escape)",
        inputSchema: {
          type: "object",
          properties: {
            letter: {
              type: "string",
              description: "The letter corresponding to the control character (e.g., 'C' for Control-C, ']' for telnet escape)"
            },
            sessionId: {
              type: "string",
              description: "Optional session ID to target a specific session. If omitted, targets the current session of the front window. Use get_terminal_list to discover session IDs."
            },
          },
          required: ["letter"]
        }
      },
      {
        name: "get_terminal_list",
        description: "Returns information about all open iTerm2 windows, tabs, and sessions, including which session is currently active.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "write_to_terminal": {
      let executor = new CommandExecutor();
      const command = String(request.params.arguments?.command);
      const sessionId = request.params.arguments?.sessionId as string | undefined;
      const beforeCommandBuffer = await TtyOutputReader.retrieveBuffer(sessionId);
      const beforeCommandBufferLines = beforeCommandBuffer.split("\n").length;

      await executor.executeCommand(command, sessionId);

      const afterCommandBuffer = await TtyOutputReader.retrieveBuffer(sessionId);
      const afterCommandBufferLines = afterCommandBuffer.split("\n").length;
      const outputLines = afterCommandBufferLines - beforeCommandBufferLines

      return {
        content: [{
          type: "text",
          text: `${outputLines} lines were output after sending the command to the terminal. Read the last ${outputLines} lines of terminal contents to orient yourself. Never assume that the command was executed or that it was successful.`
        }]
      };
    }
    case "read_from_terminal": {
      const linesOfOutput = Number(request.params.arguments?.linesOfOutput) || 25
      const sessionId = request.params.arguments?.sessionId as string | undefined;
      const output = await TtyOutputReader.call(linesOfOutput, sessionId)

      return {
        content: [{
          type: "text",
          text: output
        }]
      };
    }
    case "send_control_character": {
      const ttyControl = new SendControlCharacter();
      const letter = String(request.params.arguments?.letter);
      const sessionId = request.params.arguments?.sessionId as string | undefined;
      await ttyControl.send(letter, sessionId);
      
      return {
        content: [{
          type: "text",
          text: `Sent control character: Control-${letter.toUpperCase()}`
        }]
      };
    }
    case "get_terminal_list": {
      const retriever = new TerminalListRetriever();
      const terminalList = await retriever.getTerminalList();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(terminalList, null, 2)
        }]
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
