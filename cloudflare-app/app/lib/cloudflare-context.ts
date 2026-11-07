import { createContext, RouterContextProvider } from "react-router";

type CloudflareContextValue = { env: Env; ctx: ExecutionContext };

const cloudflareContext = createContext<CloudflareContextValue>();

export function getCloudflare(context: Readonly<RouterContextProvider>) {
  return context.get(cloudflareContext);
}

export function createCloudflareContext(env: Env, ctx: ExecutionContext) {
  const context = new RouterContextProvider();
  context.set(cloudflareContext, { env, ctx });
  return context;
}
