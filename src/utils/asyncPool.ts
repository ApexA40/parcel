/** Run async tasks with a bounded concurrency pool (station × day fan-out can be many requests). */
export async function runPool<T>(tasks: (() => Promise<T>)[], limit = 12): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  const workers = Array(Math.min(limit, tasks.length))
    .fill(0)
    .map(async () => {
      while (next < tasks.length) {
        const idx = next++;
        results[idx] = await tasks[idx]();
      }
    });
  await Promise.all(workers);
  return results;
}
