#!/usr/bin/env node
// Zen Control — manage an Android TV / Google TV from your browser, over adb.
// No dependencies: run with `node server.js` (or the single-file executables built by tools/build-exe.sh).
//
// Every change is written to a per-TV journal so it can be undone one by one, or all at once.

import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- paths & options

const here = fileURLToPath(import.meta.url);
// Compiled with Bun, the script lives in a virtual file system: files ship next to the executable instead.
const compiled = here.includes('$bunfs') || here.includes('~BUN');
const exeDir = path.dirname(process.execPath);
// Inside "Zen Control.app" the program sits in Contents/MacOS and its files in Contents/Resources.
const ROOT = process.env.ZEN_ROOT
  || (compiled ? (exeDir.endsWith(path.join('Contents', 'MacOS')) ? path.join(exeDir, '..', 'Resources') : exeDir) : path.dirname(here));
// Journal and original-state snapshots live in the user's folder, so they survive updates of the program.
const DATA = process.env.ZEN_DATA || (process.platform === 'win32'
  ? path.join(process.env.APPDATA || os.homedir(), 'zen-control')
  : path.join(os.homedir(), '.zen-control'));
const WEB = path.join(ROOT, 'web');
const HELPER_APK = path.join(ROOT, 'dist', 'zen-tvhelper.apk');
const HELPER_PKG = 'com.zen.tvhelper';
const HELPER_VERSION = Number((() => { try { return fs.readFileSync(path.join(ROOT, 'dist', 'zen-tvhelper.version'), 'utf8'); } catch { return 0; } })());
const ZEN_HOME = 'com.zen.tvhome';
const KNOWN = JSON.parse(fs.readFileSync(path.join(ROOT, 'known-apps.json'), 'utf8'));
const PROTECTED = new Set(KNOWN.protected);

const args = process.argv.slice(2);
const PORT = Number(args.find(a => a.startsWith('--port='))?.slice(7) || process.env.PORT || 8765);
const LAN = args.includes('--lan');
const TOKEN = LAN ? crypto.randomBytes(12).toString('hex') : null;
if (!fs.existsSync(DATA) && fs.existsSync(path.join(ROOT, 'data'))) fs.cpSync(path.join(ROOT, 'data'), DATA, { recursive: true });
fs.mkdirSync(DATA, { recursive: true });

// ---------------------------------------------------------------- adb

let ADB = null;
let serial = null;

function findAdb() {
  const exe = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const candidates = [
    process.env.ADB,
    path.join(DATA, 'tools', 'platform-tools', exe),
    path.join(ROOT, 'tools', 'platform-tools', exe),
    path.join(os.homedir(), 'Library', 'Android', 'sdk', 'platform-tools', exe),
    path.join(os.homedir(), 'Android', 'Sdk', 'platform-tools', exe),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', exe),
  ];
  for (const c of candidates) if (c && fs.existsSync(c)) return c;
  // Apps started from the Finder get a minimal PATH: also look where Homebrew installs adb.
  for (const dir of [...(process.env.PATH || '').split(path.delimiter), '/opt/homebrew/bin', '/usr/local/bin']) {
    const c = path.join(dir, exe);
    if (dir && fs.existsSync(c)) return c;
  }
  return null;
}

function run(file, argv, { binary = false, timeout = 60000 } = {}) {
  return new Promise(resolve => {
    execFile(file, argv, { encoding: binary ? 'buffer' : 'utf8', maxBuffer: 256 * 1024 * 1024, timeout, windowsHide: true },
      (err, stdout, stderr) => resolve({ ok: !err, code: err?.code ?? 0, stdout, stderr: String(stderr || '') }));
  });
}

const adbRaw = (argv, opts) => run(ADB, argv, opts);
const adb = (argv, opts) => run(ADB, serial ? ['-s', serial, ...argv] : argv, opts);
async function sh(cmd, opts) {
  const r = await adb(['shell', cmd], opts);
  return String(r.stdout).replace(/\r/g, '').trimEnd();
}

