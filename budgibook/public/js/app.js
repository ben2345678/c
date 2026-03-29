/**
 * BudgiBook — Utilitaires JavaScript partagés
 * Inclus dans toutes les pages de l'application
 */

// ─── Toast notifications ─────────────────────────────────────────────────────
const ToastManager = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 3500) {
    const c = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;

    c.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'none';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all .3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return { show, success: m => show(m, 'success'), error: m => show(m, 'error'), warning: m => show(m, 'warning'), info: m => show(m, 'info') };
})();

// ─── Boîte de confirmation ───────────────────────────────────────────────────
function confirmDialog(message, onConfirm, title = 'Confirmer') {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" id="confirm-cancel">Annuler</button>
        <button class="btn btn-danger" id="confirm-ok">Confirmer</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); onConfirm(); };
}

// ─── Appels API ──────────────────────────────────────────────────────────────
async function api(method, url, data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin'
  };
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(url, options);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Erreur ${res.status}`);
  }
  return json;
}

// ─── Gestion des modales ─────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Fermer une modale en cliquant sur l'overlay
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ─── Utilitaires ────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR');
}

function sexLabel(sex) {
  return { male: 'Mâle', female: 'Femelle', unknown: 'Indéterminé' }[sex] || sex;
}

function sexBadge(sex) {
  const map = { male: 'badge-male', female: 'badge-female', unknown: 'badge-unknown' };
  const labels = { male: '♂ Mâle', female: '♀ Femelle', unknown: '? Indéterminé' };
  return `<span class="badge ${map[sex] || 'badge-unknown'}">${labels[sex] || sex}</span>`;
}

function statusBadge(status) {
  const map = {
    active:   ['badge-active', 'Actif'],
    sold:     ['badge-sold',   'Vendu'],
    given:    ['badge-given',  'Donné'],
    deceased: ['badge-deceased', 'Décédé']
  };
  const [cls, label] = map[status] || ['badge-unknown', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function clutchStatusBadge(status) {
  const map = {
    ongoing:   ['badge-ongoing',   'En cours'],
    finished:  ['badge-finished',  'Terminée'],
    abandoned: ['badge-abandoned', 'Abandonnée']
  };
  const [cls, label] = map[status] || ['badge-unknown', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function birdPhotoHTML(photo, size = 40, name = '') {
  if (photo) {
    return `<img src="${photo}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" alt="${name}">`;
  }
  const initial = name ? name[0].toUpperCase() : '?';
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size*0.4}px">${initial}</div>`;
}

// ─── Lecture de fichier image en base64 ─────────────────────────────────────
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Vérification de session / redirection ───────────────────────────────────
async function requireLogin(redirectTo = '/') {
  try {
    const data = await api('GET', '/api/auth/me');
    return data.user;
  } catch {
    window.location.href = redirectTo;
    return null;
  }
}

async function requireAdmin(redirectTo = '/') {
  const user = await requireLogin(redirectTo);
  if (user && user.role !== 'admin') {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

// ─── Navigation active dans la sidebar ──────────────────────────────────────
function setActiveNav() {
  const links = document.querySelectorAll('.sidebar-nav a');
  links.forEach(link => {
    if (link.getAttribute('href') === window.location.pathname) {
      link.classList.add('active');
    }
  });
}
