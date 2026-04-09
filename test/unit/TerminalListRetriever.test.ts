// @ts-nocheck
import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import TerminalListRetriever from '../../src/TerminalListRetriever.js';

class MockTerminalListRetriever extends TerminalListRetriever {
  mockExecuteScript = jest.fn();

  protected async executeScript(command: string): Promise<string> {
    return this.mockExecuteScript(command);
  }
}

describe('TerminalListRetriever', () => {
  let retriever: MockTerminalListRetriever;

  beforeEach(() => {
    retriever = new MockTerminalListRetriever();
    retriever.mockExecuteScript.mockClear();
  });

  test('should parse single window with single tab and session', async () => {
    const output = `win-1\t~/dev/project\ttrue\t1\ttrue\tsess-1\tzsh\t/dev/ttys001\ttrue`;
    retriever.mockExecuteScript.mockResolvedValue(output);

    const result = await retriever.getTerminalList();

    expect(result.windows).toHaveLength(1);
    expect(result.windows[0]).toEqual({
      windowId: 'win-1',
      name: '~/dev/project',
      isFrontWindow: true,
      tabs: [{
        tabIndex: 1,
        isCurrentTab: true,
        sessions: [{
          sessionId: 'sess-1',
          name: 'zsh',
          tty: '/dev/ttys001',
          isCurrentSession: true,
        }],
      }],
    });
  });

  test('should parse multiple windows with multiple tabs and sessions', async () => {
    const lines = [
      `win-1\t~/dev/project\ttrue\t1\ttrue\tsess-1\tzsh\t/dev/ttys001\ttrue`,
      `win-1\t~/dev/project\ttrue\t1\ttrue\tsess-2\tbash\t/dev/ttys002\tfalse`,
      `win-1\t~/dev/project\ttrue\t2\tfalse\tsess-3\tzsh\t/dev/ttys003\tfalse`,
      `win-2\t~/other\tfalse\t1\ttrue\tsess-4\tzsh\t/dev/ttys004\tfalse`,
    ];
    retriever.mockExecuteScript.mockResolvedValue(lines.join('\n'));

    const result = await retriever.getTerminalList();

    expect(result.windows).toHaveLength(2);

    // First window
    const w1 = result.windows[0];
    expect(w1.windowId).toBe('win-1');
    expect(w1.isFrontWindow).toBe(true);
    expect(w1.tabs).toHaveLength(2);
    expect(w1.tabs[0].sessions).toHaveLength(2);
    expect(w1.tabs[0].sessions[0].isCurrentSession).toBe(true);
    expect(w1.tabs[0].sessions[1].isCurrentSession).toBe(false);
    expect(w1.tabs[1].tabIndex).toBe(2);
    expect(w1.tabs[1].isCurrentTab).toBe(false);

    // Second window
    const w2 = result.windows[1];
    expect(w2.windowId).toBe('win-2');
    expect(w2.isFrontWindow).toBe(false);
    expect(w2.tabs).toHaveLength(1);
    expect(w2.tabs[0].sessions[0].tty).toBe('/dev/ttys004');
  });

  test('should return empty windows array for empty output', async () => {
    retriever.mockExecuteScript.mockResolvedValue('');

    const result = await retriever.getTerminalList();

    expect(result.windows).toEqual([]);
  });

  test('should throw wrapped error when AppleScript fails', async () => {
    retriever.mockExecuteScript.mockRejectedValue(new Error('osascript failed'));

    await expect(retriever.getTerminalList()).rejects.toThrow(
      'Failed to retrieve terminal list: osascript failed'
    );
  });

  test('should call executeScript with osascript command', async () => {
    retriever.mockExecuteScript.mockResolvedValue('');

    await retriever.getTerminalList();

    expect(retriever.mockExecuteScript).toHaveBeenCalledWith(
      expect.stringContaining('/usr/bin/osascript')
    );
  });

  test('should skip malformed lines with insufficient fields', async () => {
    const lines = [
      `win-1\t~/dev/project\ttrue\t1\ttrue\tsess-1\tzsh\t/dev/ttys001\ttrue`,
      `bad-line\tmissing-fields`,
    ];
    retriever.mockExecuteScript.mockResolvedValue(lines.join('\n'));

    const result = await retriever.getTerminalList();

    expect(result.windows).toHaveLength(1);
    expect(result.windows[0].tabs[0].sessions).toHaveLength(1);
  });

  test('parseOutput should handle whitespace-only output', () => {
    const result = retriever.parseOutput('   \n  ');

    expect(result.windows).toEqual([]);
  });
});