// Shell quoting for values sent to the TV's shell.
const q = s => `'${String(s).replace(/'/g, `'\\''`)}'`;
const PKG = /^[A-Za-z0-9_.]+$/;
const KEY = /^[A-Za-z0-9_.\-]+$/;
const COMPONENT = /^[A-Za-z0-9_.]+\/[A-Za-z0-9_.$]+$/;
function check(re, v, what) { if (!re.test(String(v || ''))) throw httpError(400, `invalid ${what}`); return v; }

async function downloadAdb() {
  const plat = { darwin: 'darwin', linux: 'linux', win32: 'windows' }[process.platform];
  if (!plat) throw new Error('unsupported platform');
  const url = `https://dl.google.com/android/repository/platform-tools-latest-${plat}.zip`;
  const dir = path.join(DATA, 'tools');
  fs.mkdirSync(dir, { recursive: true });
  const zip = path.join(dir, 'platform-tools.zip');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  const r = process.platform === 'win32'
    ? await run('powershell', ['-NoProfile', '-Command', `Expand-Archive -Force -Path '${zip}' -DestinationPath '${dir}'`])
    : await run('unzip', ['-q', '-o', zip, '-d', dir]);
  fs.rmSync(zip, { force: true });
  if (!r.ok) throw new Error(`unzip failed: ${r.stderr}`);
  ADB = findAdb();
  return !!ADB;
}

// ---------------------------------------------------------------- per-TV storage: baseline + journal

const safe = s => String(s).replace(/[^A-Za-z0-9._-]/g, '_');
const tvDir = () => { const d = path.join(DATA, safe(serial)); fs.mkdirSync(d, { recursive: true }); return d; };
const readJson = (f, dflt) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; } };
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 1));
const journalFile = () => path.join(tvDir(), 'journal.json');
const journal = () => readJson(journalFile(), []);

function record(entry) {
  const j = journal();
  const e = { id: crypto.randomUUID(), time: new Date().toISOString(), undone: false, ...entry };
  j.push(e);
  writeJson(journalFile(), j);
  return e;
}

async function settingsList(ns) {
  const out = await sh(`settings list ${ns}`);
  const map = {};
  for (const line of out.split('\n')) {
    const i = line.indexOf('=');
    if (i > 0) map[line.slice(0, i)] = line.slice(i + 1);
  }
  return map;
}

async function saveBaseline() {
  const f = path.join(tvDir(), 'baseline.json');
  if (fs.existsSync(f)) return;
  const [disabled, states, global, secure, system] = await Promise.all([
    pmList('-d'), packageStates(true), settingsList('global'), settingsList('secure'), settingsList('system')]);
  writeJson(f, { time: new Date().toISOString(), disabled, suspended: [...states.suspended], settings: { global, secure, system } });
}

// ---------------------------------------------------------------- device

async function pmList(flag) {
  const out = await sh(`pm list packages ${flag}`);
  return out.split('\n').map(l => l.replace(/^package:/, '').trim()).filter(Boolean).sort();
}

let statesCache = { at: 0 };
async function packageStates(force = false) {
  if (!force && Date.now() - statesCache.at < 4000) return statesCache;
  const [disabled, dump] = await Promise.all([pmList('-d'), sh('dumpsys package packages')]);
  const suspended = new Set();
  let cur = null;
  for (const line of dump.split('\n')) {
    const m = line.match(/^ {2}Package \[([^\]]+)\]/);
    if (m) { cur = m[1]; continue; }
    if (cur && /^\s+User 0:/.test(line) && /suspended=true/.test(line)) suspended.add(cur);
  }
  statesCache = { at: Date.now(), disabled: new Set(disabled), suspended };
  return statesCache;
}

async function deviceInfo() {
  const p = (await sh('getprop ro.product.manufacturer; getprop ro.product.model; getprop ro.build.version.release; getprop ro.build.version.sdk')).split('\n');
  return { manufacturer: p[0] || '', model: p[1] || '', android: p[2] || '', sdk: Number(p[3]) || 0 };
}

async function hasPackage(pkg) {
  return (await sh(`pm list packages ${pkg}`)).split('\n').includes(`package:${pkg}`);
}

async function state() {
  if (!ADB) return { adb: false };
  if (!serial) return { adb: true, connected: false };
  const st = String((await adb(['get-state'])).stdout).trim();
  if (st !== 'device') return { adb: true, connected: false, serial, pending: /unauthorized/.test(st) };
  let helper = await hasPackage(HELPER_PKG);
  if (helper && HELPER_VERSION && await helperVersion() < HELPER_VERSION) {
    await installHelper().catch(() => {});
  }
  return { adb: true, connected: true, serial, device: await deviceInfo(), helper, zenHome: await hasPackage(ZEN_HOME) };
}

async function connect(target) {
  if (!/:\d+$/.test(target)) target += ':5555';
  check(/^[A-Za-z0-9.\-]+:\d+$/, target, 'address');
  let r = await adbRaw(['connect', target]);
  if (/no route to host/i.test(r.stdout + r.stderr)) {
    // macOS can block a long-running adb server from the local network: a fresh server fixes it.
    await adbRaw(['kill-server']); await adbRaw(['start-server']);
    r = await adbRaw(['connect', target]);
  }
  serial = target;
  writeJson(path.join(DATA, 'last.json'), { serial });
  const s = await state();
  if (s.connected) await saveBaseline();
  return s;
}

