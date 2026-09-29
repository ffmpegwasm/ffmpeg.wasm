// Web Worker globals for ../worker.js
import { parentPort } from "node:worker_threads";

const scope = globalThis as unknown as {
  self: unknown;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};
scope.self = globalThis;
scope.postMessage = (message, transfer = []) => parentPort!.postMessage(message, transfer as never[]);
