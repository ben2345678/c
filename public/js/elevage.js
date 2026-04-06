/* ═══════════════════════════════════════════════════
   BudgiBook Local — Mon Élevage + Sauvegarde
   ═══════════════════════════════════════════════════ */

// ── Profil élevage ───────────────────────────────────
App.register('elevage', async () => {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

  const e = await App.api('GET', '/api/elevage');

  content.innerHTML = `
    <div class="page-header"><h1>Mon Élevage</h1></div>

    <div style="display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:start;max-width:860px">

      <!-- Logo -->
      <div style="display:flex;flex-direction:column;gap:12px">
        ${e.logo
          ? `<img src="/uploads/${e.logo}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-lg);border:2px solid var(--border)" alt="Logo">`
          : `<div style="width:100%;aspect-ratio:1;border-radius:var(--radius-lg);background:var(--primary-bg);display:flex;align-items:center;justify-content:center;font-size:64px;border:2px dashed var(--primary-light)">🐦</div>`
        }
        <label class="btn btn-secondary" style="justify-content:center;cursor:pointer;text-align:center">
          🖼️ ${e.logo ? 'Changer le logo' : 'Ajouter un logo'}
          <input type="file" accept="image/*" style="display:none" onchange="uploadLogoElevage(this)">
        </label>
      </div>

      <!-- Formulaire -->
      <div class="card">
        <form id="elevage-form">
          <div class="form-grid">
            <div class="form-section-title">Informations de l'élevage</div>
            <div class="form-group full">
              <label>Nom de l'élevage *</label>
              <input type="text" name="nom" value="${e.nom||''}" required placeholder="Ex: Élevage de la Prairie">
            </div>
            <div class="form-group">
              <label>Région</label>
              <input type="text" name="region" value="${e.region||''}" placeholder="Ex: Bretagne">
            </div>
            <div class="form-group">
              <label>Contact</label>
              <input type="text" name="contact" value="${e.contact||''}" placeholder="Email, téléphone…">
            </div>
            <div class="form-group full">
              <label>Description</label>
              <textarea name="description" placeholder="Présentation de votre élevage…">${e.description||''}</textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
          </div>
        </form>
      </div>

    </div>
  `;

  document.getElementById('elevage-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd   = new FormData(ev.target);
    const data = Object.fromEntries(fd.entries());
    try {
      await App.api('PUT', '/api/elevage', data);
      App.toast('Profil enregistré !');
      App.loadSidebarInfo();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });
});

async function uploadLogoElevage(input) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('logo', file);
  try {
    await App.api('POST', '/api/elevage/logo', fd);
    App.toast('Logo mis à jour !');
    App.loadSidebarInfo();
    App.navigate('elevage');
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

// ── Sauvegarde ───────────────────────────────────────
App.register('backup', async () => {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header"><h1>Sauvegarde & Export</h1></div>

    <div class="backup-grid">

      <div class="backup-card">
        <div class="backup-icon">💾</div>
        <h3>Exporter les données</h3>
        <p>Télécharge un fichier JSON contenant tous vos oiseaux, nichées et données de l'élevage.</p>
        <button class="btn btn-primary" onclick="exportBackup()">⬇️ Télécharger la sauvegarde</button>
      </div>

      <div class="backup-card">
        <div class="backup-icon">📂</div>
        <h3>Restaurer une sauvegarde</h3>
        <p>Importe un fichier JSON précédemment exporté. <strong>Attention :</strong> cela remplace toutes les données actuelles.</p>
        <label class="btn btn-warning" style="cursor:pointer">
          ⬆️ Choisir un fichier JSON
          <input type="file" accept=".json" style="display:none" onchange="importBackup(this)">
        </label>
      </div>

    </div>

    <div class="card" style="margin-top:24px;max-width:600px">
      <div class="card-title">À propos de la sauvegarde</div>
      <ul style="padding-left:18px;line-height:2;color:var(--text-secondary);font-size:13px">
        <li>Le fichier JSON contient toutes vos données (oiseaux, nichées, liens).</li>
        <li>Les photos ne sont <strong>pas incluses</strong> dans l'export — sauvegardez aussi le dossier <code>uploads/</code>.</li>
        <li>Pour une sauvegarde complète, copiez le fichier <code>budgibook.db</code> et le dossier <code>uploads/</code>.</li>
        <li>La restauration <strong>efface toutes les données actuelles</strong> avant d'importer.</li>
      </ul>
    </div>
  `;
});

function exportBackup() {
  window.location.href = '/api/backup';
}

async function importBackup(input) {
  const file = input.files[0];
  if (!file) return;

  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return App.toast('Fichier JSON invalide.', 'error');
  }

  if (!data.oiseaux) return App.toast('Format de fichier non reconnu.', 'error');

  App.confirmDanger(
    `Restaurer depuis <strong>${file.name}</strong> ? Toutes les données actuelles seront remplacées.`,
    async () => {
      try {
        const res = await App.api('POST', '/api/backup/restore', data);
        App.toast(res.message || 'Restauration réussie !');
        App.navigate('dashboard');
      } catch (err) {
        App.toast(err.message, 'error');
      }
    }
  );
}
