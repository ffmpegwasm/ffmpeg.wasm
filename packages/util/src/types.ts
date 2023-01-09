export interface DownloadProgressEvent {
  url: string | URL;
  total: number;
  received: number;
  delta: number;
  done: boolean;
}

export type ProgressCallback = (event: DownloadProgressEvent) => void;