function localPrefixes() {
  const out = new Set();
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal && /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(a.address)) {
        out.add(a.address.split('.').slice(0, 3).join('.'));
      }
    }
  }
  return [...out];
}

function probe(ip, port = 5555, timeout = 700) {
  return new Promise(resolve => {
    const s = net.connect({ host: ip, port });
    const done = ok => { s.destroy(); resolve(ok); };
    s.setTimeout(timeout, () => done(false));
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
  });
}

async function scan() {
  const found = [];
  await Promise.all(localPrefixes().flatMap(p => Array.from({ length: 254 }, (_, i) => `${p}.${i + 1}`))
    .map(async ip => { if (await probe(ip)) found.push(ip); }));
  // Only devices adb already knows are queried for their name: connecting to the others would pop up the
  // authorization window on every Android device of the house.
  const known = String((await adbRaw(['devices'])).stdout);
  const out = [];
  for (const ip of found.sort((a, b) => Number(a.split('.')[3]) - Number(b.split('.')[3]))) {
    const line = known.split('\n').find(l => l.startsWith(`${ip}:5555`));
    const st = line ? line.split(/\s+/)[1] : 'unknown';
    let name = '';
    if (st === 'device') {
      const p = String((await adbRaw(['-s', `${ip}:5555`, 'shell', 'getprop ro.product.manufacturer; getprop ro.product.model'])).stdout).replace(/\r/g, '').split('\n');
      name = `${p[0]} ${p[1]}`.trim();
    }
    out.push({ ip, state: st === 'device' ? 'ok' : (st === 'unauthorized' ? 'pending' : 'unknown'), name });
  }
  return out;
}

// ---------------------------------------------------------------- apps

async function installHelper() {
  if (!fs.existsSync(HELPER_APK)) throw httpError(500, 'helper APK missing (dist/zen-tvhelper.apk)');
  let r = await adb(['install', '-r', HELPER_APK]);
  if (/UPDATE_INCOMPATIBLE|INSTALL_FAILED_VERSION_DOWNGRADE/.test(r.stdout + r.stderr)) {
    // Signed with another key (or newer): the helper keeps no data, so it is simply replaced.
    await sh(`pm uninstall ${HELPER_PKG}`);
    r = await adb(['install', HELPER_APK]);
  }
  if (!/Success/.test(r.stdout)) throw httpError(500, `install failed: ${r.stdout}${r.stderr}`);
  await allowHelperStart();
}

async function helperVersion() {
  const m = (await sh(`dumpsys package ${HELPER_PKG} | grep -m1 versionCode`)).match(/versionCode=(\d+)/);
  return m ? Number(m[1]) : 0;
}

// TCL firmwares refuse to start apps that lack their APP_AUTO_START permission (unknown op elsewhere: ignored).
const allowHelperStart = () => sh(`appops set ${HELPER_PKG} APP_AUTO_START allow 2>/dev/null`);

async function helperList() {
  let r = await adb(['exec-out', 'content', 'read', '--uri', `content://${HELPER_PKG}.apps/list`], { binary: true });
  let text = r.stdout.toString('utf8');
  if (!text.startsWith('[')) {
    await allowHelperStart();
    r = await adb(['exec-out', 'content', 'read', '--uri', `content://${HELPER_PKG}.apps/list`], { binary: true });
    text = r.stdout.toString('utf8');
  }
  return text.startsWith('[') ? JSON.parse(text) : null;
}

async function apps() {
  const [states, list] = await Promise.all([packageStates(true), helperList().catch(() => null)]);
  let entries = list;
  if (!entries) {
    // Without the helper: package names only.
    const [all, sys, launch] = await Promise.all([pmList(''), pmList('-s'),
      sh('cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LEANBACK_LAUNCHER')]);
    const sysSet = new Set(sys);
    const launchSet = new Set(launch.split('\n').filter(l => l.includes('/')).map(l => l.trim().split('/')[0]));
    entries = all.map(p => ({ package: p, label: '', system: sysSet.has(p), launchable: launchSet.has(p) }));
  }
  return entries.map(a => {
    const k = KNOWN.apps[a.package];
    return {
      ...a,
      label: a.label && a.label !== a.package ? a.label : (k?.label || ''),
      enabled: !states.disabled.has(a.package),
      suspended: states.suspended.has(a.package),
      tag: k?.tag || null,
      desc: k?.desc || '',
      protected: PROTECTED.has(a.package),
    };
  }).filter(a => a.package !== HELPER_PKG)
    .sort((a, b) => (b.launchable - a.launchable) || (a.system - b.system) || (a.label || a.package).localeCompare(b.label || b.package));
}

