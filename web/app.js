// Zen Control — web interface. Talks to server.js, which drives the TV with adb.

const I18N = {
  fr: {
    'nav.apps': 'Applis', 'nav.remote': 'Télécommande', 'nav.privacy': 'Pubs & traceurs', 'nav.settings': 'Réglages',
    'nav.install': 'Installer un APK', 'nav.journal': 'Journal',
    'tv.switch': 'Changer de télé', 'tv.unknown': 'Appareil Android, pas encore connecté', 'tv.none': 'Pas de télé', 'tv.pending': 'En attente d\'autorisation',
    'connect.title': 'Connecte ta télé', 'connect.intro': 'La télé et cet ordinateur doivent être sur le même réseau, avec le débogage activé sur la télé.',
    'connect.found': 'Télés trouvées sur le réseau', 'connect.rescan': 'Rechercher', 'connect.ip': 'Adresse IP de la télé',
    'connect.button': 'Se connecter', 'connect.scanning': 'Recherche en cours…', 'connect.none': 'Aucune télé trouvée automatiquement. Tape son adresse IP ci-dessous.',
    'connect.pending': 'Regarde la télé : accepte « Autoriser le débogage USB ? » (coche « Toujours autoriser »).',
    'connect.pairTitle': 'Android 11+ : « Débogage sans fil » avec code d\'appairage',
    'connect.pairHelp': 'Sur la télé : Options pour les développeurs → Débogage sans fil → Associer avec un code. Tape l\'adresse et le code affichés.',
    'connect.pair': 'Associer', 'connect.helpTitle': 'Comment activer le débogage sur la télé ?',
    'connect.help': '<li>Paramètres → Système → À propos.</li><li>Clique 7 fois sur « Build de l\'OS Android TV ».</li><li>Paramètres → Système → Options pour les développeurs : active « Débogage USB » (et « Débogage réseau » s\'il existe).</li>',
    'adb.missing': 'adb n\'est pas installé', 'adb.explain': 'adb est l\'outil officiel de Google pour se connecter à une télé Android. Il sera téléchargé depuis dl.google.com (~10 Mo).',
    'adb.download': 'Télécharger adb',
    'apps.search': 'Rechercher…', 'f.all': 'Toutes', 'f.launch': 'Lançables', 'f.user': 'Installées par moi', 'f.system': 'Système',
    'f.off': 'Désactivées', 'f.susp': 'Suspendues', 'f.ads': 'Pubs & traceurs', 'f.feature': 'Fonctions optionnelles',
    'helper.explain': 'Installe le petit assistant sur la télé pour voir le vrai nom et l\'icône de chaque appli.', 'helper.install': 'Installer l\'assistant',
    'b.system': 'Système', 'b.off': 'Désactivée', 'b.susp': 'Suspendue', 'b.ads': 'Pub', 'b.telemetry': 'Traceur', 'b.junk': 'Inutile', 'b.feature': 'Fonction', 'b.prot': 'Protégée',
    'act.disable': 'Désactiver', 'act.enable': 'Activer', 'act.suspend': 'Suspendre', 'act.unsuspend': 'Réactiver', 'act.forcestop': 'Forcer l\'arrêt',
    'act.launch': 'Ouvrir', 'act.uninstall': 'Désinstaller', 'act.apply': 'Appliquer', 'act.clearSel': 'Annuler la sélection', 'act.undo': 'Annuler',
    'sel.count': '{n} sélectionnée(s)',
    'd.version': 'Version', 'd.running': 'En cours d\'exécution', 'd.stopped': 'Arrêtée', 'd.bg': 'Arrière-plan', 'd.bgRun': 'Autoriser à tourner en arrière-plan',
    'd.autostart': 'Autoriser le démarrage automatique (TCL)', 'd.perms': 'Autorisations', 'd.permsInstall': 'Autorisations fixes ({n})', 'd.noPerms': 'Aucune autorisation modifiable.',
    'd.protected': 'Composant système essentiel : il ne peut pas être désactivé.', 'd.uninstallConfirm': 'Désinstaller {name} ? Ça ne peut pas être annulé depuis le journal.',
    'remote.live': 'Écran en direct', 'remote.drm': 'Les vidéos protégées (Netflix…) apparaissent en noir.', 'remote.type': 'Taper du texte sur la télé…', 'remote.send': 'Envoyer',
    'remote.keys': 'Clavier : flèches, Entrée = OK, Retour arrière = retour, H = accueil, +/- = volume.',
    'remote.input': 'Source', 'remote.back': 'Retour', 'remote.home': 'Accueil', 'remote.menu': 'Menu',
    'dns.title': 'Bloquer les pubs et traceurs pour toute la télé', 'dns.explain': 'Un DNS filtrant bloque les domaines de pub et de pistage pour toutes les applis de la télé (Android « DNS privé »). Annulable à tout moment.',
    'dns.off': 'Désactivé', 'dns.offd': 'Le DNS de ta box (par défaut).', 'dns.adguard': 'AdGuard', 'dns.adguardd': 'Bloque pubs et traceurs. Gratuit.',
    'dns.family': 'AdGuard Famille', 'dns.familyd': 'Pubs, traceurs et contenus adultes.', 'dns.mullvad': 'Mullvad', 'dns.mullvadd': 'Bloque pubs et traceurs, sans journalisation.',
    'dns.cloudflare': 'Cloudflare', 'dns.cloudflared': 'Rapide et privé, sans blocage.', 'dns.custom': 'Personnalisé', 'dns.customd': 'Ton propre serveur DNS-over-TLS (NextDNS, etc.).',
    'dns.current': 'Actuellement : {v}', 'dns.warn': 'Si internet ne marche plus sur la télé, reviens ici et choisis « Désactivé » (ou annule dans le Journal).',
    'trackers.title': 'Applis de pub et de pistage', 'trackers.all': 'Tout désactiver', 'trackers.explain': 'Applis connues pour afficher de la pub ou envoyer des données, encore actives sur la télé.',
    'trackers.none': 'Aucune appli de pub ou de pistage connue n\'est active. 🎉',
    'bg.title': 'Empêcher les applis de tourner en arrière-plan', 'bg.explain': 'Rend la télé plus rapide : l\'appli ne fonctionne que quand tu l\'ouvres. À éviter pour les applis de musique si tu écoutes écran éteint.',
    'adid.title': 'Identifiant publicitaire Google', 'adid.explain': 'Il ne peut pas être modifié à distance. Sur la télé : Paramètres → Confidentialité → Annonces → « Supprimer l\'identifiant publicitaire ».',
    'set.speed': 'Rapidité', 'set.anim': 'Animations', 'anim.0': 'Désactivées (le plus rapide)', 'anim.05': 'Rapides', 'anim.1': 'Normales',
    'set.sleep': 'Veille', 'set.screenOff': 'Éteindre l\'écran après', 'set.sleepTimeout': 'Mettre en veille après', 'set.screensaver': 'Économiseur d\'écran',
    'never': 'Jamais', 'min': '{n} min', 'hour': '{n} h',
    'set.home': 'Écran d\'accueil', 'set.homeHelp': 'Google TV reprend souvent la main sur le bouton Accueil : Zen Home utilise un service d\'accessibilité pour ça.',
    'set.a11y': 'Services d\'accessibilité', 'set.a11yHelp': 'Applis autorisées à lire les touches de la télécommande (Zen Home, Button Mapper…).',
    'set.device': 'Télé', 'set.reboot': 'Redémarrer la télé', 'set.rebootConfirm': 'Redémarrer la télé maintenant ?',
    'set.advanced': 'Avancé : tous les réglages', 'set.advancedHelp': 'Les réglages bruts d\'Android. Chaque modification est notée dans le Journal et peut être annulée.',
    'set.editPrompt': 'Nouvelle valeur pour {k} (vide = supprimer) :',
    'i.model': 'Modèle', 'i.android': 'Android', 'i.ip': 'Adresse', 'i.ram': 'Mémoire libre', 'i.storage': 'Stockage', 'i.uptime': 'Allumée depuis',
    'install.drop': 'Glisse un fichier .apk ici', 'install.or': 'ou clique pour le choisir', 'install.progress': 'Installation de {f}…', 'install.ok': '{f} installé ✔',
    'journal.explain': 'Chaque changement fait depuis Zen Control. « Annuler » remet l\'état d\'avant.', 'journal.undoAll': 'Tout annuler',
    'journal.undoAllConfirm': 'Annuler tous les changements faits avec Zen Control ?', 'journal.empty': 'Aucun changement pour l\'instant.', 'journal.notUndoable': 'Non annulable', 'journal.undone': 'Annulé',
    'j.package': '{a} {p}', 'j.suspend': '{a} {p}', 'j.appop': '{p} : {op} → {m}', 'j.permission': '{p} : {perm} {a}', 'j.settings': 'Réglage : {l}',
    'j.home': 'Écran d\'accueil → {c}', 'j.install': 'Installé {p}', 'j.install-update': 'Mis à jour : {l}', 'j.uninstall': 'Désinstallé {p}',
    'granted': 'accordée', 'revoked': 'retirée',
    'ok': 'Fait ✔', 'error': 'Erreur : {e}',
  },
  en: {
    'nav.apps': 'Apps', 'nav.remote': 'Remote', 'nav.privacy': 'Ads & trackers', 'nav.settings': 'Settings', 'nav.install': 'Install an APK', 'nav.journal': 'Journal',
    'tv.switch': 'Switch TV', 'tv.unknown': 'Android device, not connected yet', 'tv.none': 'No TV', 'tv.pending': 'Waiting for approval',
    'connect.title': 'Connect your TV', 'connect.intro': 'The TV and this computer must be on the same network, with debugging turned on on the TV.',
    'connect.found': 'TVs found on your network', 'connect.rescan': 'Search', 'connect.ip': 'TV IP address', 'connect.button': 'Connect',
    'connect.scanning': 'Searching…', 'connect.none': 'No TV found automatically. Type its IP address below.',
    'connect.pending': 'Look at the TV: accept "Allow USB debugging?" (tick "Always allow").',
    'connect.pairTitle': 'Android 11+: "Wireless debugging" with a pairing code',
    'connect.pairHelp': 'On the TV: Developer options → Wireless debugging → Pair with a code. Type the address and code shown.',
    'connect.pair': 'Pair', 'connect.helpTitle': 'How do I turn on debugging on the TV?',
    'connect.help': '<li>Settings → System → About.</li><li>Click "Android TV OS build" 7 times.</li><li>Settings → System → Developer options: turn on "USB debugging" (and "Network debugging" if present).</li>',
    'adb.missing': 'adb is not installed', 'adb.explain': 'adb is Google\'s official tool to connect to an Android TV. It will be downloaded from dl.google.com (~10 MB).',
    'adb.download': 'Download adb',
    'apps.search': 'Search…', 'f.all': 'All', 'f.launch': 'Launchable', 'f.user': 'Installed by me', 'f.system': 'System',
    'f.off': 'Disabled', 'f.susp': 'Suspended', 'f.ads': 'Ads & trackers', 'f.feature': 'Optional features',
    'helper.explain': 'Install the small helper on the TV to see the real name and icon of every app.', 'helper.install': 'Install helper',
    'b.system': 'System', 'b.off': 'Disabled', 'b.susp': 'Suspended', 'b.ads': 'Ads', 'b.telemetry': 'Tracker', 'b.junk': 'Junk', 'b.feature': 'Feature', 'b.prot': 'Protected',
    'act.disable': 'Disable', 'act.enable': 'Enable', 'act.suspend': 'Suspend', 'act.unsuspend': 'Unsuspend', 'act.forcestop': 'Force stop',
    'act.launch': 'Open', 'act.uninstall': 'Uninstall', 'act.apply': 'Apply', 'act.clearSel': 'Clear selection', 'act.undo': 'Undo',
    'sel.count': '{n} selected',
    'd.version': 'Version', 'd.running': 'Running', 'd.stopped': 'Stopped', 'd.bg': 'Background', 'd.bgRun': 'Allow running in the background',
    'd.autostart': 'Allow auto-start (TCL)', 'd.perms': 'Permissions', 'd.permsInstall': 'Fixed permissions ({n})', 'd.noPerms': 'No changeable permission.',
    'd.protected': 'Essential system component: it can\'t be disabled.', 'd.uninstallConfirm': 'Uninstall {name}? This can\'t be undone from the journal.',
    'remote.live': 'Live screen', 'remote.drm': 'Protected videos (Netflix…) show as black.', 'remote.type': 'Type text on the TV…', 'remote.send': 'Send',
    'remote.keys': 'Keyboard: arrows, Enter = OK, Backspace = back, H = home, +/- = volume.',
    'remote.input': 'Input', 'remote.back': 'Back', 'remote.home': 'Home', 'remote.menu': 'Menu',
    'dns.title': 'Block ads and trackers for the whole TV', 'dns.explain': 'A filtering DNS blocks ad and tracking domains for every app on the TV (Android "Private DNS"). Can be undone anytime.',
    'dns.off': 'Off', 'dns.offd': 'Your router\'s DNS (default).', 'dns.adguard': 'AdGuard', 'dns.adguardd': 'Blocks ads and trackers. Free.',
    'dns.family': 'AdGuard Family', 'dns.familyd': 'Ads, trackers and adult content.', 'dns.mullvad': 'Mullvad', 'dns.mullvadd': 'Blocks ads and trackers, no logging.',
    'dns.cloudflare': 'Cloudflare', 'dns.cloudflared': 'Fast and private, no blocking.', 'dns.custom': 'Custom', 'dns.customd': 'Your own DNS-over-TLS server (NextDNS, etc.).',
    'dns.current': 'Currently: {v}', 'dns.warn': 'If the internet stops working on the TV, come back here and pick "Off" (or undo it in the Journal).',
    'trackers.title': 'Ad and tracking apps', 'trackers.all': 'Disable all', 'trackers.explain': 'Apps known to show ads or send data, still active on the TV.',
    'trackers.none': 'No known ad or tracking app is active. 🎉',
    'bg.title': 'Stop apps from running in the background', 'bg.explain': 'Makes the TV faster: the app only runs when you open it. Avoid it for music apps if you listen with the screen off.',
    'adid.title': 'Google advertising ID', 'adid.explain': 'It can\'t be changed remotely. On the TV: Settings → Privacy → Ads → "Delete advertising ID".',
    'set.speed': 'Speed', 'set.anim': 'Animations', 'anim.0': 'Off (fastest)', 'anim.05': 'Fast', 'anim.1': 'Normal',
    'set.sleep': 'Sleep', 'set.screenOff': 'Turn the screen off after', 'set.sleepTimeout': 'Go to sleep after', 'set.screensaver': 'Screensaver',
    'never': 'Never', 'min': '{n} min', 'hour': '{n} h',
    'set.home': 'Home screen', 'set.homeHelp': 'Google TV often takes the Home button back: Zen Home uses an accessibility service for that.',
    'set.a11y': 'Accessibility services', 'set.a11yHelp': 'Apps allowed to read remote-control keys (Zen Home, Button Mapper…).',
    'set.device': 'TV', 'set.reboot': 'Restart the TV', 'set.rebootConfirm': 'Restart the TV now?',
    'set.advanced': 'Advanced: all settings', 'set.advancedHelp': 'Android\'s raw settings. Every change is written to the Journal and can be undone.',
    'set.editPrompt': 'New value for {k} (empty = delete):',
    'i.model': 'Model', 'i.android': 'Android', 'i.ip': 'Address', 'i.ram': 'Free memory', 'i.storage': 'Storage', 'i.uptime': 'On for',
    'install.drop': 'Drop an .apk file here', 'install.or': 'or click to choose it', 'install.progress': 'Installing {f}…', 'install.ok': '{f} installed ✔',
    'journal.explain': 'Every change made from Zen Control. "Undo" puts back what was there before.', 'journal.undoAll': 'Undo everything',
    'journal.undoAllConfirm': 'Undo every change made with Zen Control?', 'journal.empty': 'No changes yet.', 'journal.notUndoable': 'Can\'t be undone', 'journal.undone': 'Undone',
    'j.package': '{a} {p}', 'j.suspend': '{a} {p}', 'j.appop': '{p}: {op} → {m}', 'j.permission': '{p}: {perm} {a}', 'j.settings': 'Setting: {l}',
    'j.home': 'Home screen → {c}', 'j.install': 'Installed {p}', 'j.install-update': 'Updated: {l}', 'j.uninstall': 'Uninstalled {p}',
    'granted': 'granted', 'revoked': 'revoked',
    'ok': 'Done ✔', 'error': 'Error: {e}',
  },
};
const LANG = navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
const t = (k, vars = {}) => (I18N[LANG][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
document.documentElement.lang = LANG;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function applyI18n() {
  $$('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
  $$('[data-t-html]').forEach(e => { e.innerHTML = t(e.dataset.tHtml); });
  $$('[data-tp]').forEach(e => { e.placeholder = t(e.dataset.tp); });
  $$('[data-tt]').forEach(e => { e.title = t(e.dataset.tt); });
}

async function api(path, { method = 'GET', body, raw } = {}) {
  const res = await fetch(path, {
    method, headers: { 'x-zen': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

let toastTimer;
function toast(msg, err = false) {
  const el = $('#toast');
  el.textContent = msg; el.className = `toast${err ? ' err' : ''}`; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, err ? 6000 : 2500);
}
async function act(fn, okMsg = t('ok')) {
  try { const r = await fn(); if (okMsg) toast(okMsg); refreshJournalCount(); return r; }
  catch (e) { toast(t('error', { e: e.message }), true); throw e; }
}

// ---------------------------------------------------------------- state & navigation

const S = { status: null, apps: [], filter: 'all', query: '', selected: new Set(), view: 'apps' };

function show(view) {
  S.view = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  $$('.nav nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'apps') loadApps();
  if (view === 'privacy') loadPrivacy();
  if (view === 'settings') loadSettings();
  if (view === 'journal') loadJournal();
  if (view === 'remote') startScreen(); else stopScreen();
  if (view !== 'connect') location.hash = view;
}
$$('.nav nav button').forEach(b => b.addEventListener('click', () => S.status?.connected ? show(b.dataset.view) : show('connect')));

async function refreshStatus() {
  S.status = await api('/api/status');
  const s = S.status;
  $('#dot').classList.toggle('on', !!s.connected);
  $('#deviceName').textContent = s.connected ? `${s.device.manufacturer} ${s.device.model}` : (s.pending ? t('tv.pending') : t('tv.none'));
  $('#deviceSub').textContent = s.connected ? `Android ${s.device.android} · ${s.serial}` : '';
  $('#adbMissing').hidden = s.adb !== false;
  $('#connectCard').hidden = s.adb === false;
  return s;
}

$('#switchTv').addEventListener('click', () => { show('connect'); scanTvs(); });

// ---------------------------------------------------------------- connect

async function scanTvs() {
  const list = $('#tvList');
  list.innerHTML = `<div class="muted"><span class="spinner"></span> ${t('connect.scanning')}</div>`;
  try {
    const tvs = await api('/api/scan');
    if (!tvs.length) { list.innerHTML = `<div class="muted">${t('connect.none')}</div>`; return; }
    list.innerHTML = tvs.map(tv => `<div class="tv"><div><strong>${esc(tv.name || 'Android TV ?')}</strong>
      <div class="state ${tv.state === 'pending' ? 'pending' : ''}">${esc(tv.ip)} · ${tv.state === 'ok' ? '✔' : (tv.state === 'pending' ? t('tv.pending') : t('tv.unknown'))}</div></div>
      <button class="primary small" data-ip="${esc(tv.ip)}">${t('connect.button')}</button></div>`).join('');
    list.querySelectorAll('button').forEach(b => b.addEventListener('click', () => connect(b.dataset.ip)));
  } catch (e) { list.innerHTML = `<div class="muted">${esc(e.message)}</div>`; }
}

async function connect(target) {
  toast(`${t('connect.button')}…`);
  let s = await api('/api/connect', { method: 'POST', body: { target } });
  for (let i = 0; i < 30 && !s.connected && s.pending; i++) {
    toast(t('connect.pending'));
    await new Promise(r => setTimeout(r, 2000));
    s = await api('/api/connect', { method: 'POST', body: { target } });
  }
  await refreshStatus();
  if (s.connected) { toast(t('ok')); show('apps'); } else toast(t('error', { e: target }), true);
}

$('#rescan').addEventListener('click', scanTvs);
$('#manualConnect').addEventListener('click', () => $('#manualIp').value.trim() && connect($('#manualIp').value.trim()));
$('#pairBtn').addEventListener('click', () => act(async () => {
  const r = await api('/api/pair', { method: 'POST', body: { target: $('#pairAddr').value.trim(), code: $('#pairCode').value.trim() } });
  if (!r.ok) throw new Error(r.message);
}));
$('#downloadAdb').addEventListener('click', async e => {
  e.target.disabled = true; e.target.innerHTML = `<span class="spinner"></span>`;
  await act(() => api('/api/adb/download', { method: 'POST' }));
  await refreshStatus(); scanTvs();
});

// ---------------------------------------------------------------- apps

const FILTERS = [
  ['all', () => true], ['launch', a => a.launchable], ['user', a => !a.system], ['system', a => a.system],
  ['off', a => !a.enabled], ['susp', a => a.suspended], ['ads', a => ['ads', 'telemetry', 'junk'].includes(a.tag)], ['feature', a => a.tag === 'feature'],
];

async function loadApps() {
  if (!S.apps.length) $('#appList').innerHTML = `<div class="empty"><span class="spinner"></span></div>`;
  try { S.apps = await api('/api/apps'); } catch (e) { toast(t('error', { e: e.message }), true); return; }
  $('#helperBanner').hidden = !!S.status?.helper;
  renderApps();
}

function badges(a) {
  const b = [];
  if (a.protected) b.push(`<span class="badge prot">${t('b.prot')}</span>`);
  if (a.tag) b.push(`<span class="badge ${a.tag}">${t(`b.${a.tag}`)}</span>`);
  if (!a.enabled) b.push(`<span class="badge">${t('b.off')}</span>`);
  if (a.suspended) b.push(`<span class="badge susp">${t('b.susp')}</span>`);
  if (a.system) b.push(`<span class="badge">${t('b.system')}</span>`);
  return b.join('');
}

const iconUrl = pkg => `/api/icon/${pkg}`;
const iconObserver = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target; iconObserver.unobserve(el);
    fetch(iconUrl(el.dataset.pkg), { headers: { 'x-zen': '1' } }).then(r => r.ok ? r.blob() : null)
      .then(b => { if (b) el.style.backgroundImage = `url(${URL.createObjectURL(b)})`; });
  }
}, { rootMargin: '200px' });

function renderApps() {
  const q = S.query.toLowerCase();
  const counts = Object.fromEntries(FILTERS.map(([k, f]) => [k, S.apps.filter(f).length]));
  $('#filters').innerHTML = FILTERS.map(([k]) => `<button class="chip ${S.filter === k ? 'active' : ''}" data-f="${k}">${t(`f.${k}`)}<b>${counts[k]}</b></button>`).join('');
  $$('#filters .chip').forEach(c => c.addEventListener('click', () => { S.filter = c.dataset.f; renderApps(); }));
  const f = FILTERS.find(([k]) => k === S.filter)[1];
  const list = S.apps.filter(f).filter(a => !q || (a.label || '').toLowerCase().includes(q) || a.package.toLowerCase().includes(q));
  $('#appList').innerHTML = list.length ? list.map(a => `
    <div class="app ${a.enabled ? '' : 'off'}" data-pkg="${esc(a.package)}">
      <input type="checkbox" ${S.selected.has(a.package) ? 'checked' : ''} ${a.protected ? 'disabled' : ''}>
      <div class="ico" data-pkg="${esc(a.package)}"></div>
      <div style="min-width:0"><div class="name">${esc(a.label || a.package)}</div><div class="pkg">${esc(a.package)}</div><div class="badges">${badges(a)}</div></div>
      <label class="switch" title="${a.enabled ? t('act.disable') : t('act.enable')}"><input type="checkbox" ${a.enabled ? 'checked' : ''} ${a.protected ? 'disabled' : ''}><span></span></label>
    </div>`).join('') : `<div class="empty">—</div>`;
  $$('#appList .ico').forEach(el => S.status?.helper && iconObserver.observe(el));
  $$('#appList .app').forEach(row => {
    const pkg = row.dataset.pkg;
    const [sel, , , sw] = row.children;
    sel.addEventListener('click', e => { e.stopPropagation(); sel.checked ? S.selected.add(pkg) : S.selected.delete(pkg); renderBulk(); });
    sw.addEventListener('click', e => e.stopPropagation());
    sw.querySelector('input').addEventListener('change', async e => {
      try { await act(() => api(`/api/app/${pkg}/action`, { method: 'POST', body: { action: e.target.checked ? 'enable' : 'disable' } })); }
      catch { e.target.checked = !e.target.checked; }
      loadApps();
    });
    row.addEventListener('click', () => openApp(pkg));
  });
  renderBulk();
}

function renderBulk() {
  $('#bulkBar').hidden = S.selected.size === 0;
  $('#bulkCount').textContent = t('sel.count', { n: S.selected.size });
}
$$('[data-bulk]').forEach(b => b.addEventListener('click', async () => {
  for (const pkg of S.selected) {
    try { await api(`/api/app/${pkg}/action`, { method: 'POST', body: { action: b.dataset.bulk } }); }
    catch (e) { toast(`${pkg}: ${e.message}`, true); }
  }
  S.selected.clear(); toast(t('ok')); refreshJournalCount(); loadApps();
}));
$('#bulkClear').addEventListener('click', () => { S.selected.clear(); renderApps(); });
$('#search').addEventListener('input', e => { S.query = e.target.value; renderApps(); });
$('#installHelper').addEventListener('click', async e => {
  e.target.disabled = true; e.target.innerHTML = '<span class="spinner"></span>';
  await act(() => api('/api/helper/install', { method: 'POST' })).catch(() => {});
  await refreshStatus(); S.apps = []; loadApps();
});

// ---------------------------------------------------------------- app drawer

async function openApp(pkg) {
  const a = S.apps.find(x => x.package === pkg);
  $('#drawer').hidden = false;
  $('#drawerBody').innerHTML = `<div class="empty"><span class="spinner"></span></div>`;
  let d;
  try { d = await api(`/api/app/${pkg}`); } catch (e) { $('#drawerBody').textContent = e.message; return; }
  const runtime = d.permissions.filter(p => p.runtime);
  const fixed = d.permissions.filter(p => !p.runtime);
  const btn = (action, label, cls = '') => `<button class="${cls}" data-action="${action}">${label}</button>`;
  const opRow = (op, label) => d.ops[op] === null ? '' : `<div class="mini"><div class="t"><div>${label}</div><div>${op}</div></div>
    <label class="switch"><input type="checkbox" data-op="${op}" ${d.ops[op] === 'ignore' || d.ops[op] === 'deny' ? '' : 'checked'} ${a.protected ? 'disabled' : ''}><span></span></label></div>`;
  $('#drawerBody').innerHTML = `
    <div class="dhead"><div class="ico"></div>
      <div><h2>${esc(a.label || pkg)}</h2><div class="muted small">${esc(pkg)}</div><div class="badges">${badges(a)}</div></div></div>
    ${a.desc ? `<p class="muted">${esc(a.desc)}</p>` : ''}
    ${a.protected ? `<p class="muted">🔒 ${t('d.protected')}</p>` : ''}
    <dl class="info"><dt>${t('d.version')}</dt><dd>${esc(d.version || '—')}</dd><dt></dt><dd>${d.running ? '🟢 ' + t('d.running') : '⚪ ' + t('d.stopped')}</dd></dl>
    <div class="actions">
      ${a.launchable && a.enabled ? btn('launch', t('act.launch'), 'primary') : ''}
      ${a.protected ? '' : (a.enabled ? btn('disable', t('act.disable')) : btn('enable', t('act.enable'), 'primary'))}
      ${a.protected ? '' : (a.suspended ? btn('unsuspend', t('act.unsuspend')) : btn('suspend', t('act.suspend')))}
      ${btn('forcestop', t('act.forcestop'))}
      ${!a.system && !a.protected ? btn('uninstall', t('act.uninstall'), 'danger') : ''}
    </div>
    <div class="section"><h3>${t('d.bg')}</h3><div class="minilist">
      ${opRow('RUN_ANY_IN_BACKGROUND', t('d.bgRun'))}${opRow('APP_AUTO_START', t('d.autostart'))}</div></div>
    <div class="section"><h3>${t('d.perms')}</h3><div class="minilist">
      ${runtime.length ? runtime.map(p => `<div class="mini"><div class="t"><div>${esc(p.name.split('.').pop())}</div><div>${esc(p.name)}</div></div>
        <label class="switch"><input type="checkbox" data-perm="${esc(p.name)}" ${p.granted ? 'checked' : ''} ${p.fixed ? 'disabled' : ''}><span></span></label></div>`).join('') : `<div class="muted">${t('d.noPerms')}</div>`}
      </div>
      ${fixed.length ? `<details><summary>${t('d.permsInstall', { n: fixed.length })}</summary><div class="muted small">${fixed.map(p => esc(p.name)).join('<br>')}</div></details>` : ''}
    </div>`;
  if (S.status?.helper) {
    fetch(iconUrl(pkg), { headers: { 'x-zen': '1' } }).then(r => r.ok ? r.blob() : null)
      .then(b => { if (b) $('#drawerBody .ico').style.backgroundImage = `url(${URL.createObjectURL(b)})`; });
  }
  $$('#drawerBody [data-action]').forEach(b => b.addEventListener('click', async () => {
    const action = b.dataset.action;
    if (action === 'uninstall' && !confirm(t('d.uninstallConfirm', { name: a.label || pkg }))) return;
    await act(() => api(`/api/app/${pkg}/action`, { method: 'POST', body: { action } })).catch(() => {});
    await loadApps();
    if (action !== 'uninstall') openApp(pkg); else closeDrawer();
  }));
  $$('#drawerBody [data-op]').forEach(i => i.addEventListener('change', () =>
    act(() => api(`/api/app/${pkg}/appop`, { method: 'POST', body: { op: i.dataset.op, mode: i.checked ? 'allow' : 'ignore' } })).catch(() => { i.checked = !i.checked; })));
  $$('#drawerBody [data-perm]').forEach(i => i.addEventListener('change', () =>
    act(() => api(`/api/app/${pkg}/permission`, { method: 'POST', body: { permission: i.dataset.perm, grant: i.checked } })).catch(() => { i.checked = !i.checked; })));
}
function closeDrawer() { $('#drawer').hidden = true; }
$$('[data-close]').forEach(e => e.addEventListener('click', closeDrawer));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

// ---------------------------------------------------------------- remote

let screenTimer = null;
let screenUrl = null;
async function refreshScreen() {
  if (S.view !== 'remote' || !$('#liveToggle').checked || document.hidden) return;
  try {
    const r = await api('/api/screen', { raw: true });
    if (r.ok) {
      const url = URL.createObjectURL(await r.blob());
      $('#screenImg').src = url;
      if (screenUrl) URL.revokeObjectURL(screenUrl);
      screenUrl = url;
    }
  } catch {}
}
function startScreen() { stopScreen(); refreshScreen(); screenTimer = setInterval(refreshScreen, 1200); }
function stopScreen() { clearInterval(screenTimer); screenTimer = null; }
async function press(key) { try { await api('/api/key', { method: 'POST', body: { key } }); setTimeout(refreshScreen, 350); } catch (e) { toast(e.message, true); } }
$$('[data-key]').forEach(b => b.addEventListener('click', () => press(b.dataset.key)));
$('#sendText').addEventListener('click', async () => {
  const text = $('#typeText').value; if (!text) return;
  await act(() => api('/api/key', { method: 'POST', body: { text } }), null); $('#typeText').value = ''; setTimeout(refreshScreen, 400);
});
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'ok', Backspace: 'back', Escape: 'back', h: 'home', '+': 'volup', '-': 'voldown', ' ': 'play', m: 'menu' };
document.addEventListener('keydown', e => {
  if (S.view !== 'remote' || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  const k = KEYMAP[e.key]; if (!k) return;
  e.preventDefault(); press(k);
});

// ---------------------------------------------------------------- privacy

const DNS = [
  ['off', null], ['adguard', 'dns.adguard-dns.com'], ['family', 'family.adguard-dns.com'],
  ['mullvad', 'adblock.dns.mullvad.net'], ['cloudflare', 'one.one.one.one'], ['custom', ''],
];

async function loadPrivacy() {
  const [set, apps] = await Promise.all([api('/api/settings'), api('/api/apps')]);
  S.apps = apps;
  const mode = set.values['global.private_dns_mode'];
  const host = set.values['global.private_dns_specifier'];
  const cur = mode === 'hostname' ? (DNS.find(([, h]) => h === host)?.[0] || 'custom') : 'off';
  $('#dnsOptions').innerHTML = DNS.map(([k]) => `<label class="opt"><input type="radio" name="dns" value="${k}" ${k === cur ? 'checked' : ''}>
    <div><strong>${t(`dns.${k}`)}</strong><small>${t(`dns.${k}d`)}</small></div></label>`).join('');
  $('#dnsCustom').value = cur === 'custom' ? host : '';
  $('#dnsCustom').disabled = cur !== 'custom';
  $$('#dnsOptions input').forEach(i => i.addEventListener('change', () => { $('#dnsCustom').disabled = i.value !== 'custom'; }));
  $('#dnsCurrent').textContent = `${t('dns.current', { v: mode === 'hostname' ? host : (mode || t('dns.off')) })} — ${t('dns.warn')}`;

  const trackers = apps.filter(a => a.enabled && ['ads', 'telemetry', 'junk'].includes(a.tag) && !a.protected);
  $('#trackersAll').disabled = !trackers.length;
  $('#trackerList').innerHTML = trackers.length ? trackers.map(a => miniApp(a, `<button class="small" data-dis="${esc(a.package)}">${t('act.disable')}</button>`)).join('')
    : `<div class="muted">${t('trackers.none')}</div>`;
  $$('#trackerList [data-dis]').forEach(b => b.addEventListener('click', async () => {
    await act(() => api(`/api/app/${b.dataset.dis}/action`, { method: 'POST', body: { action: 'disable' } })).catch(() => {});
    loadPrivacy();
  }));

  const bgApps = apps.filter(a => a.enabled && a.launchable && !a.protected);
  $('#bgList').innerHTML = bgApps.map(a => miniApp(a, `<button class="small ghost" data-bg="${esc(a.package)}">…</button>`)).join('');
  $$('#bgList [data-bg]').forEach(b => {
    // Each app's background state is read lazily, then shown as a switch.
    api(`/api/app/${b.dataset.bg}`).then(d => {
      const allowed = d.ops.RUN_ANY_IN_BACKGROUND !== 'ignore';
      b.outerHTML = `<label class="switch" title="${t('d.bgRun')}"><input type="checkbox" data-bgpkg="${esc(b.dataset.bg)}" ${allowed ? 'checked' : ''}><span></span></label>`;
      const i = $(`[data-bgpkg="${CSS.escape(d.package)}"]`);
      i.addEventListener('change', () => act(() => api(`/api/app/${d.package}/appop`, { method: 'POST', body: { op: 'RUN_ANY_IN_BACKGROUND', mode: i.checked ? 'allow' : 'ignore' } })).catch(() => { i.checked = !i.checked; }));
    }).catch(() => {});
  });
  $$('#view-privacy img[data-pkg]').forEach(img => loadImg(img));
}

function miniApp(a, right) {
  return `<div class="mini"><img data-pkg="${esc(a.package)}" alt=""><div class="t" style="flex:1"><div>${esc(a.label || a.package)}</div><div>${esc(a.desc || a.package)}</div></div>${right}</div>`;
}
function loadImg(img) {
  if (!S.status?.helper) return;
  fetch(iconUrl(img.dataset.pkg), { headers: { 'x-zen': '1' } }).then(r => r.ok ? r.blob() : null).then(b => { if (b) img.src = URL.createObjectURL(b); });
}

$('#dnsApply').addEventListener('click', async () => {
  const k = $('#dnsOptions input:checked')?.value; if (!k) return;
  let host = DNS.find(([key]) => key === k)[1];
  if (k === 'custom') host = $('#dnsCustom').value.trim();
  const changes = k === 'off'
    ? [{ ns: 'global', key: 'private_dns_mode', value: 'off' }]
    : [{ ns: 'global', key: 'private_dns_specifier', value: host }, { ns: 'global', key: 'private_dns_mode', value: 'hostname' }];
  await act(() => api('/api/settings', { method: 'POST', body: { changes, label: `DNS: ${k === 'off' ? 'off' : host}` } })).catch(() => {});
  loadPrivacy();
});
$('#trackersAll').addEventListener('click', async () => {
  const trackers = S.apps.filter(a => a.enabled && ['ads', 'telemetry', 'junk'].includes(a.tag) && !a.protected);
  for (const a of trackers) {
    try { await api(`/api/app/${a.package}/action`, { method: 'POST', body: { action: 'disable' } }); } catch (e) { toast(`${a.package}: ${e.message}`, true); }
  }
  toast(t('ok')); refreshJournalCount(); loadPrivacy();
});

// ---------------------------------------------------------------- settings

const TIMEOUTS = [[300000, 5], [900000, 15], [1800000, 30], [3600000, 60], [14400000, 240], [-1, 0]];
// Durées affichées en heures et minutes entières (la télé peut stocker des valeurs comme 14339000 ms).
function timeLabel(ms) {
  if (ms === -1 || ms === 0 || ms >= 2147483647) return t('never');
  const total = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(total / 60), m = total % 60;
  if (!h) return t('min', { n: m });
  return m ? `${t('hour', { n: h })} ${t('min', { n: m })}` : t('hour', { n: h });
}

function fillTimeout(sel, current) {
  const opts = TIMEOUTS.map(([ms]) => ms);
  const cur = Number(current);
  if (current != null && !opts.includes(cur)) opts.push(cur);
  sel.innerHTML = opts.sort((a, b) => (a === -1 ? 1e12 : a) - (b === -1 ? 1e12 : b)).map(ms => `<option value="${ms}" ${ms === cur ? 'selected' : ''}>${timeLabel(ms)}</option>`).join('');
}

async function loadSettings() {
  const [s, dev] = await Promise.all([api('/api/settings'), api('/api/device')]);
  const v = s.values;
  const anim = v['global.window_animation_scale'] ?? '1.0';
  $('#animSel').innerHTML = [['0', 'anim.0'], ['0.5', 'anim.05'], ['1.0', 'anim.1']].map(([val, k]) =>
    `<option value="${val}" ${Number(val) === Number(anim) ? 'selected' : ''}>${t(k)}</option>`).join('');
  fillTimeout($('#screenOff'), v['system.screen_off_timeout']);
  fillTimeout($('#sleepTimeout'), v['secure.sleep_timeout']);
  $('#screensaver').checked = v['secure.screensaver_enabled'] === '1';
  $('#homeList').innerHTML = s.homes.map(c => `<label class="opt"><input type="radio" name="home" value="${esc(c)}" ${c === s.home ? 'checked' : ''}><div><strong>${esc(c.split('/')[0])}</strong><small>${esc(c)}</small></div></label>`).join('');
  $$('#homeList input').forEach(i => i.addEventListener('change', () => act(() => api('/api/home', { method: 'POST', body: { component: i.value } })).catch(() => {})));
  $('#a11yList').innerHTML = s.accessibility.map(a => `<div class="mini"><div class="t"><div>${esc(a.component.split('/')[0])}</div><div>${esc(a.component)}</div></div>
    <label class="switch"><input type="checkbox" data-a11y="${esc(a.component)}" ${a.enabled ? 'checked' : ''}><span></span></label></div>`).join('');
  $$('#a11yList input').forEach(i => i.addEventListener('change', () =>
    act(() => api('/api/accessibility', { method: 'POST', body: { component: i.dataset.a11y, enabled: i.checked } })).catch(() => { i.checked = !i.checked; })));
  const up = dev.uptime; const h = Math.floor(up / 3600); const m = Math.floor(up % 3600 / 60);
  $('#deviceInfo').innerHTML = [
    ['i.model', `${dev.manufacturer} ${dev.model}`], ['i.android', `${dev.android} (API ${dev.sdk})`], ['i.ip', dev.ip],
    ['i.ram', `${Math.round(dev.memAvailable / 1024)} / ${Math.round(dev.memTotal / 1024)} MB`],
    ['i.storage', dev.storage[3] ? `${dev.storage[3]} / ${dev.storage[1]}` : '—'], ['i.uptime', `${h} h ${m} min`],
  ].map(([k, val]) => `<dt>${t(k)}</dt><dd>${esc(val)}</dd>`).join('');
  loadRaw();
}

const setOne = (ns, key, value, label) => act(() => api('/api/settings', { method: 'POST', body: { changes: [{ ns, key, value }], label } }));
$('#animSel').addEventListener('change', e => act(() => api('/api/settings', { method: 'POST', body: {
  label: `${t('set.anim')}: ${e.target.selectedOptions[0].text}`,
  changes: ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale'].map(key => ({ ns: 'global', key, value: e.target.value })),
} })));
$('#screenOff').addEventListener('change', e => setOne('system', 'screen_off_timeout', e.target.value, t('set.screenOff')));
$('#sleepTimeout').addEventListener('change', e => setOne('secure', 'sleep_timeout', e.target.value, t('set.sleepTimeout')));
$('#screensaver').addEventListener('change', e => setOne('secure', 'screensaver_enabled', e.target.checked ? '1' : '0', t('set.screensaver')));
$('#reboot').addEventListener('click', () => confirm(t('set.rebootConfirm')) && act(() => api('/api/reboot', { method: 'POST' })));

let rawData = {};
async function loadRaw() {
  rawData = await api(`/api/settings/raw?ns=${$('#rawNs').value}`);
  renderRaw();
}
function renderRaw() {
  const q = $('#rawSearch').value.toLowerCase();
  const ns = $('#rawNs').value;
  $('#rawList').innerHTML = Object.entries(rawData).filter(([k, v]) => !q || k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q))
    .map(([k, v]) => `<div><span title="${esc(k)}">${esc(k)}</span><span title="${esc(v)}">${esc(v)}</span><button class="small ghost" data-k="${esc(k)}">✎</button></div>`).join('');
  $$('#rawList [data-k]').forEach(b => b.addEventListener('click', async () => {
    const k = b.dataset.k;
    const val = prompt(t('set.editPrompt', { k }), rawData[k]);
    if (val === null) return;
    await setOne(ns, k, val === '' ? null : val, `${ns}.${k}`).catch(() => {});
    loadRaw();
  }));
}
$('#rawNs').addEventListener('change', loadRaw);
$('#rawSearch').addEventListener('input', renderRaw);

// ---------------------------------------------------------------- install

async function installFile(file) {
  if (!file || !/\.apk$/i.test(file.name)) return;
  $('#installStatus').innerHTML = `<span class="spinner"></span> ${esc(t('install.progress', { f: file.name }))}`;
  try {
    const res = await fetch('/api/install', { method: 'POST', headers: { 'x-zen': '1', 'x-filename': encodeURIComponent(file.name) }, body: file });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    $('#installStatus').textContent = t('install.ok', { f: file.name });
    refreshJournalCount(); S.apps = [];
  } catch (e) { $('#installStatus').textContent = t('error', { e: e.message }); }
}
const drop = $('#drop');
drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); installFile(e.dataTransfer.files[0]); });
$('#apkFile').addEventListener('change', e => installFile(e.target.files[0]));

