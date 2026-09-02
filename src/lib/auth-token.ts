let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let onRefresh: (() => Promise<string | null>) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null) {
  onRefresh = handler;
}

export function refreshAccessToken() {
  return onRefresh?.() ?? Promise.resolve(null);
}
