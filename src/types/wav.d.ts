declare module 'wav' {
  export interface WriterOptions {
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
  }
  
  export class Writer {
    constructor(options?: WriterOptions);
    on(event: 'data', callback: (chunk: Buffer) => void): void;
    on(event: 'end', callback: () => void): void;
    write(data: Buffer): void;
    end(): void;
  }
  
  export interface Reader {
    on(event: 'data', callback: (chunk: Buffer) => void): void;
    on(event: 'end', callback: () => void): void;
  }
  
  export interface FileWriterOptions {
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
  }
  
  export class FileWriter {
    constructor(fileName: string, options?: FileWriterOptions);
    on(event: 'data', callback: (chunk: Buffer) => void): void;
    on(event: 'end', callback: () => void): void;
    write(data: Buffer): void;
    end(): void;
  }
}