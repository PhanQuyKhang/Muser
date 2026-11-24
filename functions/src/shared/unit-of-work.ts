/**
 * Runs `work` as one atomic unit. The repositories passed in are bound to the same
 * transaction, so every read and write inside `work` is atomic. All reads must happen
 * before any write, and `work` may run again if the transaction retries, so it must not
 * perform external side effects (push, email, ...).
 */
export interface UnitOfWork<TRepos> {
  run<T>(work: (repos: TRepos) => Promise<T>): Promise<T>;
}
