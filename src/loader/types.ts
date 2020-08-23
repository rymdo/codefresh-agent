export interface FileSystem {
  readFileSync: (file: string) => string | Buffer;
}

export interface Glob {
  find: (
    pattern: string,
    callback: (err: any, files: string[]) => void
  ) => void;
}
