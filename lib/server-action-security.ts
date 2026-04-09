import { headers } from "next/headers";

function normalizeHost(value: string | null | undefined) {
  return value?.split(",")[0]?.trim().toLowerCase() || "";
}

function extractHostFromUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return "";
  }
}

function collectTrustedHosts(headerStore: Headers) {
  const trustedHosts = new Set<string>();
  const hostHeaders = [
    headerStore.get("x-forwarded-host"),
    headerStore.get("host"),
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL
  ];

  for (const value of hostHeaders) {
    const normalized = value?.includes("://") ? extractHostFromUrl(value) : normalizeHost(value);
    if (normalized) trustedHosts.add(normalized);
  }

  return trustedHosts;
}

async function getRequestHosts() {
  const headerStore = await headers();
  const originHost = extractHostFromUrl(headerStore.get("origin"));
  const refererHost = extractHostFromUrl(headerStore.get("referer"));
  const trustedHosts = collectTrustedHosts(headerStore);

  return {
    originHost,
    refererHost,
    trustedHosts
  };
}

export async function isTrustedServerActionRequest() {
  const { originHost, refererHost, trustedHosts } = await getRequestHosts();

  if (!trustedHosts.size) {
    return process.env.NODE_ENV !== "production";
  }

  if (originHost && trustedHosts.has(originHost)) return true;
  if (!originHost && refererHost && trustedHosts.has(refererHost)) return true;
  return false;
}
