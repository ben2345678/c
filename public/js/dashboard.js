/* ═══════════════════════════════════════════════════
   BudgiBook Local — Tableau de bord
   ═══════════════════════════════════════════════════ */

App.register('dashboard', async () => {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

  const [oiseaux, nichees] = await Promise.all([
    App.api('GET', '/api/oiseaux'),
    App.api('GET', '/api/nichees')
  ]);

  const actifs    = oiseaux.filter(o => o.statut === 'actif');
  const males     = actifs.filter(o => o.sexe === 'male').length;
  const femelles  = actifs.filter(o => o.sexe === 'femelle').length;
  const enCours   = nichees.filter(n => n.statut === 'en_cours').length;
  const derniers  = oiseaux.slice(0, 6);
  const derniereNichees = nichees.slice(0, 5);

  content.innerHTML = `
    <div class="page-header">
      <h1>Tableau de bord</h1>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🐦</div>
        <div class="stat-value">${actifs.length}</div>
        <div class="stat-label">Oiseaux actifs</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">♂</div>
        <div class="stat-value">${males}</div>
        <div class="stat-label">Mâles</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">♀</div>
        <div class="stat-value">${femelles}</div>
        <div class="stat-label">Femelles</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🥚</div>
        <div class="stat-value">${enCours}</div>
        <div class="stat-label">Nichées en cours</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${oiseaux.length}</div>
        <div class="stat-label">Total oiseaux</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🌳</div>
        <div class="stat-value">${nichees.length}</div>
        <div class="stat-label">Total nichées</div>
      </div>
    </div>

    <div class="dashboard-grid">

      <!-- Derniers oiseaux -->
      <div class="section-block">
        <div class="section-block-title">Derniers oiseaux ajoutés</div>
        ${derniers.length === 0
          ? `<div class="empty-state"><p>Aucun oiseau pour le moment.</p>
             <button class="btn btn-primary btn-sm" onclick="App.navigate('oiseaux')">Ajouter un oiseau</button></div>`
          : `<div class="table-wrap">
              <table class="data-table">
                <thead><tr>
                  <th>Photo</th><th>Nom</th><th>Bague</th><th>Sexe</th><th>Statut</th>
                </tr></thead>
                <tbody>
                  ${derniers.map(o => `
                    <tr class="clickable" onclick="App.navigate('oiseaux/${o.id}')">
                      <td>${App.birdPhoto(o.photo, o.sexe)}</td>
                      <td><strong>${o.nom}</strong></td>
                      <td>${o.bague || '—'}</td>
                      <td>${App.sexeBadge(o.sexe)}</td>
                      <td>${App.statutBadge(o.statut)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
             </div>
             <div style="margin-top:12px;text-align:right">
               <a href="#oiseaux" style="color:var(--primary);font-size:13px">Voir tous →</a>
             </div>`
        }
      </div>

      <!-- Nichées récentes -->
      <div class="section-block">
        <div class="section-block-title">Nichées récentes</div>
        ${derniereNichees.length === 0
          ? `<div class="empty-state"><p>Aucune nichée enregistrée.</p>
             <button class="btn btn-primary btn-sm" onclick="App.navigate('nichees')">Créer une nichée</button></div>`
          : `<div class="table-wrap">
              <table class="data-table">
                <thead><tr>
                  <th>Couple</th><th>Œufs</th><th>Éclos</th><th>Statut</th>
                </tr></thead>
                <tbody>
                  ${derniereNichees.map(n => `
                    <tr class="clickable" onclick="App.navigate('nichees/${n.id}')">
                      <td>
                        <strong>${n.male_nom}</strong>
                        <span style="color:var(--text-muted)"> × </span>
                        <strong>${n.femelle_nom}</strong>
                      </td>
                      <td>${n.nb_oeufs}</td>
                      <td>${n.nb_eclos}</td>
                      <td>${App.statutBadge(n.statut)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
             </div>
             <div style="margin-top:12px;text-align:right">
               <a href="#nichees" style="color:var(--primary);font-size:13px">Voir toutes →</a>
             </div>`
        }
      </div>

    </div>
  `;
});
