// AI Request Queue for rate limiting and managing AI requests
class AIRequestQueue {
  private queue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelay = 1000; // 1 second between requests

  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minDelay - timeSinceLastRequest)
      );
    }

    const item = this.queue.shift();
    if (!item) {
      this.processing = false;
      return;
    }

    this.lastRequestTime = Date.now();

    try {
      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }

    this.processing = false;
    this.processQueue();
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const aiQueue = new AIRequestQueue();
