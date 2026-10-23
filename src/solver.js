#!/usr/bin/env node
'use strict';

/**
 * solver — captcha-wall classifier for this build.
 *
 * This panel's signup gate is HTTP-only (no rendered widget on the paths the CLI
 * uses), so there is nothing to *solve* locally: the module's job is to name the
 * wall when one appears, and to use an external rail **only** when the operator
 * has wired one (`<ENV>_SOLVER_CMD`, e.g. a captcha-hub helper). No rail ⇒ a clear
 * `captcha-wall` class instead of a silent failure loop.
 */

const { spawnSync } = require('child_process');

const WALLS = [
  [/turnstile|cf-turnstile|challenges\.cloudflare\.com/i, 'turnstile'],
  [/recaptcha|human_verification_required|g-recaptcha/i, 'recaptcha'],
  [/just a moment|cf-browser-verification|attention required|cloudflare/i, 'cloudflare-challenge'],
  [/captcha|验证码.*(?:错误|失败)/i, 'generic-captcha'],
];

/** Name the wall a response body/error text carries, or null when it is not one. */
function classify(text) {
  const s = String(text || '');
  for (const [re, name] of WALLS) if (re.test(s)) return name;
  return null;
}

/** The env var that would carry an external solver command, per build. */
function envName() {
  return `${process.env.OMP_SLUG_ENV || 'XEDUAPI'}_SOLVER_CMD`;
}

/** Is an external rail wired? (never true on a stock install) */
function available() {
  return !!process.env[envName()];
}

/**
 * Ask the configured rail for a token. Returns `{ token, rail }` or
 * `{ token: null, rail: null, reason }` — the caller records the class either way.
 * A browser is never launched here: this build stays HTTP-only.
 */
function solve(kind, siteKey = '') {
  const cmd = process.env[envName()];
  if (!cmd) return { token: null, rail: null, reason: `no rail (set ${envName()} to wire one)` };
  const r = spawnSync(cmd, [kind, siteKey].filter(Boolean), { encoding: 'utf8', timeout: 120000, windowsHide: true, shell: true });
  const token = String(r.stdout || '').trim().split(/\s+/).pop();
  if (r.status !== 0 || !token) return { token: null, rail: cmd.split(/\s+/)[0], reason: `rail failed (exit ${r.status})` };
  return { token, rail: cmd.split(/\s+/)[0] };
}

module.exports = { classify, available, solve, envName };

if (require.main === module) {
  const kind = process.argv[2] || 'turnstile';
  const res = available() ? solve(kind, process.argv[3] || '') : { token: null, rail: null, reason: `no rail (set ${envName()} to wire one)` };
  console.log(JSON.stringify(res));
}