const iconDir = () => { const d = path.join(tvDir(), 'icons'); fs.mkdirSync(d, { recursive: true }); return d; };
async function icon(pkg) {
  check(PKG, pkg, 'package');
  const f = path.join(iconDir(), `${pkg}.png`);
  if (fs.existsSync(f)) return fs.readFileSync(f);
  const r = await adb(['exec-out', 'content', 'read', '--uri', `content://${HELPER_PKG}.apps/icon/${pkg}`], { binary: true });
  if (r.stdout.length > 8 && r.stdout[1] === 0x50) { fs.writeFileSync(f, r.stdout); return r.stdout; }
  return null;
}

async function appDetails(pkg) {
  check(PKG, pkg, 'package');
  const dump = await sh(`dumpsys package ${pkg}`);
  // "install permissions" are fixed at install time; only "runtime permissions" can be granted or revoked.
  const perms = [];
  const seen = new Set();
  let section = null;
  for (const line of dump.split('\n')) {
    if (/^\s+install permissions:/.test(line)) { section = 'install'; continue; }
    if (/^\s+runtime permissions:/.test(line)) { section = 'runtime'; continue; }
    const m = line.match(/^\s+([A-Za-z0-9_.]+\.permission\.[A-Za-z0-9_.]+): granted=(true|false)(?:, flags=\[ ?([^\]]*)\])?/);
    if (!m) { if (section && line.trim() && !/^\s{6,}/.test(line)) section = null; continue; }
    const key = `${section}:${m[1]}`;
    if (!section || seen.has(key)) continue;
    seen.add(key);
    perms.push({ name: m[1], granted: m[2] === 'true', runtime: section === 'runtime', fixed: /SYSTEM_FIXED|POLICY_FIXED/.test(m[3] || '') });
  }
  const ops = {};
  for (const op of ['RUN_ANY_IN_BACKGROUND', 'RUN_IN_BACKGROUND', 'APP_AUTO_START']) {
    const out = await sh(`appops get ${pkg} ${op} 2>&1`);
    const m = out.match(new RegExp(`${op}: ([a-z]+)`));
    ops[op] = m ? m[1] : (/Unknown operation/i.test(out) ? null : 'default');
  }
  const version = (dump.match(/versionName=(\S+)/) || [])[1] || '';
  const dataDir = (dump.match(/dataDir=(\S+)/) || [])[1] || '';
  const running = (await sh(`pidof ${pkg}`)).trim() !== '';
  return { package: pkg, version, dataDir, running, permissions: perms, ops };
}

function guard(pkg) {
  if (PROTECTED.has(pkg)) throw httpError(403, 'protected');
}

async function appAction(pkg, action) {
  check(PKG, pkg, 'package');
  const st = await packageStates(true);
  const was = { enabled: !st.disabled.has(pkg), suspended: st.suspended.has(pkg) };
  let out;
  switch (action) {
    case 'disable':
      guard(pkg);
      out = await sh(`pm disable-user --user 0 ${pkg}`);
      if (!/disabled-user/.test(out)) throw httpError(500, out);
      if (was.enabled) record({ kind: 'package', pkg, action, before: 'enabled' });
      // Some firmwares (TCL) re-enable these at every boot: suspending them too keeps them off.
      if (KNOWN.apps[pkg]?.suspend && !was.suspended && /true/.test(await sh(`pm suspend --user 0 ${pkg}`))) {
        record({ kind: 'suspend', pkg, action: 'suspend', before: false });
      }
      break;
    case 'enable':
      out = await sh(`pm enable --user 0 ${pkg}`);
      if (!/new state: enabled/.test(out)) throw httpError(500, out);
      if (!was.enabled) record({ kind: 'package', pkg, action, before: 'disabled' });
      break;
    case 'suspend':
      guard(pkg);
      out = await sh(`pm suspend --user 0 ${pkg}`);
      if (!/suspended state: true/.test(out)) throw httpError(500, out);
      if (!was.suspended) record({ kind: 'suspend', pkg, action, before: false });
      break;
    case 'unsuspend':
      out = await sh(`pm unsuspend --user 0 ${pkg}`);
      if (was.suspended) record({ kind: 'suspend', pkg, action, before: true });
      break;
    case 'forcestop':
      await sh(`am force-stop ${pkg}`);
      break;
    case 'launch':
      out = await sh(`monkey -p ${pkg} -c android.intent.category.LEANBACK_LAUNCHER 1 2>&1`);
      if (/No activities found/.test(out)) out = await sh(`monkey -p ${pkg} -c android.intent.category.LAUNCHER 1 2>&1`);
      break;
    case 'uninstall':
      guard(pkg);
      // User-installed apps only: system apps are only ever disabled.
      if ((await pmList('-s')).includes(pkg)) throw httpError(403, 'system app');
      out = await sh(`pm uninstall ${pkg}`);
      if (!/Success/.test(out)) throw httpError(500, out);
      record({ kind: 'uninstall', pkg, action, undoable: false });
      break;
    default:
      throw httpError(400, 'unknown action');
  }
  statesCache.at = 0;
  return { ok: true };
}

