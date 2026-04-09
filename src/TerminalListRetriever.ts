import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

export interface SessionInfo {
  sessionId: string;
  name: string;
  tty: string;
  isCurrentSession: boolean;
}

export interface TabInfo {
  tabIndex: number;
  isCurrentTab: boolean;
  sessions: SessionInfo[];
}

export interface WindowInfo {
  windowId: string;
  name: string;
  isFrontWindow: boolean;
  tabs: TabInfo[];
}

export interface TerminalList {
  windows: WindowInfo[];
}

export default class TerminalListRetriever {
  protected async executeScript(command: string): Promise<string> {
    const { stdout } = await execPromise(command);
    return stdout.trim();
  }

  async getTerminalList(): Promise<TerminalList> {
    const ascript = `
      tell application "iTerm2"
        set outputText to ""
        set frontWindowId to id of front window

        repeat with w in windows
          set wId to id of w
          set wName to name of w
          set isFront to (wId is equal to frontWindowId)
          set tabIndex to 0

          repeat with t in tabs of w
            set tabIndex to tabIndex + 1
            set isCurrentTab to false
            try
              set isCurrentTab to (t is equal to current tab of w)
            end try

            repeat with s in sessions of t
              set sName to name of s
              set sTty to tty of s
              set sId to id of s
              set isCurrentSession to false
              try
                if isCurrentTab then
                  set isCurrentSession to (s is equal to current session of t)
                end if
              end try

              set theLine to ("" & wId & "\t" & wName & "\t" & isFront & "\t" & tabIndex & "\t" & isCurrentTab & "\t" & sId & "\t" & sName & "\t" & sTty & "\t" & (isFront and isCurrentSession))
              if outputText is equal to "" then
                set outputText to theLine
              else
                set outputText to outputText & linefeed & theLine
              end if
            end repeat
          end repeat
        end repeat

        return outputText
      end tell
    `;

    try {
      const output = await this.executeScript(`/usr/bin/osascript -e '${ascript}'`);
      return this.parseOutput(output);
    } catch (error: unknown) {
      throw new Error(`Failed to retrieve terminal list: ${(error as Error).message}`);
    }
  }

  parseOutput(output: string): TerminalList {
    if (!output || output.trim() === '') {
      return { windows: [] };
    }

    const lines = output.trim().split('\n');
    const windowMap = new Map<string, WindowInfo>();

    for (const line of lines) {
      const fields = line.split('\t');
      if (fields.length < 9) continue;

      const [windowId, windowName, isFrontStr, tabIndexStr, isCurrentTabStr, sessionId, sessionName, tty, isCurrentSessionStr] = fields;

      if (!windowMap.has(windowId)) {
        windowMap.set(windowId, {
          windowId,
          name: windowName,
          isFrontWindow: isFrontStr === 'true',
          tabs: [],
        });
      }

      const windowInfo = windowMap.get(windowId)!;
      const tabIndex = parseInt(tabIndexStr, 10);

      let tabInfo = windowInfo.tabs.find(t => t.tabIndex === tabIndex);
      if (!tabInfo) {
        tabInfo = {
          tabIndex,
          isCurrentTab: isCurrentTabStr === 'true',
          sessions: [],
        };
        windowInfo.tabs.push(tabInfo);
      }

      tabInfo.sessions.push({
        sessionId,
        name: sessionName,
        tty,
        isCurrentSession: isCurrentSessionStr === 'true',
      });
    }

    return { windows: Array.from(windowMap.values()) };
  }
}
