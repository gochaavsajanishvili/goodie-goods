export function isEntrypoint(metaUrl: string): boolean {
  return metaUrl === `file://${process.argv[1] ?? ''}`;
}

export function runCli<T>(label: string, fn: () => Promise<T>): void {
  fn()
    .then((summary) => {
      console.warn(`${label} done: ${JSON.stringify(summary)}`);
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${label} failed: ${message}`);
      process.exit(1);
    });
}