async function setAppop(pkg, op, mode) {
  check(PKG, pkg, 'package'); check(/^[A-Z_]+$/, op, 'op'); check(/^(allow|ignore|deny|default)$/, mode, 'mode');
  if (mode !== 'allow') guard(pkg);
  const cur = (await sh(`appops get ${pkg} ${op} 2>&1`)).match(new RegExp(`${op}: ([a-z]+)`));
  const before = cur ? cur[1] : 'default';
  const out = await sh(`appops set ${pkg} ${op} ${mode} 2>&1`);
  if (/Error|Unknown/i.test(out)) throw httpError(500, out);
  if (before !== mode) record({ kind: 'appop', pkg, op, before, after: mode });
  return { ok: true };
}

async function setPermission(pkg, perm, grant) {
  check(PKG, pkg, 'package'); check(/^[A-Za-z0-9_.]+$/, perm, 'permission');
  const out = await sh(`pm ${grant ? 'grant' : 'revoke'} ${pkg} ${perm} 2>&1`);
  if (/Exception|Error/i.test(out)) throw httpError(500, out.split('\n')[0]);
  record({ kind: 'permission', pkg, perm, before: !grant, after: grant });
  return { ok: true };
}

// ---------------------------------------------------------------- settings

async function getSetting(ns, key) {
  const v = await sh(`settings get ${ns} ${key}`);
  return v === 'null' ? null : v;
}

async function putSettings(changes, label) {
  const done = [];
  for (const c of changes) {
    check(/^(global|secure|system)$/, c.ns, 'namespace'); check(KEY, c.key, 'key');
    const before = await getSetting(c.ns, c.key);
    if (c.value === null || c.value === undefined) await sh(`settings delete ${c.ns} ${c.key}`);
    else await sh(`settings put ${c.ns} ${c.key} ${q(c.value)}`);
    const after = await getSetting(c.ns, c.key);
    if (before !== after) done.push({ ns: c.ns, key: c.key, before, after });
  }
  if (done.length) record({ kind: 'settings', label: label || done.map(d => d.key).join(', '), changes: done });
  return { ok: true, changes: done };
}

const CURATED = [
  ['global', 'window_animation_scale'], ['global', 'transition_animation_scale'], ['global', 'animator_duration_scale'],
  ['system', 'screen_off_timeout'], ['secure', 'sleep_timeout'], ['secure', 'attentive_timeout'],
  ['secure', 'screensaver_enabled'], ['secure', 'screensaver_components'],
  ['global', 'private_dns_mode'], ['global', 'private_dns_specifier'],
  ['secure', 'enabled_accessibility_services'], ['secure', 'accessibility_enabled'],
  ['global', 'stay_on_while_plugged_in'], ['global', 'adb_wifi_enabled'],
];

async function settingsOverview() {
  const [global, secure, system, homes, home, a11y] = await Promise.all([
    settingsList('global'), settingsList('secure'), settingsList('system'),
    sh('cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.HOME'),
    sh('cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME'),
    sh('cmd package query-services --brief -a android.accessibilityservice.AccessibilityService'),
  ]);
  const ns = { global, secure, system };
  const values = {};
  for (const [n, k] of CURATED) values[`${n}.${k}`] = ns[n][k] ?? null;
  const enabledA11y = (secure.enabled_accessibility_services || '').split(':').filter(Boolean);
  return {
    values,
    homes: homes.split('\n').map(l => l.trim()).filter(l => COMPONENT.test(l)),
    home: home.split('\n').map(l => l.trim()).filter(l => COMPONENT.test(l)).pop() || null,
    accessibility: [...new Set(a11y.split('\n').map(l => l.trim()).filter(l => COMPONENT.test(l)).map(normComponent))]
      .map(c => ({ component: c, enabled: enabledA11y.map(normComponent).includes(c) })),
  };
}

