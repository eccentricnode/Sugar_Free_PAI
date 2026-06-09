declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
};

declare function setTimeout(
  handler: () => void,
  timeout?: number,
): unknown;

declare function clearTimeout(timer: unknown): void;

declare module "node:child_process" {
  interface ReadablePipe {
    setEncoding(encoding: string): void;
    on(event: "data", listener: (chunk: unknown) => void): void;
  }

  interface SpawnedChild {
    stdout: ReadablePipe;
    stderr: ReadablePipe;
    kill(signal?: string): boolean;
    on(event: "error", listener: (error: Error) => void): void;
    on(
      event: "close",
      listener: (code: number | null, signal: string | null) => void,
    ): void;
  }

  export function spawn(
    command: string,
    args: string[],
    options: {
      cwd: string;
      env: Record<string, string>;
      stdio: ["ignore", "pipe", "pipe"];
    },
  ): SpawnedChild;
}

declare module "bun:test" {
  type TestFunction = {
    (name: string, fn: () => unknown | Promise<unknown>): void;
    skip(name: string, fn: () => unknown | Promise<unknown>): void;
  };

  export const describe: (name: string, fn: () => void) => void;
  export const expect: (actual: unknown) => any;
  export const test: TestFunction;
}
