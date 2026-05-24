import 'server-only';

import { getEnv } from './env';

export interface DispatchResult {
  readonly ok: boolean;
  readonly reason: string;
}

const GITHUB_API_VERSION = '2022-11-28';

export async function triggerIngestWorkflow(): Promise<DispatchResult> {
  const env = getEnv();
  if (env.GITHUB_REPO === undefined || env.GITHUB_DISPATCH_TOKEN === undefined) {
    return { ok: false, reason: 'not-configured' };
  }

  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.GITHUB_WORKFLOW_FILE}/dispatches`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: env.GITHUB_DEFAULT_REF }),
  });

  if (response.status === 204) {
    return { ok: true, reason: 'dispatched' };
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (response.status === 404) {
    return { ok: false, reason: 'not-found' };
  }
  return { ok: false, reason: `http-${response.status.toString()}` };
}
