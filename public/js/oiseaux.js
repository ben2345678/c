/* ═══════════════════════════════════════════════════
   BudgiBook Local — Mes Oiseaux
   ═══════════════════════════════════════════════════ */

const OI = { filtreStatut: '', filtreSexe: '' };

// ── List ────────────────────────────────────────────
App.register('oiseaux', async (id) => {
  if (id) return renderOiseauDetail(id);

  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

  // Lire les filtres depuis le DOM si déjà affichés
  const s = document.getElementById('fi-statut');
  const x = document.getElementById('fi-sexe');
  if (s) OI.filtreStatut = s.value;
  if (x) OI.filtreSexe   = x.value;

  const params = new URLSearchParams();
  if (OI.filtreStatut) params.set('statut', OI.filtreStatut);
  if (OI.filtreSexe)   params.set('sexe',   OI.filtreSexe);

  const oiseaux = await App.api('GET', '/api/oiseaux?' + params);

  content.innerHTML = `
    <div class="page-header">
      <h1>Mes Oiseaux <span style="font-size:15px;font-weight:400;color:var(--text-secondary)">(${oiseaux.length})</span></h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="showOiseauForm()">+ Ajouter un oiseau</button>
      </div>
    </div>

    <div class="filters">
      <select id="fi-statut" onchange="OI.filtreStatut=this.value;App.navigate('oiseaux')">
        <option value="" ${!OI.filtreStatut?'selected':''}>Tous les statuts</option>
        <option value="actif"   ${OI.filtreStatut==='actif'  ?'selected':''}>Actif</option>
        <option value="vendu"   ${OI.filtreStatut==='vendu'  ?'selected':''}>Vendu</option>
        <option value="donne"   ${OI.filtreStatut==='donne'  ?'selected':''}>Donné</option>
        <option value="decede"  ${OI.filtreStatut==='decede' ?'selected':''}>Décédé</option>
      </select>
      <select id="fi-sexe" onchange="OI.filtreSexe=this.value;App.navigate('oiseaux')">
        <option value="" ${!OI.filtreSexe?'selected':''}>Tous les sexes</option>
        <option value="male"    ${OI.filtreSexe==='male'   ?'selected':''}>♂ Mâle</option>
        <option value="femelle" ${OI.filtreSexe==='femelle'?'selected':''}>♀ Femelle</option>
        <option value="inconnu" ${OI.filtreSexe==='inconnu'?'selected':''}>? Indéterminé</option>
      </select>
    </div>

    ${oiseaux.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">🐦</div>
           <p>Aucun oiseau trouvé.</p>
           <button class="btn btn-primary" onclick="showOiseauForm()">Ajouter mon premier oiseau</button>
         </div>`
      : `<div class="table-wrap">
           <table class="data-table">
             <thead><tr>
               <th>Photo</th><th>Nom</th><th>Bague</th><th>Sexe</th>
               <th>Mutation</th><th>Naissance</th><th>Statut</th><th></th>
             </tr></thead>
             <tbody>
               ${oiseaux.map(o => `
                 <tr class="clickable" onclick="App.navigate('oiseaux/${o.id}')">
                   <td>${App.birdPhoto(o.photo, o.sexe)}</td>
                   <td><strong>${o.nom}</strong></td>
                   <td>${o.bague || '—'}</td>
                   <td>${App.sexeBadge(o.sexe)}</td>
                   <td>${o.mutation || '—'}</td>
                   <td>${App.formatDate(o.date_naissance)}</td>
                   <td>${App.statutBadge(o.statut)}</td>
                   <td onclick="event.stopPropagation()">
                     <div class="actions-cell">
                       <button class="btn-icon" onclick="showOiseauForm(${o.id})" title="Modifier">✏️</button>
                       <button class="btn-icon danger" onclick="deleteOiseau(${o.id},'${o.nom.replace(/'/g,"\\'")}')" title="Supprimer">🗑️</button>
                     </div>
                   </td>
                 </tr>
               `).join('')}
             </tbody>
           </table>
         </div>`
    }
  `;
});

// ── Detail ──────────────────────────────────────────
async function renderOiseauDetail(id) {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

  const o = await App.api('GET', `/api/oiseaux/${id}`);

  content.innerHTML = `
    <div class="breadcrumb">
      <a href="#oiseaux">Mes Oiseaux</a> › ${o.nom}
    </div>

    <div class="page-header">
      <div class="detail-name">
        <h1>${o.nom}</h1>
        ${App.sexeBadge(o.sexe)}
        ${App.statutBadge(o.statut)}
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="App.navigate('pedigree/${o.id}')">🌳 Pedigree</button>
        <button class="btn btn-secondary" onclick="showOiseauForm(${o.id})">✏️ Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="deleteOiseau(${o.id},'${o.nom.replace(/'/g,"\\'")}')" style="margin-left:4px">🗑️</button>
      </div>
    </div>

    <div class="detail-layout">

      <!-- Photo -->
      <div class="detail-photo-col">
        ${o.photo
          ? `<img src="/uploads/${o.photo}" class="detail-photo" alt="${o.nom}">`
          : `<div class="detail-photo-placeholder">${App.sexeIcon(o.sexe)}</div>`
        }
        <label class="btn btn-secondary" style="justify-content:center;cursor:pointer">
          📷 ${o.photo ? 'Changer la photo' : 'Ajouter une photo'}
          <input type="file" accept="image/*" style="display:none" onchange="uploadPhoto(${o.id},this)">
        </label>
      </div>

      <!-- Infos -->
      <div>

        <div class="section-block">
          <div class="section-block-title">Informations</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Bague</div>
              <div class="info-value">${o.bague || '—'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de naissance</div>
              <div class="info-value">${App.formatDate(o.date_naissance)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Mutation / Couleur</div>
              <div class="info-value">${o.mutation || '—'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Génétique portée</div>
              <div class="info-value">${o.genetique_portee || '—'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Père</div>
              <div class="info-value">
                ${o.pere_id
                  ? `<a href="#oiseaux/${o.pere_id}">${o.pere_nom}${o.pere_bague?' ('+o.pere_bague+')':''}</a>`
                  : '—'}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Mère</div>
              <div class="info-value">
                ${o.mere_id
                  ? `<a href="#oiseaux/${o.mere_id}">${o.mere_nom}${o.mere_bague?' ('+o.mere_bague+')':''}</a>`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        ${(o.statut === 'vendu' || o.statut === 'donne') ? `
          <div class="section-block">
            <div class="section-block-title">${o.statut === 'vendu' ? 'Vente' : 'Don'}</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Destinataire</div>
                <div class="info-value">${o.destinataire || '—'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${App.formatDate(o.date_transfert)}</div>
              </div>
            </div>
          </div>
        ` : ''}

        ${o.notes_sante ? `
          <div class="section-block">
            <div class="section-block-title">Santé</div>
            <p style="white-space:pre-wrap;color:var(--text)">${o.notes_sante}</p>
          </div>
        ` : ''}

        ${o.notes ? `
          <div class="section-block">
            <div class="section-block-title">Notes</div>
            <p style="white-space:pre-wrap;color:var(--text)">${o.notes}</p>
          </div>
        ` : ''}

        ${o.descendance && o.descendance.length > 0 ? `
          <div class="section-block">
            <div class="section-block-title">Descendance connue (${o.descendance.length})</div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Photo</th><th>Nom</th><th>Bague</th><th>Sexe</th><th>Mutation</th><th>Statut</th></tr></thead>
                <tbody>
                  ${o.descendance.map(p => `
                    <tr class="clickable" onclick="App.navigate('oiseaux/${p.id}')">
                      <td>${App.birdPhoto(p.photo, p.sexe)}</td>
                      <td><strong>${p.nom}</strong></td>
                      <td>${p.bague || '—'}</td>
                      <td>${App.sexeBadge(p.sexe)}</td>
                      <td>${p.mutation || '—'}</td>
                      <td>${App.statutBadge(p.statut)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;
}

// ── Form (add / edit) ───────────────────────────────
async function showOiseauForm(id = null) {
  const [allOiseaux, oiseau] = await Promise.all([
    App.api('GET', '/api/oiseaux'),
    id ? App.api('GET', `/api/oiseaux/${id}`) : Promise.resolve(null)
  ]);

  const o = oiseau || {};
  const males    = allOiseaux.filter(x => x.sexe === 'male'    && x.id !== id);
  const femelles = allOiseaux.filter(x => x.sexe === 'femelle' && x.id !== id);
  const all      = allOiseaux.filter(x => x.id !== id);

  function optPere(list) {
    return `<option value="">— Inconnu —</option>` +
      list.map(x => `<option value="${x.id}" ${o.pere_id==x.id?'selected':''}>${x.nom}${x.bague?' ('+x.bague+')':''}</option>`).join('');
  }
  function optMere(list) {
    return `<option value="">— Inconnue —</option>` +
      list.map(x => `<option value="${x.id}" ${o.mere_id==x.id?'selected':''}>${x.nom}${x.bague?' ('+x.bague+')':''}</option>`).join('');
  }
  // Fallback: si parents n'ont pas de sexe renseigné, afficher tous
  const pereListe    = males.length    > 0 ? males    : all;
  const mereListe    = femelles.length > 0 ? femelles : all;

  App.openModal(id ? 'Modifier un oiseau' : 'Ajouter un oiseau', `
    <form id="oiseau-form">
      <div class="form-grid">

        <div class="form-section-title">Identité</div>

        <div class="form-group">
          <label>Nom *</label>
          <input type="text" name="nom" value="${o.nom||''}" required placeholder="Ex: Sky">
        </div>
        <div class="form-group">
          <label>Numéro de bague</label>
          <input type="text" name="bague" value="${o.bague||''}" placeholder="Ex: 2024-A01">
        </div>
        <div class="form-group">
          <label>Sexe</label>
          <select name="sexe">
            <option value="inconnu" ${(o.sexe||'inconnu')==='inconnu'?'selected':''}>? Indéterminé</option>
            <option value="male"    ${o.sexe==='male'   ?'selected':''}>♂ Mâle</option>
            <option value="femelle" ${o.sexe==='femelle'?'selected':''}>♀ Femelle</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date de naissance</label>
          <input type="date" name="date_naissance" value="${o.date_naissance||''}">
        </div>
        <div class="form-group">
          <label>Mutation / Couleur</label>
          <input type="text" name="mutation" value="${o.mutation||''}" placeholder="Ex: Lutino, Cobalt…">
        </div>
        <div class="form-group">
          <label>Génétique portée</label>
          <input type="text" name="genetique_portee" value="${o.genetique_portee||''}" placeholder="Ex: /ino, /opaline…">
        </div>

        <div class="form-section-title">Filiation</div>

        <div class="form-group">
          <label>Père</label>
          <select name="pere_id">${optPere(pereListe)}</select>
        </div>
        <div class="form-group">
          <label>Mère</label>
          <select name="mere_id">${optMere(mereListe)}</select>
        </div>

        <div class="form-section-title">Statut</div>

        <div class="form-group">
          <label>Statut</label>
          <select name="statut" id="form-statut" onchange="toggleTransfertFields()">
            <option value="actif"  ${(o.statut||'actif')==='actif' ?'selected':''}>Actif</option>
            <option value="vendu"  ${o.statut==='vendu' ?'selected':''}>Vendu</option>
            <option value="donne"  ${o.statut==='donne' ?'selected':''}>Donné</option>
            <option value="decede" ${o.statut==='decede'?'selected':''}>Décédé</option>
          </select>
        </div>
        <div class="form-group" id="field-destinataire" style="${(o.statut==='vendu'||o.statut==='donne')?'':'display:none'}">
          <label>Destinataire</label>
          <input type="text" name="destinataire" value="${o.destinataire||''}" placeholder="Nom du destinataire">
        </div>
        <div class="form-group" id="field-date-transfert" style="${(o.statut==='vendu'||o.statut==='donne')?'':'display:none'}">
          <label>Date du transfert</label>
          <input type="date" name="date_transfert" value="${o.date_transfert||''}">
        </div>

        <div class="form-section-title">Santé & Notes</div>

        <div class="form-group full">
          <label>Santé / Remarques</label>
          <textarea name="notes_sante" placeholder="Traitements, maladies, observations…">${o.notes_sante||''}</textarea>
        </div>
        <div class="form-group full">
          <label>Notes libres</label>
          <textarea name="notes" placeholder="Notes personnelles…">${o.notes||''}</textarea>
        </div>

      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
        <button type="submit" class="btn btn-primary">${id ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `);

  document.getElementById('oiseau-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd   = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    // Nullify empty optional fields
    ['date_naissance','date_transfert','pere_id','mere_id'].forEach(k => {
      if (!data[k]) data[k] = null;
    });

    try {
      if (id) {
        await App.api('PUT', `/api/oiseaux/${id}`, data);
        App.toast('Oiseau mis à jour !');
      } else {
        const res = await App.api('POST', '/api/oiseaux', data);
        App.toast('Oiseau ajouté !');
        App.closeModal();
        App.navigate(`oiseaux/${res.id}`);
        return;
      }
      App.closeModal();
      App.navigate(id ? `oiseaux/${id}` : 'oiseaux');
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });
}

function toggleTransfertFields() {
  const s = document.getElementById('form-statut').value;
  const show = s === 'vendu' || s === 'donne';
  document.getElementById('field-destinataire').style.display     = show ? '' : 'none';
  document.getElementById('field-date-transfert').style.display   = show ? '' : 'none';
}

// ── Delete ──────────────────────────────────────────
function deleteOiseau(id, nom) {
  App.confirmDanger(`Supprimer <strong>${nom}</strong> définitivement ?`, async () => {
    try {
      await App.api('DELETE', `/api/oiseaux/${id}`);
      App.toast('Oiseau supprimé.');
      App.navigate('oiseaux');
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });
}

// ── Photo upload ─────────────────────────────────────
async function uploadPhoto(id, input) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('photo', file);
  try {
    await App.api('POST', `/api/oiseaux/${id}/photo`, fd);
    App.toast('Photo mise à jour !');
    App.navigate(`oiseaux/${id}`);
  } catch (err) {
    App.toast(err.message, 'error');
  }
}
