/* ═══════════════════════════════════════════════════
   BudgiBook Local — Core App (router + utilities)
   ═══════════════════════════════════════════════════ */

window.App = (() => {

  // ── API helper ────────────────────────────────────
  async function api(method, url, body) {
    const opts = {
      method,
      headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}
    };
    if (body) {
      opts.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  }

  // ── Toast notifications ───────────────────────────
  function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ── Modal ─────────────────────────────────────────
  function openModal(title, html) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  function closeModal(e) {
    if (e && e.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
  }

  // ── Hash router ───────────────────────────────────
  const routes = {};
  function register(path, fn) { routes[path] = fn; }

  async function navigate(hash) {
    window.location.hash = hash;
  }

  async function dispatch() {
    const raw    = window.location.hash.replace('#', '') || 'dashboard';
    const parts  = raw.split('/');
    const route  = parts[0];
    const param  = parts[1] || null;

    // Highlight active nav
    document.querySelectorAll('.nav-item').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route);
    });

    const fn = routes[route];
    if (fn) {
      try { await fn(param); }
      catch (e) { console.error(e); showError(e.message); }
    } else {
      await (routes['dashboard'])();
    }
  }

  function showError(msg) {
    document.getElementById('content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>${msg}</p>
        <button class="btn btn-primary" onclick="App.navigate('dashboard')">Retour au tableau de bord</button>
      </div>`;
  }

  // ── Utility helpers ───────────────────────────────
  function formatDate(d) {
    if (!d) return '—';
    const [y, m, j] = d.split('-');
    return `${j}/${m}/${y}`;
  }

  function sexeIcon(s) {
    return s === 'male' ? '♂' : s === 'femelle' ? '♀' : '?';
  }
  function sexeLabel(s) {
    return s === 'male' ? 'Mâle' : s === 'femelle' ? 'Femelle' : 'Indéterminé';
  }
  function sexeBadge(s) {
    return `<span class="badge badge-${s}">${sexeIcon(s)} ${sexeLabel(s)}</span>`;
  }
  function statutBadge(s) {
    const labels = { actif:'Actif', vendu:'Vendu', donne:'Donné', decede:'Décédé',
                     en_cours:'En cours', terminee:'Terminée', abandonnee:'Abandonnée' };
    return `<span class="badge badge-${s}">${labels[s] || s}</span>`;
  }

  function birdPhoto(photo, sexe, size = 40) {
    if (photo) return `<img src="/uploads/${photo}" class="bird-thumb" style="width:${size}px;height:${size}px" alt="">`;
    return `<div class="bird-thumb-placeholder" style="width:${size}px;height:${size}px;font-size:${size*0.45}px">${sexeIcon(sexe)}</div>`;
  }

  function confirmDanger(msg, onConfirm) {
    openModal('Confirmation', `
      <p style="margin-bottom:20px">${msg}</p>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
        <button class="btn btn-danger" id="confirm-btn">Supprimer</button>
      </div>
    `);
    document.getElementById('confirm-btn').onclick = () => { closeModal(); onConfirm(); };
  }

  // ── Sidebar farm name ─────────────────────────────
  async function loadSidebarInfo() {
    try {
      const e = await api('GET', '/api/elevage');
      document.getElementById('sidebar-farm-name').textContent = e.nom || 'Mon Élevage';
      if (e.logo) {
        const img = document.getElementById('sidebar-logo');
        const ph  = document.getElementById('sidebar-logo-placeholder');
        img.src = `/uploads/${e.logo}`;
        img.classList.remove('hidden');
        ph.style.display = 'none';
      }
    } catch {}
  }

  // ── Init ──────────────────────────────────────────
  window.addEventListener('hashchange', dispatch);
  window.addEventListener('DOMContentLoaded', () => {
    loadSidebarInfo();
    dispatch();
  });

  return { api, toast, openModal, closeModal, navigate, register, formatDate,
           sexeIcon, sexeLabel, sexeBadge, statutBadge, birdPhoto, confirmDanger,
           loadSidebarInfo };
})();
