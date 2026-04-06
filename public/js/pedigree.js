/* ═══════════════════════════════════════════════════
   BudgiBook Local — Pedigree
   ═══════════════════════════════════════════════════ */

App.register('pedigree', async (id) => {
  const content = document.getElementById('content');

  if (!id) {
    // Show selector
    const oiseaux = await App.api('GET', '/api/oiseaux');
    content.innerHTML = `
      <div class="page-header"><h1>Pedigree</h1></div>
      <div class="card" style="max-width:480px">
        <div class="card-title">Sélectionner un oiseau</div>
        <div class="form-group" style="margin-bottom:16px">
          <select id="pedigree-select">
            <option value="">— Choisir un oiseau —</option>
            ${oiseaux.map(o => `<option value="${o.id}">${o.nom}${o.bague?' ('+o.bague+')':''} ${App.sexeIcon(o.sexe)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="
          const v = document.getElementById('pedigree-select').value;
          if(v) App.navigate('pedigree/'+v);
          else App.toast('Sélectionnez un oiseau','error')
        ">Afficher le pedigree</button>
      </div>
    `;
    return;
  }

  content.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

  const tree = await App.api('GET', `/api/pedigree/${id}?gen=3`);

  content.innerHTML = `
    <div class="breadcrumb">
      <a href="#pedigree">Pedigree</a> › ${tree.nom}
    </div>
    <div class="page-header">
      <h1>Pedigree — ${tree.nom}</h1>
      <button class="btn btn-secondary" onclick="App.navigate('pedigree')">← Changer d'oiseau</button>
    </div>
    <div class="section-block">
      <div class="pedigree-wrap">
        ${buildPedigreeTable(tree)}
      </div>
    </div>
    <div style="margin-top:12px;font-size:12px;color:var(--text-muted);text-align:center">
      Cliquez sur un nom pour accéder à la fiche de l'oiseau.
    </div>
  `;
});

// ── Build pedigree as HTML table ─────────────────────
function buildPedigreeTable(subject) {
  // subject → père/mère → GP × 4
  const f   = subject;
  const p   = f?.pere   || null;
  const m   = f?.mere   || null;
  const pp  = p?.pere   || null;
  const pm  = p?.mere   || null;
  const mp  = m?.pere   || null;
  const mm  = m?.mere   || null;

  function nodeHtml(bird, isSubject = false) {
    if (!bird) return `<div class="pedigree-node empty">Inconnu</div>`;
    const link  = `href="#oiseaux/${bird.id}"`;
    const photo = bird.photo
      ? `<img src="/uploads/${bird.photo}" class="pedigree-node-photo" alt="">`
      : '';
    return `
      <div class="pedigree-node${isSubject ? ' subject' : ''}">
        ${photo}
        <div class="pedigree-node-name"><a ${link}>${bird.nom}</a></div>
        <div class="pedigree-node-sub">
          ${bird.bague ? bird.bague + '<br>' : ''}
          ${App.sexeIcon(bird.sexe)} ${bird.mutation || ''}
        </div>
      </div>`;
  }

  // Horizontal connector
  const H = `<td><div class="pedigree-line-h"></div></td>`;

  // Vertical connector helper (height in px)
  function V(h) {
    return `<td style="padding:0;width:2px">
      <div style="width:2px;height:${h}px;background:var(--border)"></div>
    </td>`;
  }

  // Simple 3-column table layout
  // Row heights are symmetric: subject spans 4 rows, parents span 2 rows each
  return `
    <table class="pedigree-table" cellspacing="0" cellpadding="0">
      <tr>
        <td rowspan="4">${nodeHtml(f, true)}</td>
        ${H}
        <td style="padding:0;width:2px" rowspan="2"><div style="width:2px;height:100%;min-height:120px;background:var(--border)"></div></td>
        <td style="padding:0 0 0 2px" rowspan="2">${nodeHtml(p)}</td>
        ${H}
        <td style="padding:0;width:2px" rowspan="1"><div style="width:2px;height:100%;min-height:60px;background:var(--border)"></div></td>
        <td style="padding: 0 0 0 2px">${nodeHtml(pp)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 0 2px">${nodeHtml(pm)}</td>
      </tr>
      <tr>
        <td style="padding:0" colspan="2"></td>
        <td style="padding:0;width:2px" rowspan="2"><div style="width:2px;height:100%;min-height:120px;background:var(--border)"></div></td>
        <td style="padding:0 0 0 2px" rowspan="2">${nodeHtml(m)}</td>
        ${H}
        <td style="padding:0;width:2px" rowspan="1"><div style="width:2px;height:100%;min-height:60px;background:var(--border)"></div></td>
        <td style="padding:0 0 0 2px">${nodeHtml(mp)}</td>
      </tr>
      <tr>
        <td style="padding:0" colspan="2"></td>
        <td style="padding:0 0 0 2px">${nodeHtml(mm)}</td>
      </tr>
    </table>
  `;
}
