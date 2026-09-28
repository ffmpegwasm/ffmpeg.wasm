import { Worker as ThreadWorker } from "node:worker_threads";
import { FFmpeg as BaseFFmpeg } from "../classes.js";

export * from "../types.js";
export * from "../const.js";

class NodeWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { error: unknown; preventDefault(): void }) => void) | null = null;
  #worker: ThreadWorker;

  constructor(url: URL) {
    this.#worker = new ThreadWorker(url);
    this.#worker.on("message", (data: unknown) => this.onmessage?.({ data }));
    this.#worker.on("error", (error) => this.onerror?.({ error, preventDefault() {} }));
  }

  postMessage(message: unknown, transfer: Transferable[] = []) {
    this.#worker.postMessage(message, transfer as never[]);
  }

  terminate() {
    void this.#worker.terminate();
  }
}

export class FFmpeg extends BaseFFmpeg {
  protected createWorker(classWorkerURL?: string): Worker {
    const url = new URL(classWorkerURL ?? "./worker.js", import.meta.url);
    return new NodeWorker(url) as unknown as Worker;
  }
}
