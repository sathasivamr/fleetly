/** Normalized error from Traccar REST responses. */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, body?: unknown, raw?: string, needsTotp?: boolean }} meta
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = meta.status;
    this.body = meta.body;
    this.raw = meta.raw;
    this.needsTotp = meta.needsTotp;
  }
}