// ---------------------------------------------------------------- journal

function describe(e) {
  const a = { disable: t('act.disable'), enable: t('act.enable'), suspend: t('act.suspend'), unsuspend: t('act.unsuspend') }[e.action] || e.action || '';
  const name = S.apps.find(x => x.package === e.pkg)?.label || e.pkg;
  return t(`j.${e.kind}`, { a, p: name, op: e.op, m: e.after, perm: (e.perm || '').split('.').pop(), l: e.label, c: e.after });
}

async function loadJournal() {
  const j = await api('/api/journal');
  $('#undoAll').disabled = !j.some(e => !e.undone && e.undoable !== false);
  $('#journalList').innerHTML = j.length ? j.map(e => `<div class="jitem ${e.undone ? 'undone' : ''}">
    <div><div>${esc(describe(e))}</div><time>${new Date(e.time).toLocaleString(LANG)}</time></div>
    ${e.undone ? `<span class="muted">${t('journal.undone')}</span>` : (e.undoable === false ? `<span class="muted">${t('journal.notUndoable')}</span>` : `<button class="small" data-undo="${e.id}">${t('act.undo')}</button>`)}
  </div>`).join('') : `<div class="empty">${t('journal.empty')}</div>`;
  $$('[data-undo]').forEach(b => b.addEventListener('click', async () => {
    await act(() => api('/api/journal/undo', { method: 'POST', body: { id: b.dataset.undo } })).catch(() => {});
    loadJournal();
  }));
  refreshJournalCount(j);
}
$('#undoAll').addEventListener('click', async () => {
  if (!confirm(t('journal.undoAllConfirm'))) return;
  const r = await act(() => api('/api/journal/undo', { method: 'POST', body: { all: true } })).catch(() => null);
  if (r?.errors?.length) toast(r.errors.join(' · '), true);
  loadJournal();
});
async function refreshJournalCount(j) {
  try {
    j = j || await api('/api/journal');
    const n = j.filter(e => !e.undone && e.undoable !== false).length;
    $('#journalCount').hidden = !n; $('#journalCount').textContent = n;
  } catch {}
}

// ---------------------------------------------------------------- boot

applyI18n();
(async () => {
  const s = await refreshStatus();
  if (s.connected) { show(location.hash.slice(1) || 'apps'); refreshJournalCount(); }
  else { show('connect'); if (s.adb) scanTvs(); }
})();
setInterval(() => refreshStatus().catch(() => {}), 15000);
window.addEventListener('hashchange', () => {
  const v = location.hash.slice(1);
  if (S.status?.connected && v !== S.view && document.getElementById(`view-${v}`)) show(v);
});