// "pkg/.Cls" and "pkg/pkg.Cls" name the same component.
function normComponent(c) {
  const [pkg, cls] = c.split('/');
  return `${pkg}/${cls.startsWith('.') ? pkg + cls : cls}`;
}

async function setAccessibility(component, enable) {
  check(COMPONENT, component, 'component');
  component = normComponent(component);
  const cur = (await getSetting('secure', 'enabled_accessibility_services')) || '';
  const list = cur.split(':').filter(Boolean).filter(c => normComponent(c) !== component);
  if (enable) list.push(component);
  const changes = [{ ns: 'secure', key: 'enabled_accessibility_services', value: list.length ? list.join(':') : null }];
  if (enable) changes.push({ ns: 'secure', key: 'accessibility_enabled', value: '1' });
  return putSettings(changes, `${enable ? 'enable' : 'disable'} ${component}`);
}

async function setHome(component) {
  check(COMPONENT, component, 'component');
  const before = (await sh('cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME'))
    .split('\n').map(l => l.trim()).filter(l => COMPONENT.test(l)).pop() || null;
  const out = await sh(`cmd package set-home-activity ${component}`);
  if (!/Success/.test(out)) throw httpError(500, out);
  record({ kind: 'home', before, after: component });
  return { ok: true };
}

// ---------------------------------------------------------------- undo

async function undo(e) {
  switch (e.kind) {
    case 'package':
      await sh(`pm ${e.before === 'enabled' ? 'enable' : 'disable-user'} --user 0 ${e.pkg}`); break;
    case 'suspend':
      await sh(`pm ${e.before ? 'suspend' : 'unsuspend'} --user 0 ${e.pkg}`); break;
    case 'appop':
      await sh(`appops set ${e.pkg} ${e.op} ${e.before}`); break;
    case 'permission':
      await sh(`pm ${e.before ? 'grant' : 'revoke'} ${e.pkg} ${e.perm} 2>&1`); break;
    case 'settings':
      for (const c of [...e.changes].reverse()) {
        if (c.before === null) await sh(`settings delete ${c.ns} ${c.key}`);
        else await sh(`settings put ${c.ns} ${c.key} ${q(c.before)}`);
      }
      break;
    case 'home':
      if (e.before) await sh(`cmd package set-home-activity ${e.before}`); break;
    case 'install':
      await sh(`pm uninstall ${e.pkg}`); break;
    default:
      throw httpError(400, 'this change cannot be undone');
  }
}

async function undoIds(ids) {
  const j = journal();
  const targets = j.filter(e => !e.undone && e.undoable !== false && (ids === 'all' || ids.includes(e.id))).reverse();
  const errors = [];
  for (const e of targets) {
    try { await undo(e); e.undone = true; e.undoneAt = new Date().toISOString(); }
    catch (err) { errors.push(`${e.kind} ${e.pkg || e.label || ''}: ${err.message}`); }
  }
  writeJson(journalFile(), j);
  statesCache.at = 0;
  return { ok: errors.length === 0, undone: targets.length - errors.length, errors };
}

// ---------------------------------------------------------------- screen & remote

const KEYS = {
  up: 'DPAD_UP', down: 'DPAD_DOWN', left: 'DPAD_LEFT', right: 'DPAD_RIGHT', ok: 'DPAD_CENTER', back: 'BACK',
  menu: 'MENU', volup: 'VOLUME_UP', voldown: 'VOLUME_DOWN', mute: 'VOLUME_MUTE', play: 'MEDIA_PLAY_PAUSE',
  rewind: 'MEDIA_REWIND', forward: 'MEDIA_FAST_FORWARD', power: 'POWER', settings: 'SETTINGS', input: 'TV_INPUT',
  del: 'DEL', enter: 'ENTER', search: 'SEARCH', guide: 'GUIDE',
};

let shot = { busy: null, last: null };
async function screenshot() {
  if (!shot.busy) {
    shot.busy = adb(['exec-out', 'screencap', '-p'], { binary: true, timeout: 15000 })
      .then(r => { if (r.stdout.length > 100) shot.last = r.stdout; })
      .finally(() => { shot.busy = null; });
  }
  await shot.busy;
  return shot.last;
}

async function key(name) {
  if (name === 'home') {
    // An injected HOME bypasses accessibility services: open Zen Home directly when it is installed.
    if (await hasPackage(ZEN_HOME)) return sh(`am start -n ${ZEN_HOME}/.HomeActivity`);
    return sh('input keyevent KEYCODE_HOME');
  }
  const k = KEYS[name];
  if (!k) throw httpError(400, 'unknown key');
  return sh(`input keyevent KEYCODE_${k}`);
}

