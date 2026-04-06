/* ═══════════════════════════════════════════════════
   BudgiBook Local — Nichées & Accouplements
   ═══════════════════════════════════════════════════ */

const NI = { filtreStatut: '' };

// ── List ────────────────────────────────────────────
App.register('nichees', async (id) => {
  if (id) return renderNicheeDetail(id);

  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

  const s = document.getElementById('fi-nichee-statut');
  if (s) NI.filtreStatut = s.value;

  const params = NI.filtreStatut ? `?statut=${NI.filtreStatut}` : '';
  const nichees = await App.api('GET', '/api/nichees' + params);

  content.innerHTML = `
    <div class="page-header">
      <h1>Nichées <span style="font-size:15px;font-weight:400;color:var(--text-secondary)">(${nichees.length})</span></h1>
      <button class="btn btn-primary" onclick="showNicheeForm()">+ Créer une nichée</button>
    </div>

    <div class="filters">
      <select id="fi-nichee-statut" onchange="NI.filtreStatut=this.value;App.navigate('nichees')">
        <option value="" ${!NI.filtreStatut?'selected':''}>Tous les statuts</option>
        <option value="en_cours"   ${NI.filtreStatut==='en_cours'  ?'selected':''}>En cours</option>
        <option value="terminee"   ${NI.filtreStatut==='terminee'  ?'selected':''}>Terminée</option>
        <option value="abandonnee" ${NI.filtreStatut==='abandonnee'?'selected':''}>Abandonnée</option>
      </select>
    </div>

    ${nichees.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">🥚</div>
           <p>Aucune nichée enregistrée.</p>
           <button class="btn btn-primary" onclick="showNicheeForm()">Créer ma première nichée</button>
         </div>`
      : `<div class="nichee-cards">
           ${nichees.map(n => `
             <div class="nichee-card" onclick="App.navigate('nichees/${n.id}')">
               <div class="nichee-card-header">
                 <div class="nichee-couple">
                   <span>♂ ${n.male_nom}</span>
                   <span class="sep">×</span>
                   <span>♀ ${n.femelle_nom}</span>
                 </div>
                 ${App.statutBadge(n.statut)}
               </div>
               <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">
                 ${n.male_mutation||n.femelle_mutation
                   ? `${n.male_mutation||'?'} × ${n.femelle_mutation||'?'}`
                   : ''}
                 ${n.date_mise_en_nid ? ` · Mise en nid : ${App.formatDate(n.date_mise_en_nid)}` : ''}
               </div>
               <div class="nichee-stats">
                 <div class="nichee-stat"><div class="val">${n.nb_oeufs}</div><div class="lbl">œufs</div></div>
                 <div class="nichee-stat"><div class="val">${n.nb_eclos}</div><div class="lbl">éclos</div></div>
                 <div class="nichee-stat"><div class="val">${n.nb_poussins_enregistres}</div><div class="lbl">enregistrés</div></div>
               </div>
               <div onclick="event.stopPropagation()" style="margin-top:12px;display:flex;gap:6px">
                 <button class="btn-icon btn-sm" onclick="showNicheeForm(${n.id})">✏️</button>
                 <button class="btn-icon btn-sm danger" onclick="deleteNichee(${n.id})">🗑️</button>
               </div>
             </div>
           `).join('')}
         </div>`
    }
  `;
});

// ── Detail ──────────────────────────────────────────
async function renderNicheeDetail(id) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

  const n = await App.api('GET', `/api/nichees/${id}`);

  const poussinsHtml = n.poussins.length > 0
    ? `<div class="table-wrap"><table class="data-table">
         <thead><tr><th>Photo</th><th>Nom</th><th>Bague</th><th>Sexe</th><th>Mutation</th><th>Statut</th><th></th></tr></thead>
         <tbody>
           ${n.poussins.map(p => `
             <tr class="clickable" onclick="App.navigate('oiseaux/${p.id}')">
               <td>${App.birdPhoto(p.photo, p.sexe)}</td>
               <td><strong>${p.nom}</strong></td>
               <td>${p.bague || '—'}</td>
               <td>${App.sexeBadge(p.sexe)}</td>
               <td>${p.mutation || '—'}</td>
               <td>${App.statutBadge(p.statut)}</td>
               <td onclick="event.stopPropagation()">
                 <button class="btn-icon danger btn-sm" onclick="delierPoussin(${id},${p.id},'${p.nom.replace(/'/g,"\\'")}')">✕</button>
               </td>
             </tr>
           `).join('')}
         </tbody>
       </table></div>`
    : `<p style="color:var(--text-muted);font-style:italic">Aucun poussin enregistré.</p>`;

  content.innerHTML = `
    <div class="breadcrumb">
      <a href="#nichees">Nichées</a> › ${n.male_nom} × ${n.femelle_nom}
    </div>

    <div class="page-header">
      <h1>♂ ${n.male_nom} × ♀ ${n.femelle_nom}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="showNicheeForm(${n.id})">✏️ Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="deleteNichee(${n.id})">🗑️</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">

      <div class="section-block">
        <div class="section-block-title">Parents</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div style="display:flex;gap:10px;align-items:center;cursor:pointer" onclick="App.navigate('oiseaux/${n.male_id}')">
            ${App.birdPhoto(n.male_photo, 'male', 52)}
            <div>
              <div style="font-weight:700">♂ ${n.male_nom}</div>
              <div style="font-size:12px;color:var(--text-secondary)">${n.male_bague||''}${n.male_mutation?' · '+n.male_mutation:''}</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;cursor:pointer" onclick="App.navigate('oiseaux/${n.femelle_id}')">
            ${App.birdPhoto(n.femelle_photo, 'femelle', 52)}
            <div>
              <div style="font-weight:700">♀ ${n.femelle_nom}</div>
              <div style="font-size:12px;color:var(--text-secondary)">${n.femelle_bague||''}${n.femelle_mutation?' · '+n.femelle_mutation:''}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-block">
        <div class="section-block-title">Données</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Statut</div>
            <div class="info-value">${App.statutBadge(n.statut)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Mise en nid</div>
            <div class="info-value">${App.formatDate(n.date_mise_en_nid)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date de ponte</div>
            <div class="info-value">${App.formatDate(n.date_ponte)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date d'envol</div>
            <div class="info-value">${App.formatDate(n.date_envol)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Œufs pondus</div>
            <div class="info-value" style="font-size:20px;font-weight:800;color:var(--primary)">${n.nb_oeufs}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Œufs éclos</div>
            <div class="info-value" style="font-size:20px;font-weight:800;color:var(--primary)">${n.nb_eclos}</div>
          </div>
        </div>
        ${n.notes ? `<p style="margin-top:12px;white-space:pre-wrap;font-size:13px;color:var(--text)">${n.notes}</p>` : ''}
      </div>

    </div>

    <div class="section-block">
      <div class="section-block-title" style="display:flex;align-items:center;justify-content:space-between">
        <span>Poussins (${n.poussins.length})</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="showLierPoussin(${n.id})">🔗 Lier un oiseau existant</button>
          <button class="btn btn-primary btn-sm" onclick="showCreerPoussin(${n.id},${n.male_id},${n.femelle_id})">+ Créer un poussin</button>
        </div>
      </div>
      ${poussinsHtml}
    </div>
  `;
}

// ── Nichée form ─────────────────────────────────────
async function showNicheeForm(id = null) {
  const [oiseaux, nichee] = await Promise.all([
    App.api('GET', '/api/oiseaux'),
    id ? App.api('GET', `/api/nichees/${id}`) : Promise.resolve(null)
  ]);

  const n = nichee || {};
  const males    = oiseaux.filter(o => o.sexe === 'male'    || o.sexe === 'inconnu');
  const femelles = oiseaux.filter(o => o.sexe === 'femelle' || o.sexe === 'inconnu');

  App.openModal(id ? 'Modifier la nichée' : 'Créer une nichée', `
    <form id="nichee-form">
      <div class="form-grid">

        <div class="form-section-title">Couple</div>

        <div class="form-group">
          <label>Mâle *</label>
          <select name="male_id" required>
            <option value="">— Sélectionner —</option>
            ${males.map(o => `<option value="${o.id}" ${n.male_id==o.id?'selected':''}>${o.nom}${o.bague?' ('+o.bague+')':''}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Femelle *</label>
          <select name="femelle_id" required>
            <option value="">— Sélectionner —</option>
            ${femelles.map(o => `<option value="${o.id}" ${n.femelle_id==o.id?'selected':''}>${o.nom}${o.bague?' ('+o.bague+')':''}</option>`).join('')}
          </select>
        </div>

        <div class="form-section-title">Dates</div>

        <div class="form-group">
          <label>Mise en nid</label>
          <input type="date" name="date_mise_en_nid" value="${n.date_mise_en_nid||''}">
        </div>
        <div class="form-group">
          <label>Première ponte</label>
          <input type="date" name="date_ponte" value="${n.date_ponte||''}">
        </div>
        <div class="form-group">
          <label>Date d'envol</label>
          <input type="date" name="date_envol" value="${n.date_envol||''}">
        </div>
        <div class="form-group">
          <label>Statut</label>
          <select name="statut">
            <option value="en_cours"   ${(n.statut||'en_cours')==='en_cours'  ?'selected':''}>En cours</option>
            <option value="terminee"   ${n.statut==='terminee'  ?'selected':''}>Terminée</option>
            <option value="abandonnee" ${n.statut==='abandonnee'?'selected':''}>Abandonnée</option>
          </select>
        </div>

        <div class="form-section-title">Ponte</div>

        <div class="form-group">
          <label>Nombre d'œufs</label>
          <input type="number" name="nb_oeufs" value="${n.nb_oeufs||0}" min="0">
        </div>
        <div class="form-group">
          <label>Nombre d'éclos</label>
          <input type="number" name="nb_eclos" value="${n.nb_eclos||0}" min="0">
        </div>

        <div class="form-group full">
          <label>Notes</label>
          <textarea name="notes" placeholder="Observations, comportement du couple…">${n.notes||''}</textarea>
        </div>

      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
        <button type="submit" class="btn btn-primary">${id ? 'Enregistrer' : 'Créer'}</button>
      </div>
    </form>
  `);

  document.getElementById('nichee-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd   = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    ['date_mise_en_nid','date_ponte','date_envol'].forEach(k => { if (!data[k]) data[k] = null; });
    data.nb_oeufs = parseInt(data.nb_oeufs)||0;
    data.nb_eclos = parseInt(data.nb_eclos)||0;

    try {
      if (id) {
        await App.api('PUT', `/api/nichees/${id}`, data);
        App.toast('Nichée mise à jour !');
      } else {
        const res = await App.api('POST', '/api/nichees', data);
        App.toast('Nichée créée !');
        App.closeModal();
        App.navigate(`nichees/${res.id}`);
        return;
      }
      App.closeModal();
      App.navigate(`nichees/${id}`);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });
}

// ── Lier poussin existant ───────────────────────────
async function showLierPoussin(nicheeId) {
  const oiseaux = await App.api('GET', '/api/oiseaux');
  App.openModal('Lier un oiseau à cette nichée', `
    <div class="form-group" style="margin-bottom:16px">
      <label>Sélectionner l'oiseau</label>
      <select id="lier-oiseau-select" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px">
        <option value="">— Choisir —</option>
        ${oiseaux.map(o => `<option value="${o.id}">${o.nom}${o.bague?' ('+o.bague+')':''}</option>`).join('')}
      </select>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="lierPoussin(${nicheeId})">Lier</button>
    </div>
  `);
}

async function lierPoussin(nicheeId) {
  const id = document.getElementById('lier-oiseau-select').value;
  if (!id) return App.toast('Sélectionnez un oiseau', 'error');
  try {
    await App.api('POST', `/api/nichees/${nicheeId}/poussins`, { oiseau_id: parseInt(id) });
    App.toast('Poussin lié !');
    App.closeModal();
    App.navigate(`nichees/${nicheeId}`);
  } catch (err) {
    App.toast(err.message, 'error');
  }
}

// ── Créer & lier un poussin ─────────────────────────
function showCreerPoussin(nicheeId, pereId, mereId) {
  App.openModal('Créer un poussin', `
    <form id="poussin-form">
      <div class="form-grid">
        <div class="form-section-title">Identité du poussin</div>
        <div class="form-group">
          <label>Nom *</label>
          <input type="text" name="nom" required placeholder="Nom du poussin">
        </div>
        <div class="form-group">
          <label>Bague</label>
          <input type="text" name="bague" placeholder="Numéro de bague">
        </div>
        <div class="form-group">
          <label>Sexe</label>
          <select name="sexe">
            <option value="inconnu">? Indéterminé</option>
            <option value="male">♂ Mâle</option>
            <option value="femelle">♀ Femelle</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date de naissance</label>
          <input type="date" name="date_naissance">
        </div>
        <div class="form-group full">
          <label>Mutation</label>
          <input type="text" name="mutation" placeholder="Mutation estimée">
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
        <button type="submit" class="btn btn-primary">Créer et lier</button>
      </div>
    </form>
  `);

  document.getElementById('poussin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd   = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.pere_id = pereId;
    data.mere_id = mereId;
    if (!data.date_naissance) data.date_naissance = null;

    try {
      const res = await App.api('POST', '/api/oiseaux', data);
      await App.api('POST', `/api/nichees/${nicheeId}/poussins`, { oiseau_id: res.id });
      App.toast('Poussin créé et lié !');
      App.closeModal();
      App.navigate(`nichees/${nicheeId}`);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });
}

// ── Délier poussin ──────────────────────────────────
function delierPoussin(nicheeId, oiseauId, nom) {
  App.confirmDanger(`Délier <strong>${nom}</strong> de cette nichée ? (l'oiseau ne sera pas supprimé)`, async () => {
    try {
      await App.api('DELETE', `/api/nichees/${nicheeId}/poussins/${oiseauId}`);
      App.toast('Poussin délié.');
      App.navigate(`nichees/${nicheeId}`);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });
}

// ── Delete nichée ───────────────────────────────────
function deleteNichee(id) {
  App.confirmDanger('Supprimer cette nichée définitivement ?', async () => {
    try {
      await App.api('DELETE', `/api/nichees/${id}`);
      App.toast('Nichée supprimée.');
      App.navigate('nichees');
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });
}
