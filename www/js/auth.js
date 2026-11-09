"use strict";
/* ============ Connexion, compte, adhésion, navigation ============ */
const opts=(arr,sel,ph)=>(ph?`<option value="">${ph}</option>`:'')+arr.map(x=>`<option value="${esc(x.id)}"${x.id===sel?' selected':''}>${esc(x.name)}</option>`).join('');
function geoFields(p,withCell){return `
 <div class="grid2">
  <div class="field"><label for="${p}prov">Province</label><select id="${p}prov">${opts(DB.provinces,'','Choisir…')}</select></div>
  <div class="field"><label for="${p}coord">Coordination</label><select id="${p}coord"><option value="">Choisir…</option></select></div>
  <div class="field"><label for="${p}zone">Zone</label><select id="${p}zone"><option value="">Choisir…</option></select></div>
  ${withCell?`<div class="field"><label for="${p}cell">Cellule</label><select id="${p}cell"><option value="">Choisir…</option></select></div>`:''}
 </div>`}
function wireGeo(p,root=document){
  const g=s=>root.querySelector('#'+p+s);if(!g('prov'))return;
  const fill=(el,list,ph)=>{if(el)el.innerHTML=opts(list,'',ph)};
  g('prov').onchange=()=>{fill(g('coord'),DB.coordinations.filter(c=>c.prov===g('prov').value),'Choisir…');fill(g('zone'),[],'Choisir…');fill(g('cell'),[],'Choisir…')};
  g('coord').onchange=()=>{fill(g('zone'),DB.zones.filter(z=>z.coord===g('coord').value),'Choisir…');fill(g('cell'),[],'Choisir…')};
  g('zone').onchange=()=>fill(g('cell'),DB.cells.filter(c=>c.zone===g('zone').value),'Choisir…');
}
function authView(t,arg){
  document.querySelectorAll('#authTabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===t));
  const b=$('#authBody');
  if(t==='login'){
    b.innerHTML=`<h2 style="font-size:26px;margin-bottom:4px">Bienvenue</h2><p class="muted" style="margin-top:0">Entrez votre adresse e-mail ou votre numéro de téléphone.</p>
    <form id="fLogin" autocomplete="on"><div class="field"><label for="lg">Adresse e-mail ou numéro</label><input id="lg" autocomplete="username" required></div>
    <div class="field"><label for="pw">Mot de passe</label><input id="pw" type="password" autocomplete="current-password"></div><p class="muted" style="font-size:13px;margin:-6px 0 12px">Première connexion ? Entrez votre adresse e-mail, laissez le mot de passe vide et validez : vous choisirez votre mot de passe.</p>
    <div id="lgErr" class="pill bad" style="display:none;margin-bottom:10px"></div>
    <button class="btn primary" style="width:100%;justify-content:center">Se connecter</button></form>
`;
    $('#fLogin').onsubmit=e=>{e.preventDefault();const v=$('#lg').value.trim().toLowerCase(),p=$('#pw').value;
      const cand=DB.users.find(x=>x.login.toLowerCase()===v||(x.phone&&x.phone.replace(/\s/g,'')===v.replace(/\s/g,'')));
      if(cand&&!cand.pass){authView('first',cand);return}
      const u=cand&&cand.pass===p?cand:null;
      if(!u){const e=$('#lgErr');e.textContent='Identifiant ou mot de passe incorrect.';e.style.display='inline-block';return}
      enter(u)};
  }
  if(t==='first'){
    b.innerHTML=`<h2 style="font-size:24px;margin-bottom:4px">Première connexion</h2><p class="muted" style="margin-top:0">${esc(arg.name)} · ${esc(ROLES[arg.role])}<br>Choisissez votre mot de passe.</p>
    <form id="fFirst"><div class="field"><label for="n1">Mot de passe (6 caractères minimum)</label><input id="n1" type="password" minlength="6" autocomplete="new-password" required></div>
    <div class="field"><label for="n2">Confirmer le mot de passe</label><input id="n2" type="password" minlength="6" autocomplete="new-password" required></div>
    <div id="fErr" class="pill bad" style="display:none;margin-bottom:10px"></div><button class="btn primary" style="width:100%;justify-content:center">Enregistrer et entrer</button></form>`;
    $('#fFirst').onsubmit=e=>{e.preventDefault();if($('#n1').value!==$('#n2').value){const x=$('#fErr');x.textContent='Les deux mots de passe sont différents.';x.style.display='inline-block';return}
      arg.pass=$('#n1').value;save();toast('Mot de passe enregistré.');enter(arg)};
  }
  if(t==='signup'){
    b.innerHTML=`<h2 style="font-size:24px;margin-bottom:12px">Créer un compte</h2><form id="fSign">
    <div class="field"><label for="sn">Nom complet</label><input id="sn" required></div>
    <div class="grid2"><div class="field"><label for="sm">Adresse e-mail</label><input id="sm" type="email" required></div>
    <div class="field"><label for="sp">Téléphone</label><input id="sp" inputmode="tel" placeholder="+243…"></div></div>
    <div class="field"><label for="sr">Rôle</label><select id="sr">${SIGNUP_ROLES.map(r=>`<option value="${r}">${ROLES[r]}</option>`).join('')}</select></div>
    <div id="sGeo"></div>
    <div class="field"><label for="sw">Mot de passe (6 caractères minimum)</label><input id="sw" type="password" minlength="6" autocomplete="new-password" required></div>
    <div id="sErr" class="pill bad" style="display:none;margin-bottom:10px"></div>
    <button class="btn primary" style="width:100%;justify-content:center">Créer mon compte</button></form>`;
    const geo=()=>{const r=$('#sr').value;const need=r==='membre'||r==='autre'?'':'x';
      $('#sGeo').innerHTML=r==='coord_nat'?'':geoFields('s',r==='pres_cellule'||r==='membre');wireGeo('s',b)};
    $('#sr').onchange=geo;geo();
    $('#fSign').onsubmit=e=>{e.preventDefault();const E=m=>{const x=$('#sErr');x.textContent=m;x.style.display='inline-block'};
      const login=$('#sm').value.trim().toLowerCase();if(DB.users.some(u=>u.login.toLowerCase()===login))return E('Cette adresse e-mail a déjà un compte.');
      const r=$('#sr').value,g=s=>($('#s'+s)||{}).value||'';
      if(r==='coord_prov'&&!g('coord'))return E('Choisissez votre coordination.');
      if(r==='pres_zone'&&!g('zone'))return E('Choisissez votre zone.');
      if((r==='pres_cellule'||r==='membre')&&!g('cell'))return E('Choisissez votre cellule.');
      const u={id:uid('u'),login,role:r,name:$('#sn').value.trim(),pass:$('#sw').value,phone:$('#sp').value.trim(),prov:g('prov'),coord:g('coord'),zone:g('zone'),cell:g('cell')};
      DB.users.push(u);save();toast('Compte créé. Vous êtes connecté.');enter(u)};
  }
  if(t==='reset'){
    b.innerHTML=`<h2 style="font-size:24px;margin-bottom:4px">Mot de passe oublié</h2><p class="muted" style="margin-top:0">Un code à 6 chiffres est envoyé à votre adresse e-mail.</p>
    <form id="fRes1"><div class="field"><label for="rm">Adresse e-mail</label><input id="rm" type="email" required></div><button class="btn primary">Recevoir le code</button></form>
    <form id="fRes2" hidden style="margin-top:16px"><div class="notice" id="rCode"></div><div class="field"><label for="rc">Code reçu</label><input id="rc" inputmode="numeric" maxlength="6" required></div>
    <div class="field"><label for="rn">Nouveau mot de passe</label><input id="rn" type="password" minlength="6" required></div>
    <div id="rErr" class="pill bad" style="display:none;margin-bottom:10px"></div><button class="btn primary">Changer le mot de passe</button></form>`;
    let code='',u=null;
    $('#fRes1').onsubmit=e=>{e.preventDefault();u=DB.users.find(x=>x.login.toLowerCase()===$('#rm').value.trim().toLowerCase());
      if(!u){toast('Aucun compte avec cette adresse.');return}
      code=String(Math.floor(100000+Math.random()*900000));$('#fRes2').hidden=false;
      $('#rCode').innerHTML=`Prototype : l’envoi d’e-mails n’est pas branché. Le code serait envoyé à <b>${esc(u.login)}</b>. Code de test : <b>${code}</b>`};
    $('#fRes2').onsubmit=e=>{e.preventDefault();if($('#rc').value.trim()!==code){const x=$('#rErr');x.textContent='Code incorrect.';x.style.display='inline-block';return}
      u.pass=$('#rn').value;save();toast('Mot de passe modifié.');authView('login')};
  }
  if(t==='join'){
    b.innerHTML=`<h2 style="font-size:24px;margin-bottom:4px">Demande d’adhésion</h2><p class="muted" style="margin-top:0">Votre demande sera étudiée par la coordination de votre zone.</p>
    <form id="fJoin"><div class="field"><label for="jn">Nom complet</label><input id="jn" required></div>
    <div class="grid2"><div class="field"><label for="jp">Téléphone</label><input id="jp" inputmode="tel" required></div><div class="field"><label for="jm">E-mail</label><input id="jm" type="email"></div></div>
    ${geoFields('j',false)}<button class="btn primary" style="width:100%;justify-content:center">Envoyer ma demande</button></form>`;
    wireGeo('j',b);
    $('#fJoin').onsubmit=e=>{e.preventDefault();const co=$('#jcoord').value,zo=$('#jzone').value;if(!co||!zo){toast('Choisissez la province, la coordination et la zone.');return}
      DB.requests.unshift({id:uid('r'),name:$('#jn').value.trim(),phone:$('#jp').value.trim(),mail:$('#jm').value.trim(),coord:co,zone:zo,date:new Date().toISOString().slice(0,10),status:'En attente'});
      save();toast('Demande envoyée. Merci !');authView('login')};
  }
}
$('#authTabs').addEventListener('click',e=>{const t=e.target.closest('button');if(t)authView(t.dataset.t)});

/* coque */
let CUR='dash';
function enter(u){ME=u;$('#auth').style.display='none';$('#app').classList.add('on');
  $('#who').textContent=u.name;
  let sc=ROLES[u.role];if(u.role==='coord_prov')sc+=' · '+nameOf('coordinations',u.coord);if(u.role==='pres_zone')sc+=' · '+nameOf('zones',u.zone);if(u.role==='pres_cellule'||u.role==='membre')sc+=' · '+nameOf('zones',u.zone)+', '+nameOf('cells',u.cell);
  $('#whoRole').textContent=sc;buildNav();go('dash')}
function buildNav(){let h=`<div class="brand"><div class="plate"><img src="${LOGO_H}" alt="Fondation Ézéchiel NTAL"></div></div>`,g='';
  MENUS.forEach(([id,label,grp])=>{if(acc(id)==='-')return;if(grp!==g){g=grp;if(grp)h+=`<div class="grp">${grp}</div>`}
    h+=`<button class="nav" data-m="${id}">${label}</button>`});
  $('#side').innerHTML=h}
function go(id){CUR=id;document.querySelectorAll('#side .nav').forEach(b=>b.toggleAttribute('aria-current',b.dataset.m===id)||b.removeAttribute('aria-current'));
  document.querySelectorAll('#side .nav').forEach(b=>{if(b.dataset.m===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  $('#side').classList.remove('open');
  const f=VIEWS[id];$('#view').innerHTML=acc(id)==='-'||!f?`<div class="card lock"><h2>Accès refusé</h2><p class="muted">Votre rôle n’a pas accès à ce menu.</p></div>`:f();
  const w=WIRE[id];if(w)w();window.scrollTo(0,0)}
$('#side').addEventListener('click',e=>{const b=e.target.closest('.nav');if(b)go(b.dataset.m)});
$('#burger').onclick=()=>$('#side').classList.toggle('open');
$('#logout').onclick=()=>{ME=null;$('#app').classList.remove('on');$('#auth').style.display='';authView('login')};
$('#themeBtn').onclick=()=>{const r=document.documentElement,dark=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.theme=dark?'light':'dark'};

/* fenêtre de dialogue */
function dialog(html,after){const d=$('#dlg');$('#dlgBody').innerHTML=html;if(!d.open)d.showModal();if(after)after($('#dlgBody'));
  $('#dlgBody').querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>d.close())}
$('#dlg').addEventListener('click',e=>{if(e.target.id==='dlg')e.target.close()});
const VIEWS={},WIRE={};