async function typeText(text) {
  const t = String(text).slice(0, 500).replace(/[\\'"`$&|;<>()]/g, ' ').replace(/ /g, '%s');
  return sh(`input text ${q(t)}`);
}

// ---------------------------------------------------------------- APK install

async function installApk(req) {
  const tmp = path.join(os.tmpdir(), `zen-${crypto.randomUUID()}.apk`);
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(tmp);
    req.pipe(ws);
    ws.on('finish', resolve);
    ws.on('error', reject);
    req.on('error', reject);
  });
  try {
    const before = new Set(await pmList('-3'));
    const r = await adb(['install', '-r', tmp], { timeout: 300000 });
    const out = `${r.stdout}${r.stderr}`;
    if (!/Success/.test(out)) throw httpError(500, out.trim().split('\n').pop());
    const added = (await pmList('-3')).filter(p => !before.has(p));
    const name = req.headers['x-filename'] ? decodeURIComponent(req.headers['x-filename']) : 'APK';
    if (added.length) record({ kind: 'install', pkg: added[0], label: name });
    else record({ kind: 'install-update', label: name, undoable: false });
    return { ok: true, package: added[0] || null };
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

// ---------------------------------------------------------------- HTTP

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

async function body(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const s = Buffer.concat(chunks).toString('utf8');
  return s ? JSON.parse(s) : {};
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

function send(res, status, data, type = 'application/json') {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(type === 'application/json' ? JSON.stringify(data) : String(data));
  res.writeHead(status, { 'Content-Type': type, 'Content-Length': buf.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(buf);
}

function needDevice() { if (!serial) throw httpError(409, 'no TV connected'); }

const routes = {
  'GET /api/status': () => state(),
  'POST /api/adb/download': async () => ({ ok: await downloadAdb() }),
  'GET /api/scan': () => scan(),
  'POST /api/connect': async (req) => connect(String((await body(req)).target || '')),
  'POST /api/pair': async (req) => {
    const b = await body(req);
    check(/^[A-Za-z0-9.\-]+:\d+$/, b.target, 'address'); check(/^\d{6}$/, b.code, 'code');
    const r = await adbRaw(['pair', b.target, b.code]);
    return { ok: /Successfully paired/i.test(r.stdout), message: (r.stdout + r.stderr).trim() };
  },
  'POST /api/helper/install': async () => { needDevice(); await installHelper(); return { ok: true }; },
  'GET /api/apps': () => { needDevice(); return apps(); },
  'GET /api/journal': () => { needDevice(); return journal().slice().reverse(); },
  'POST /api/journal/undo': async (req) => { needDevice(); const b = await body(req); return undoIds(b.all ? 'all' : [b.id]); },
  'GET /api/settings': () => { needDevice(); return settingsOverview(); },
  'POST /api/settings': async (req) => { needDevice(); const b = await body(req); return putSettings(b.changes || [], b.label); },
  'POST /api/home': async (req) => { needDevice(); return setHome((await body(req)).component); },
  'POST /api/accessibility': async (req) => { needDevice(); const b = await body(req); return setAccessibility(b.component, !!b.enabled); },
  'POST /api/key': async (req) => { needDevice(); const b = await body(req); if (b.text != null) await typeText(b.text); else await key(b.key); return { ok: true }; },
  'GET /api/screen': async () => { needDevice(); const png = await screenshot(); if (!png) throw httpError(503, 'no screenshot'); return { __raw: png, type: 'image/png' }; },
  'POST /api/install': async (req) => { needDevice(); return installApk(req); },
  'POST /api/reboot': async () => { needDevice(); await adb(['reboot']); return { ok: true }; },
  'POST /api/quit': async () => { setTimeout(() => process.exit(0), 300); return { ok: true }; },
  'GET /api/device': async () => {
    needDevice();
    const [mem, df, up, ip] = await Promise.all([sh('cat /proc/meminfo'), sh('df -h /data | tail -1'), sh('cat /proc/uptime'), sh('ip -4 addr show wlan0 2>/dev/null; ip -4 addr show eth0 2>/dev/null')]);
    const kb = k => Number((mem.match(new RegExp(`${k}:\\s+(\\d+)`)) || [])[1] || 0);
    return { ...(await deviceInfo()), memTotal: kb('MemTotal'), memAvailable: kb('MemAvailable'), storage: df.split(/\s+/), uptime: Number(up.split(' ')[0]), ip: (ip.match(/inet (\d+\.\d+\.\d+\.\d+)/) || [])[1] || serial };
  },
  'GET /api/settings/raw': async (req) => {
    needDevice();
    const ns = new URL(req.url, 'http://x').searchParams.get('ns');
    check(/^(global|secure|system)$/, ns, 'namespace');
    return settingsList(ns);
  },
};

function hostAllowed(req) {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  return LAN || ['localhost', '127.0.0.1', '[::1]'].includes(host);
}

function authorized(req) {
  if (!LAN) return true;
  const cookie = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith('zen='));
  return cookie && crypto.timingSafeEqual(Buffer.from(cookie.slice(4).padEnd(24).slice(0, 24)), Buffer.from(TOKEN));
}

const server = http.createServer(async (req, res) => {
  try {
    // Blocks DNS-rebinding: a web page can only reach this server through "localhost".
    if (!hostAllowed(req)) return send(res, 403, { error: 'forbidden host' });
    const url = new URL(req.url, 'http://localhost');
    if (LAN && url.searchParams.get('t') === TOKEN) {
      res.writeHead(302, { 'Set-Cookie': `zen=${TOKEN}; HttpOnly; SameSite=Strict; Path=/`, Location: '/' });
      return res.end();
    }
    if (!authorized(req)) return send(res, 401, 'Open the link printed in the terminal (with ?t=…).', 'text/plain');

    if (url.pathname.startsWith('/api/')) {
      // A custom header can't be sent cross-site without CORS, which this server never allows: no CSRF.
      if (req.headers['x-zen'] !== '1') return send(res, 403, { error: 'missing header' });
      const iconMatch = url.pathname.match(/^\/api\/icon\/([A-Za-z0-9_.]+)$/);
      if (req.method === 'GET' && iconMatch) {
        needDevice();
        const png = await icon(iconMatch[1]);
        return png ? send(res, 200, png, 'image/png') : send(res, 404, { error: 'no icon' });
      }
      const appMatch = url.pathname.match(/^\/api\/app\/([A-Za-z0-9_.]+)(?:\/(action|appop|permission))?$/);
      if (appMatch) {
        needDevice();
        const [, pkg, sub] = appMatch;
        if (req.method === 'GET' && !sub) return send(res, 200, await appDetails(pkg));
        const b = await body(req);
        if (sub === 'action') return send(res, 200, await appAction(pkg, b.action));
        if (sub === 'appop') return send(res, 200, await setAppop(pkg, b.op, b.mode));
        if (sub === 'permission') return send(res, 200, await setPermission(pkg, b.permission, !!b.grant));
      }
      const handler = routes[`${req.method} ${url.pathname}`];
      if (!handler) return send(res, 404, { error: 'not found' });
      if (!ADB && !['GET /api/status', 'POST /api/adb/download'].includes(`${req.method} ${url.pathname}`)) throw httpError(409, 'adb missing');
      const out = await handler(req);
      if (out && out.__raw) return send(res, 200, out.__raw, out.type);
      return send(res, 200, out ?? { ok: true });
    }

    // Static files.
    let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    if (!p || p === '.') p = 'index.html';
    const f = path.join(WEB, p);
    if (!f.startsWith(WEB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
    return send(res, 200, fs.readFileSync(f), MIME[path.extname(f)] || 'application/octet-stream');
  } catch (err) {
    send(res, err.status || 500, { error: err.message });
  }
});

// ---------------------------------------------------------------- start

ADB = findAdb();
const last = readJson(path.join(DATA, 'last.json'), null);
if (ADB && last?.serial) connect(last.serial).catch(() => {});

function openBrowser(url) {
  if (process.env.ZEN_NO_BROWSER || args.includes('--no-browser')) return;
  const cmd = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref(); } catch {}
}

// Launched again while already running (e.g. the app icon clicked twice): just show the page.
server.on('error', err => {
  if (err.code === 'EADDRINUSE') { openBrowser(`http://localhost:${PORT}/`); setTimeout(() => process.exit(0), 500); }
  else { console.error(err); process.exit(1); }
});

server.listen(PORT, LAN ? '0.0.0.0' : '127.0.0.1', () => {
  const local = `http://localhost:${PORT}/`;
  console.log(`\n  Zen Control is running → ${local}`);
  if (LAN) {
    const ips = localPrefixes().length ? Object.values(os.networkInterfaces()).flat().filter(a => a?.family === 'IPv4' && !a.internal).map(a => a.address) : [];
    for (const ip of ips) console.log(`  From your phone (same Wi-Fi) → http://${ip}:${PORT}/?t=${TOKEN}`);
    console.log(`  On this computer → ${local}?t=${TOKEN}`);
  }
  console.log('  Leave this window open while you use it. Ctrl+C to stop.\n');
  openBrowser(LAN ? `${local}?t=${TOKEN}` : local);
});
