export interface Logger {
  namespace: string;
  info: (message: string, ...meta: any[]) => void;
  warning: (message: string, ...meta: any[]) => void;
  error: (message: string, ...meta: any[]) => void;
  debug: (message: string, ...meta: any[]) => void;
}
