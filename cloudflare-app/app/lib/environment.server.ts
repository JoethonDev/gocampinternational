/** Accept a string because Wrangler narrows generated vars to the configured environment. */
export function isProduction(env: { GOCAMP_ENV: string }): boolean {
  return env.GOCAMP_ENV === "production";
}
