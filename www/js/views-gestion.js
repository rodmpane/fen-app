"use strict";
/* ============ Vues : tableau de bord, membres, adhésions, organisation ============ */
const pageH=(eb,t,sub,right='')=>`<div class="page-h"><div><div class="eyebrow">${eb}</div><h2>${t}</h2>${sub?`<div class="muted">${sub}</div>`:''}</div><div>${right}</div></div>`;
const demoNote=()=>'';
const tbl=(heads,rows,empty='Aucun élément.')=>`<div class="tw"><table class="t"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${heads.length}" class="muted">${empty}</td></tr>`}</tbody></table></div>`;
const bars=(items)=>{const mx=Math.max(1,...items.map(i=>i[1]));return items.map(([l,n])=>`<div class="bar"><span title="${esc(l)}">${esc(l)}</span><i style="width:${Math.round(n/mx*100)}%;max-width:55%"></i><em>${n}</em></div>`).join('')||'<div class="muted">Aucune donnée.</div>'};
const stP=s=>`<span class="pill ${s==='Actif'||s==='Approuvé'||s==='Transmis'||s==='Validé'?'ok':s==='Rejeté'||s==='Inactif'?'bad':'warn'}">${esc(s)}</span>`;
const myMembers=()=>DB.members.filter(inScope);
const myReqs=()=>DB.requests.filter(r=>['admin','president','sg','coord_nat'].includes(ME.role)||r.coord===ME.coord);

VIEWS.dash=()=>{
  const ms=myMembers(),act=ms.filter(m=>m.status==='Actif').length;
  let h=pageH('Vue d’ensemble',`Bienvenue, ${esc(ME.name)}`,'Gérez les membres, les provinces, les coordinations et les zones de la F.E.N depuis votre tableau de bord.');
  if(ME.role==='autre'){return h+`<div class="card"><h3>Votre compte est créé</h3><p class="muted">Vous voyez ici le tableau de bord. Quand votre demande d’adhésion sera validée, vous pourrez consulter les activités de la zone choisie.</p></div>`}
  h+=demoNote();
  const pend=acc('demandes')!=='-'?myReqs().filter(r=>r.status==='En attente').length:null;
  h+=`<div class="cards"><div class="card stat"><b>${ms.length}</b><span>Membres</span></div><div class="card stat"><b>${act}</b><span>Membres actifs</span></div><div class="card stat"><b>${ms.length-act}</b><span>Membres non actifs</span></div>${pend!==null?`<div class="card stat"><b>${pend}</b><span>Demandes en attente</span></div>`:''}</div>`;
  const cnt=(key,list)=>list.map(x=>[x.name,ms.filter(m=>m[key]===x.id).length]).filter(a=>a[1]>0);
  const f=ms.filter(m=>m.sex==='F').length;
  h+=`<div class="two"><div class="card"><h3>Membres par province</h3>${bars(cnt('prov',DB.provinces))}</div>
  <div class="card"><h3>Membres par coordination</h3>${bars(cnt('coord',DB.coordinations))}</div>
  <div class="card"><h3>Membres par zone</h3>${bars(cnt('zone',DB.zones))}</div>
  <div class="card"><h3>Répartition par sexe</h3>${bars([['Hommes',ms.length-f],['Femmes',f]])}</div></div>`;
  h+=`<div class="two"><div class="card tree"><h3 style="margin-bottom:8px">Hiérarchie F.E.N</h3>${hierarchy()}</div>
  <div class="card"><h3 style="margin-bottom:10px">Responsables de la F.E.N</h3>${DB.resp.map(r=>`<div class="person" style="margin-bottom:10px"><div class="avatar">${esc(r.r[0])}</div><div><b>${esc(r.r)}</b><div class="muted">${esc(r.n)}</div></div></div>`).join('')}</div></div>`;
  return h};
function hierarchy(){return `<ul><li><b>Fondation Ézéchiel NTAL</b><ul>${DB.provinces.map(p=>{const cs=DB.coordinations.filter(c=>c.prov===p.id&&coordInScope(c));return cs.length||['admin','president','sg','coord_nat'].includes(ME.role)?`<li><b>${esc(p.name)}</b><ul>${cs.map(c=>`<li>${esc(c.name)}<ul>${DB.zones.filter(z=>z.coord===c.id&&zoneInScope(z)).map(z=>`<li>${esc(z.name)} <span class="muted">· ${DB.cells.filter(x=>x.zone===z.id).length} cellules</span></li>`).join('')}</ul></li>`).join('')}</ul></li>`:''}).join('')}</ul></li></ul>`}

/* ---- Membres ---- */
let QM='';
const canW=m=>['F','S'].includes(acc(m));
function memberRows(list){return list.map(m=>`<tr><td>${esc(m.mat)}</td><td><b>${esc(m.name)}</b></td><td>${esc(m.phone)}</td><td>${esc(nameOf('provinces',m.prov))}</td><td>${esc(nameOf('coordinations',m.coord))}</td><td>${esc(nameOf('zones',m.zone))} · ${esc(nameOf('cells',m.cell))}</td><td>${stP(m.status)}</td>
 <td><div class="acts"><button class="btn sm" data-card="${m.id}">Carte PDF</button>${canW('membres')?`<button class="btn sm" data-edit="${m.id}">Modifier</button><button class="btn sm danger" data-del="${m.id}">Supprimer</button>`:''}</div></td></tr>`)}
VIEWS.membres=()=>pageH('Gestion','Membres','Gérez les membres de la Fondation Ézéchiel NTAL.',canW('membres')?`<button class="btn primary" id="addM">Ajouter un membre</button>`:'')
 +`<div class="tool"><input id="qm" type="search" placeholder="Rechercher par nom ou numéro de téléphone" value="${esc(QM)}" aria-label="Rechercher un membre"></div><div id="mList"></div>`;
function drawMembers(){const q=QM.toLowerCase().replace(/\s/g,'');const l=myMembers().filter(m=>!q||m.name.toLowerCase().replace(/\s/g,'').includes(q)||m.phone.replace(/\s/g,'').includes(q));
  $('#mList').innerHTML=tbl(['Matricule','Membre','Téléphone','Province','Coordination','Zone · Cellule','Statut','Actions'],memberRows(l),'Aucun membre trouvé.');wireMemberActs($('#mList'),drawMembers)}
WIRE.membres=()=>{$('#qm').oninput=e=>{QM=e.target.value;drawMembers()};const a=$('#addM');if(a)a.onclick=()=>memberForm();drawMembers()};
function wireMemberActs(root,redraw){
  root.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>cardDialog(b.dataset.card));
  root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>memberForm(b.dataset.edit,redraw));
  root.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const m=DB.members.find(x=>x.id===b.dataset.del);
    dialog(`<h3>Supprimer ce membre ?</h3><p>${esc(m.name)} (${esc(m.mat)}) sera retiré de la liste.</p><div class="row"><button class="btn" data-close>Annuler</button><button class="btn danger" id="okDel">Supprimer</button></div>`,r=>{r.querySelector('#okDel').onclick=()=>{DB.members=DB.members.filter(x=>x.id!==m.id);save();$('#dlg').close();toast('Membre supprimé.');redraw()}})})}
function memberForm(id,redraw,fixed){
  const m=id?DB.members.find(x=>x.id===id):null;
  dialog(`<h3>${m?'Modifier le membre':'Ajouter un membre'}</h3><form id="fM"><div class="field"><label for="an">Nom complet</label><input id="an" required value="${esc(m?.name)}"></div>
  <div class="grid2"><div class="field"><label for="aph">Téléphone</label><input id="aph" inputmode="tel" required value="${esc(m?.phone)}"></div>
  <div class="field"><label for="ase">Sexe</label><select id="ase"><option value="M"${m?.sex==='M'?' selected':''}>Homme</option><option value="F"${m?.sex==='F'?' selected':''}>Femme</option></select></div></div>
  <div class="grid2"><div class="field"><label for="afo">Fonction</label><input id="afo" list="fonctions" value="${esc(m?.fonction||'Membre')}"><datalist id="fonctions"><option>Membre</option><option>Président de cellule</option><option>Président de zone</option><option>Coordonnateur</option><option>Secrétaire</option><option>Trésorier</option></datalist></div>
  <div class="field"><label for="aph2">Photo</label><input id="aph2" type="file" accept="image/*"><div id="phprev"></div></div></div>
  ${geoFields('a',true)}<div class="field"><label for="ast">Statut</label><select id="ast"><option${m?.status==='Inactif'?'':' selected'}>Actif</option><option${m?.status==='Inactif'?' selected':''}>Inactif</option></select></div>
  <div class="row"><button type="button" class="btn" data-close>Annuler</button><button class="btn primary">Enregistrer</button></div></form>`,r=>{
    wireGeo('a',r);let photoData=m&&m.photo||'';const pv=r.querySelector('#phprev');const showP=()=>{pv.innerHTML=photoData?`<img src="${photoData}" alt="Photo du membre" style="width:72px;height:72px;object-fit:cover;border-radius:8px;margin-top:6px">`:''};showP();
    r.querySelector('#aph2').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{photoData=await readPhoto(f);showP()}catch(x){toast('Photo illisible. Essayez une autre image.')}};
    const set=(k,v)=>{const el=r.querySelector('#a'+k);el.value=v;el.onchange&&el.onchange()};
    const pre=m?{prov:m.prov,coord:m.coord,zone:m.zone,cell:m.cell}:(ME.role==='coord_prov'?{prov:ME.prov||(DB.coordinations.find(c=>c.id===ME.coord)||{}).prov,coord:ME.coord}:ME.role==='pres_zone'?{prov:ME.prov,coord:ME.coord,zone:ME.zone}:fixed||{});
    ['prov','coord','zone','cell'].forEach(k=>{if(pre[k])set(k,pre[k])});
    if(!m){if(ME.role==='coord_prov'){r.querySelector('#aprov').disabled=true;r.querySelector('#acoord').disabled=true}
      if(ME.role==='pres_zone'||fixed&&fixed.zone){['prov','coord','zone'].forEach(k=>r.querySelector('#a'+k).disabled=true)}}
    r.querySelector('#fM').onsubmit=e=>{e.preventDefault();const v=k=>r.querySelector('#a'+k).value;if(!v('cell')){toast('Choisissez la province, la coordination, la zone et la cellule.');return}
      const o={name:v('n').trim(),phone:v('ph').trim(),sex:v('se'),prov:v('prov'),coord:v('coord'),zone:v('zone'),cell:v('cell'),status:v('st'),fonction:v('fo').trim()||'Membre',photo:photoData};
      if(m)Object.assign(m,o);else{DB.members.push({id:uid('m'),mat:nextMat(),...o})}
      save();$('#dlg').close();toast(m?'Membre modifié.':'Membre ajouté.');(redraw||(()=>go(CUR)))()}})}
function cardHTML(m){const qr=qrPng(m.mat);return `<div class="mc"><div class="mc-h"><img class="mc-logo" src="${LOGO_I}" alt=""><b>FONDATION ÉZÉCHIEL NTAL</b><span>F.E.N ASBL</span></div><div class="mc-t">CARTE DE MEMBRE</div><div class="mc-b"><div class="mc-ph">${m.photo?`<img src="${m.photo}" alt="Photo de ${esc(m.name)}">`:'PHOTO'}</div><div class="mc-i"><small>NOM COMPLET</small><p>${esc(m.name.toUpperCase())}</p><small>MATRICULE</small><p>${esc(m.mat)}</p><small>FONCTION</small><p>${esc(m.fonction||'Membre')}</p></div><div class="mc-q">${qr?`<img src="${qr}" alt="QR code ${esc(m.mat)}">`:''}<span>Scanner pour vérifier</span><span>${esc(m.mat)}</span></div></div><div class="mc-f">Carte officielle de la Fondation Ézéchiel NTAL</div></div>`}
function cardDialog(id){const m=DB.members.find(x=>x.id===id);
  dialog(`<h3>Carte de membre</h3>${cardHTML(m)}<div class="row"><button class="btn" data-close>Fermer</button><button class="btn primary" id="cpdf">Télécharger en PDF</button></div><p class="muted" style="font-size:12px">Pour imprimer, ouvrez le PDF téléchargé et lancez l’impression depuis votre lecteur PDF.</p>`,r=>{r.querySelector('#cpdf').onclick=()=>cardPdf(m)})}

/* ---- Demandes d'adhésion ---- */
let QR='';
VIEWS.demandes=()=>{const l=myReqs();const c=s=>l.filter(r=>r.status===s).length;
  return pageH('Gestion','Demandes d’adhésion','Fondation Ézéchiel NTAL — Gestion des candidatures')+(canW('demandes')?'':`<div class="notice">Vous voyez ces demandes en lecture seule.</div>`)
  +`<div class="cards"><div class="card stat"><b>${l.length}</b><span>Total des demandes</span></div><div class="card stat"><b>${c('En attente')}</b><span>En attente</span></div><div class="card stat"><b>${c('Approuvé')}</b><span>Approuvées</span></div><div class="card stat"><b>${c('Rejeté')}</b><span>Rejetées</span></div></div>
  <div class="tool"><input id="qr" type="search" placeholder="Rechercher par nom, téléphone ou e-mail" value="${esc(QR)}" aria-label="Rechercher une demande"></div><div id="rList"></div>`};
function drawReqs(){const q=QR.toLowerCase();const l=myReqs().filter(r=>!q||(r.name+r.phone+r.mail).toLowerCase().includes(q));
  $('#rList').innerHTML=tbl(['Candidat','Téléphone','Coordination','Zone','Date','Statut','Actions'],l.map(r=>`<tr><td><b>${esc(r.name)}</b><div class="muted" style="font-size:12px">${esc(r.mail)}</div></td><td>${esc(r.phone)}</td><td>${esc(nameOf('coordinations',r.coord))}</td><td>${esc(nameOf('zones',r.zone))}</td><td>${fmtD(r.date)}</td><td>${stP(r.status)}</td>
  <td>${canW('demandes')&&r.status==='En attente'?`<div class="acts"><button class="btn sm primary" data-ok="${r.id}">Approuver</button><button class="btn sm danger" data-no="${r.id}">Rejeter</button></div>`:'<span class="muted">—</span>'}</td></tr>`),'Aucune demande.');
  $('#rList').querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{const r=DB.requests.find(x=>x.id===b.dataset.ok);r.status='Approuvé';
    const z=DB.zones.find(x=>x.id===r.zone),co=DB.coordinations.find(x=>x.id===r.coord),cell=DB.cells.find(x=>x.zone===r.zone);
    DB.members.push({id:uid('m'),mat:nextMat(),fonction:'Membre',photo:'',name:r.name,phone:r.phone,sex:'M',prov:co.prov,coord:co.id,zone:z.id,cell:cell?cell.id:'',status:'Actif'});save();toast('Demande approuvée, membre ajouté. Complétez sa fiche si besoin.');drawReqs()});
  $('#rList').querySelectorAll('[data-no]').forEach(b=>b.onclick=()=>{DB.requests.find(x=>x.id===b.dataset.no).status='Rejeté';save();toast('Demande rejetée.');drawReqs()})}
WIRE.demandes=()=>{$('#qr').oninput=e=>{QR=e.target.value;drawReqs()};drawReqs()};

/* ---- Organisation ---- */
VIEWS.provinces=()=>pageH('Organisation','Provinces','Provinces couvertes par la F.E.N.')+demoNote()+tbl(['Province','Coordinations','Zones','Membres'],DB.provinces.map(p=>{const cs=DB.coordinations.filter(c=>c.prov===p.id&&coordInScope(c));return `<tr><td><b>${esc(p.name)}</b></td><td>${cs.length}</td><td>${DB.zones.filter(z=>cs.some(c=>c.id===z.coord)).length}</td><td>${DB.members.filter(m=>m.prov===p.id&&inScope(m)).length}</td></tr>`}));
VIEWS.coordinations=()=>pageH('Organisation','Coordinations','Coordinations de la F.E.N.')+demoNote()+DB.coordinations.filter(coordInScope).map(c=>`<div class="card" style="margin-bottom:14px"><div class="person" style="margin-bottom:12px"><div class="avatar">${esc(c.name[0])}</div><div><h3>${esc(c.name)}</h3><div class="muted">${esc(c.head||'à renseigner')} · ${esc(nameOf('provinces',c.prov))}</div></div></div>
  ${tbl(['Zone','Président de zone','Cellules','Membres'],DB.zones.filter(z=>z.coord===c.id).map(z=>`<tr><td><b>${esc(z.name)}</b></td><td>${esc(z.president||'à renseigner')}</td><td>${DB.cells.filter(x=>x.zone===z.id).length}</td><td>${DB.members.filter(m=>m.zone===z.id).length}</td></tr>`))}</div>`).join('');
VIEWS.zones=()=>{const zs=DB.zones.filter(z=>zoneInScope(z));
  return pageH('Organisation','Zones','Président, cellules, activités et membres de chaque zone.')+demoNote()+zs.map(z=>{
  const cells=DB.cells.filter(c=>c.zone===z.id).filter(c=>ME.role!=='pres_cellule'&&ME.role!=='membre'||c.id===ME.cell);
  const addOk=canW('zones')&&ME.role!=='membre'&&ME.role!=='pres_cellule';
  return `<section class="card" style="margin-bottom:16px"><div class="page-h" style="margin-bottom:10px"><div><h3>Zone ${esc(z.name)}</h3><div class="muted">Président de zone : ${esc(z.president||'à renseigner')} · ${esc(nameOf('coordinations',z.coord))}</div></div>${addOk&&['F','S'].includes(acc('membres'))?`<button class="btn primary sm" data-addz="${z.id}">Ajouter un membre</button>`:''}</div>
  ${cells.map(c=>{const ms=DB.members.filter(m=>m.cell===c.id);const as=DB.acts.filter(a=>a.cell===c.id);
   return `<div style="margin:14px 0 6px"><b>${esc(c.name)}</b> <span class="muted">· Président : ${esc(c.president||'à renseigner')} · ${ms.length} membres</span></div>
   ${as.length?`<div class="muted" style="font-size:13px;margin-bottom:6px">Activités : ${as.map(a=>esc(a.title)+' ('+fmtD(a.date)+')').join(' · ')}</div>`:''}
   ${ME.role==='membre'?'':tbl(['Matricule','Membre','Téléphone','Statut','Carte'],ms.map(m=>`<tr><td>${esc(m.mat)}</td><td>${esc(m.name)}</td><td>${esc(m.phone)}</td><td>${stP(m.status)}</td><td><button class="btn sm" data-card="${m.id}">Carte PDF</button></td></tr>`))}`}).join('')}</section>`}).join('')};
WIRE.zones=()=>{const v=$('#view');v.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>cardDialog(b.dataset.card));
  v.querySelectorAll('[data-addz]').forEach(b=>b.onclick=()=>{const z=DB.zones.find(x=>x.id===b.dataset.addz),co=DB.coordinations.find(x=>x.id===z.coord);memberForm(null,null,{prov:co.prov,coord:co.id,zone:z.id})})};
VIEWS.cnat=()=>pageH('Organisation','Coordination nationale','Coordonnateurs nationaux, activités nationales et répartition par province.')+demoNote()
 +`<div class="two"><div class="card"><h3 style="margin-bottom:10px">Coordonnateurs nationaux</h3>${DB.users.filter(u=>u.role==='coord_nat').map(u=>`<div class="person" style="margin-bottom:8px"><div class="avatar">${esc(u.name[0])}</div><div><b>${esc(u.name)}</b><div class="muted">${esc(u.login)}</div></div></div>`).join('')||'<span class="muted">Aucun.</span>'}</div>
 <div class="card"><h3>Membres par province</h3>${bars(DB.provinces.map(p=>[p.name,DB.members.filter(m=>m.prov===p.id).length]))}</div></div>
 <div class="card"><h3 style="margin-bottom:8px">Activités nationales</h3>${tbl(['Activité','Date'],DB.acts.map(a=>`<tr><td>${esc(a.title)}</td><td>${fmtD(a.date)}</td></tr>`))}</div>`;
VIEWS.cprov=()=>pageH('Organisation','Coordinations provinciales','Coordonnateurs provinciaux, activités par zone et par cellule.')+demoNote()
 +DB.coordinations.map(c=>`<div class="card" style="margin-bottom:14px"><h3>${esc(c.name)}</h3><div class="muted" style="margin-bottom:8px">${esc(c.head||'à renseigner')} · ${esc(nameOf('provinces',c.prov))}</div>${tbl(['Zone','Cellule','Activité','Date'],DB.acts.filter(a=>{const ce=DB.cells.find(x=>x.id===a.cell);return ce&&DB.zones.find(z=>z.id===ce.zone).coord===c.id}).map(a=>{const ce=DB.cells.find(x=>x.id===a.cell);return `<tr><td>${esc(nameOf('zones',ce.zone))}</td><td>${esc(ce.name)}</td><td>${esc(a.title)}</td><td>${fmtD(a.date)}</td></tr>`}),'Aucune activité enregistrée.')}</div>`).join('');
VIEWS.structures=()=>pageH('Organisation','Structures','Toutes les structures : nationale, provinciales, zones et cellules.')+`<div class="card tree">${hierarchy()}</div>`;
