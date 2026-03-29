/**
 * BudgiBook — Composant sidebar partagé
 * Injecte la sidebar dans toutes les pages de l'app connectée
 */

function renderSidebar(user) {
  const isAdmin = user.role === 'admin';

  const nav = isAdmin
    ? `<a href="/admin"><span class="nav-icon">📊</span> Tableau de bord</a>
       <a href="/admin#users"><span class="nav-icon">👥</span> Éleveurs</a>`
    : `<a href="/tableau-de-bord"><span class="nav-icon">📊</span> Tableau de bord</a>
       <a href="/mes-oiseaux"><span class="nav-icon">🦜</span> Mes oiseaux</a>
       <a href="/accouplements"><span class="nav-icon">🥚</span> Accouplements</a>
       <a href="/pedigree"><span class="nav-icon">🌳</span> Pedigree</a>
       <a href="/mon-profil"><span class="nav-icon">🏡</span> Mon profil</a>`;

  const initial = (user.farm_name || user.email || 'U')[0].toUpperCase();
  const avatarHTML = user.profile_photo
    ? `<img src="${user.profile_photo}" alt="avatar">`
    : `<div class="avatar-placeholder">${initial}</div>`;

  const html = `
    <aside class="sidebar" id="main-sidebar">
      <div class="sidebar-logo">
        <div class="logo-text">🐦 BudgiBook</div>
        <div class="logo-sub">${isAdmin ? 'Administration' : 'Espace éleveur'}</div>
      </div>
      <nav class="sidebar-nav">${nav}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          ${avatarHTML}
          <div>
            <div style="font-weight:600;font-size:.85rem;line-height:1.2">${user.farm_name || 'Mon élevage'}</div>
            <div style="font-size:.75rem;opacity:.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">${user.email}</div>
          </div>
        </div>
        <button class="btn-logout" onclick="logout()">Déconnexion</button>
      </div>
    </aside>`;

  document.body.insertAdjacentHTML('afterbegin', html);
  setActiveNav();
}

async function logout() {
  try {
    await api('POST', '/api/auth/logout');
  } catch {}
  window.location.href = '/';
}
