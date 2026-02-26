declare const process: {
  cwd(): string;
};

declare const Buffer: {
  from(input: string, encoding?: string): {
    length: number;
    toString(encoding?: string): string;
  };
};

declare module 'node:fs/promises' {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: string): Promise<string>;
  export function writeFile(path: string, data: string, encoding: string): Promise<void>;
}

declare module 'node:path' {
  const path: {
    join(...parts: string[]): string;
  };
  export default path;
}

declare module 'node:crypto' {
  export function randomUUID(): string;
  export function randomBytes(size: number): {
    toString(encoding?: string): string;
  };
  export function pbkdf2Sync(
    password: string,
    salt: string,
    iterations: number,
    keyLength: number,
    digest: string
  ): {
    length: number;
    toString(encoding?: string): string;
  };
  export function timingSafeEqual(
    a: {
      length: number;
    },
    b: {
      length: number;
    }
  ): boolean;
  export function createHash(algorithm: string): {
    update(input: string): {
      digest(): {
        toString(encoding?: string): string;
      };
    };
  };
}
