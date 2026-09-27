/* ============ Hero slides ============ */
const SLIDES = [
  {kind:'Commercial & Janitorial', eyebrow:'Commercial Cleaning • Janitorial • Floor Care',
   title:'Precision cleaning for spaces that need to perform.',
   lead:'Recurring commercial cleaning, specialized floor care and residential services throughout Greater Boston.',
   img:'var(--img-hero)', pos:'center 38%'},
  {kind:'Floor Care', eyebrow:'Floor Care Specialists',
   title:'Floors that reflect your standard.',
   lead:'Polishing, waxing and restoration for high-traffic commercial floors, scheduled around your business, including Sundays.',
   img:'var(--img-floor)', pos:'center 48%'},
  {kind:'Residential', eyebrow:'Residential Cleaning',
   title:'The same precision, brought home.',
   lead:'Standard, deep, move-in and move-out cleaning for homes across Greater Boston, booked in minutes, done right the first time.',
   img:'var(--img-residential)', pos:'center 42%'}
];

/* ============ Services ============ */
const FREQS = {
  daily:{label:'Daily',desc:'A visit every business day. Built for high-traffic facilities, schools and buildings where restrooms and touchpoints cannot wait.'},
  weekly:{label:'Weekly',desc:'A fixed day each week — the most common starting point for offices and commercial buildings.'},
  biweekly:{label:'Bi-weekly',desc:'Every two weeks, for smaller teams or spaces that hold up well between visits.'},
  monthly:{label:'Monthly',desc:'A deeper single visit each month, usually paired with a longer service window.'},
  onetime:{label:'One-time',desc:'A single scheduled job with a defined start and finish. No recurring plan is created.'},
  custom:{label:'Custom',desc:'A maintenance plan built around your facility when a standard frequency does not fit.'}
};

const SERVICES = {
  commercial:{
    name:'Commercial & Janitorial', summary:'Recurring plans for offices, schools and commercial buildings.',
    kind:'Priority focus', img:'var(--img-commercial)', pos:'center 28%',
    alt:'A 4Points team member in uniform flat-mopping the floor of an open-plan office.',
    desc:'Recurring cleaning plans for offices, schools and commercial buildings: daily, weekly, bi-weekly or monthly.',
    incl:['Restrooms & common areas','Break rooms','Trash removal','Touchpoint cleaning','Custom maintenance plans'],
    meta:[['Frequency','Daily · Weekly · Bi-weekly · Monthly'],['Coverage','Greater Boston & Massachusetts'],['Contract','Flexible, no long-term lock-in']],
    cta:'Request Commercial Quote',
    freqs:['daily','weekly','biweekly','monthly','custom'], defaultFreq:'weekly',
    needs:['Restrooms & common areas','Break rooms','Trash removal','Touchpoint cleaning','Custom maintenance plan'],
    planNote:'More visits per week means shorter, lighter rounds. Weekly or bi-weekly visits bundle more into each stop, which suits smaller teams but leaves a longer gap between restroom and break-room service.'
  },
  floor:{
    name:'Floor Care', summary:'Polishing and waxing for high-traffic commercial floors.',
    kind:'Specialized', img:'var(--img-floor)', pos:'center 45%',
    alt:'A 4Points operator running a floor machine along a corridor in an office building.',
    desc:'Premium polishing and waxing for high-traffic commercial floors, including Sunday and after-hours execution.',
    incl:['Polishing','Waxing','Restoration','High-traffic floors','Sunday service'],
    meta:[['Schedule','Sundays & after hours'],['Contract','Recurring or one-time'],['Coverage','Greater Boston & Massachusetts']],
    cta:'Request Floor Care Quote',
    freqs:['monthly','biweekly','onetime','custom'], defaultFreq:'monthly',
    needs:['Polishing','Waxing','Restoration','High-traffic areas','Sunday service'],
    planNote:'Recurring rounds keep a finish alive with lighter treatment between visits. A one-time job is the right call when the floor needs a full restoration before any maintenance cycle starts.'
  },
  residential:{
    name:'Residential', summary:'Standard, deep, move-in and move-out cleaning for homes.',
    kind:'Secondary', img:'var(--img-residential)', pos:'center 40%',
    alt:'A 4Points team member vacuuming the wood floor of a bright living room.',
    desc:'Standard and deep cleaning, plus move-in and move-out service for homes across Greater Boston.',
    incl:['Standard cleaning','Deep cleaning','Move-in','Move-out'],
    meta:[['Coverage','Greater Boston & Massachusetts'],['Contract','Per-visit, no subscription required'],['Impact','Every 5 cleanings fund 1 support cleaning']],
    cta:'Request Home Cleaning',
    freqs:['weekly','biweekly','monthly','onetime'], defaultFreq:'biweekly',
    needs:['Standard cleaning','Deep cleaning','Move-in','Move-out'],
    planNote:'Weekly visits keep upkeep light and fast. Bi-weekly and monthly visits take longer each time, since more accumulates between them. Residential work is priced per visit, with no subscription required.'
  },
  post:{
    name:'Post-Construction', summary:'Cleanup after remodeling or building work.',
    kind:'Specialized', img:'var(--img-post)', pos:'center 40%',
    alt:'A 4Points team member mopping the stone floor of a finished reception area before handover.',
    desc:'Thorough cleanup after remodeling or building, removing heavy dust and residue.',
    incl:['Fine dust removal','Debris & residue cleanup','Surface detailing','Window & frame cleaning'],
    meta:[['Scheduling','One-time, timed to your project close-out'],['Coverage','Greater Boston & Massachusetts'],['Contract','One-time, no recurring plan']],
    cta:'Request Post-Construction',
    freqs:['onetime'], defaultFreq:'onetime',
    needs:['Fine dust removal','Debris & residue cleanup','Surface detailing','Window & frame cleaning'],
    planNote:'This service is scheduled as a one-time job, timed to your project close-out. Large sites are often split across separate days — tell us the handover date and we plan around it.'
  },
  move:{
    name:'Move-In / Move-Out', summary:'Top-to-bottom deep cleaning for a handoff or a fresh arrival.',
    kind:'Residential specialty', img:'var(--img-move)', pos:'center 30%',
    alt:'A 4Points team member wiping down a table surface in a residential room.',
    desc:'A top-to-bottom deep cleaning that prepares your home for a fresh arrival or a smooth handoff to the owner.',
    incl:['Inside ovens','Inside refrigerators','Cabinet & drawer interiors','Floors, baseboards & surfaces'],
    meta:[['Service','One-time deep cleaning'],['Best for','Move-in preparation · Move-out handoff'],['Coverage','Greater Boston & Massachusetts']],
    cta:'Request Move-In / Move-Out',
    freqs:['onetime'], defaultFreq:'onetime',
    needs:['Inside ovens','Inside refrigerators','Cabinet & drawer interiors','Floors, baseboards & surfaces'],
    planNote:'This is a single scheduled visit, not a recurring service. Booking it once the unit is empty lets the crew reach every surface in one pass instead of working around what is left behind.'
  }
};

const ORDER = ['commercial','floor','residential','post','move'];
const state = {service:'commercial', freq:'weekly', needs:[], step:1, data:{}};

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg>';

/* ============ Coreografia de Superficie ============ */
/* Movimento espacial so em desktop, sem reducao de movimento e com IntersectionObserver.
   Fora disso a pagina mostra estados diretos e nada fica oculto. */
const docEl = document.documentElement;
const motionMQ = window.matchMedia('(min-width:921px) and (prefers-reduced-motion: no-preference)');
const motionOK = () => motionMQ.matches && 'IntersectionObserver' in window &&
  docEl.getAttribute('data-art-direction') === 'surface-plane';
function syncMotion(){ docEl.classList.toggle('sp-motion', motionOK()); }
/* Reinicia uma animacao de estado: so roda quando algo realmente mudou. */
function replay(el, cls){
  if(!el || !motionOK()) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
syncMotion();
if(motionMQ.addEventListener) motionMQ.addEventListener('change', syncMotion);
else if(motionMQ.addListener) motionMQ.addListener(syncMotion);

/* ============ Collapse ============ */
function openCollapse(el){
  el.dataset.open = '1';
  if(reduced()){ el.style.height = 'auto'; return; }
  el.style.height = el.scrollHeight + 'px';
  const done = () => { if(el.dataset.open === '1') el.style.height = 'auto'; el.removeEventListener('transitionend', done); };
  el.addEventListener('transitionend', done);
}
function closeCollapse(el){
  el.dataset.open = '0';
  el.style.height = el.scrollHeight + 'px';
  void el.offsetHeight;
  el.style.height = '0px';
}
function toggleCollapse(el, open){ if(el) open ? openCollapse(el) : closeCollapse(el); }

/* ============ Mobile nav ============ */
const navToggle = $('#navToggle'), mobileNav = $('#mobileNav');
const navList = mobileNav.querySelector('.nav-list'), navScrim = $('#navScrim');
/* Capitulo atual: o ultimo alvo do menu cuja caixa contem a linha de leitura
   (fim do cabecalho + 1/3 do resto da tela). #faq vem depois de #coverage e
   esta dentro dela, entao vence na regiao das perguntas. Fora de qualquer
   caixa (hero, #team, #quote, faixa final, rodape) nada fica marcado, mas a
   janela do seletor ainda centraliza o alvo anterior. Antes do primeiro alvo
   (o hero) centraliza o SEGUNDO item: com o primeiro no centro a janela abria
   com um terco vazio em cima. O visual e da camada data-mobile-chrome; sem
   ela, aria-current e scrollTop nao pintam nada. */
function markChapter(){
  if(!navList) return;
  const head = document.querySelector('.site-header').getBoundingClientRect().bottom;
  const probe = head + (window.innerHeight - head) / 3;
  const links = navList.querySelectorAll('a[href^="#"]');
  let cur = null, near = null;
  links.forEach(a => {
    a.removeAttribute('aria-current');
    const t = document.querySelector(a.getAttribute('href'));
    if(!t) return;
    const r = t.getBoundingClientRect();
    if(r.top <= probe){ near = a; if(r.bottom > probe) cur = a; }
  });
  if(cur) cur.setAttribute('aria-current','location');
  const pin = cur || near || links[1];
  navList.scrollTop = pin ? pin.offsetTop - (navList.clientHeight - pin.offsetHeight) / 2 : 0;
}
function closeNav(){
  navToggle.setAttribute('aria-expanded','false');
  $('#navToggleLabel').textContent = 'Menu';
  docEl.classList.remove('nav-open');
  closeCollapse(mobileNav);
}
navToggle.addEventListener('click', () => {
  if(navToggle.getAttribute('aria-expanded') === 'true'){ closeNav(); return; }
  navToggle.setAttribute('aria-expanded','true');
  $('#navToggleLabel').textContent = 'Close';
  markChapter();
  docEl.classList.add('nav-open');
  openCollapse(mobileNav);
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
if(navScrim) navScrim.addEventListener('click', closeNav);
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true'){ closeNav(); navToggle.focus(); }
});

/* ============ Hero carousel ============ */
const heroMedia = $('#heroMedia'), heroCopy = $('#heroCopy'), heroDots = $('#heroDots');
const hero = document.querySelector('.hero'), heroCard = $('.hero__card');
let slide = 0, heroTimer = null, swapTimer = 0;
const HERO_MS = 6500;
/* Motivos para segurar a cena: leitura (hover/foco), aba oculta, hero fora da tela
   ou escolha feita nos dots, quando a pessoa passa a controlar a sequencia. */
const heroHold = new Set();
function holdHero(reason, on){ on ? heroHold.add(reason) : heroHold.delete(reason); }

SLIDES.forEach((s, i) => {
  const layer = document.createElement('div');
  layer.className = 'hero__slide' + (i === 0 ? ' is-on' : '');
  layer.style.setProperty('--photo', s.img);
  layer.style.backgroundPosition = s.pos;
  heroMedia.appendChild(layer);

  const dot = document.createElement('button');
  dot.type = 'button'; dot.className = 'dot'; dot.dataset.slide = i;
  dot.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + s.kind);
  dot.setAttribute('aria-current', String(i === 0));
  heroDots.appendChild(dot);
});
const heroLayers = Array.from(heroMedia.children);

function paintSlide(i){
  const s = SLIDES[i];
  $('#heroEyebrow').textContent = s.eyebrow;
  $('#heroTitle').textContent = s.title;
  $('#heroLead').textContent = s.lead;
  $('#heroCount').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(SLIDES.length).padStart(2, '0');
  $('#heroKind').textContent = s.kind;
  heroLayers.forEach((l, k) => l.classList.toggle('is-on', k === i));
  $$('#heroDots .dot').forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
  alignHeroActions(i);
}

/* A troca calibra uma nova superficie: a imagem se expoe, a mensagem se reorganiza
   e a placa de credenciais confirma a cena sem sair do lugar. */
function calibrateHero(){
  replay(heroLayers[slide], 'is-settling');
  replay(heroCopy, 'is-entering');
  replay(heroCard, 'is-calibrating');
  replay(hero, 'is-calibrating');
}

function goSlide(i){
  slide = (i + SLIDES.length) % SLIDES.length;
  clearTimeout(swapTimer);
  if(reduced()){ paintSlide(slide); return; }
  heroCopy.classList.remove('is-entering');
  heroCopy.classList.add('is-swapping');
  swapTimer = setTimeout(() => {
    paintSlide(slide);
    heroCopy.classList.remove('is-swapping');
    calibrateHero();
  }, motionOK() ? 170 : 200);
}

function chooseSlide(i){
  const n = (i + SLIDES.length) % SLIDES.length;
  holdHero('user', true);
  if(n !== slide) goSlide(n);
}

function startHero(){
  stopHero();
  if(reduced()) return;
  heroTimer = setInterval(() => { if(!heroHold.size) goSlide(slide + 1); }, HERO_MS);
}
function stopHero(){ if(heroTimer){ clearInterval(heroTimer); heroTimer = null; } }

heroDots.addEventListener('click', e => {
  const d = e.target.closest('.dot');
  if(d) chooseSlide(Number(d.dataset.slide));
});
heroDots.addEventListener('keydown', e => {
  let n;
  if(e.key === 'ArrowRight') n = slide + 1;
  else if(e.key === 'ArrowLeft') n = slide - 1;
  else if(e.key === 'Home') n = 0;
  else if(e.key === 'End') n = SLIDES.length - 1;
  else return;
  e.preventDefault();
  chooseSlide(n);
  heroDots.children[slide].focus();
});
/* Pause while the visitor is reading or tabbing through the hero */
hero.addEventListener('mouseenter', () => holdHero('hover', true));
hero.addEventListener('mouseleave', () => holdHero('hover', false));
hero.addEventListener('focusin', () => holdHero('focus', true));
hero.addEventListener('focusout', e => { if(!hero.contains(e.relatedTarget)) holdHero('focus', false); });
document.addEventListener('visibilitychange', () => holdHero('hidden', document.hidden));
if('IntersectionObserver' in window){
  new IntersectionObserver(en => holdHero('view', !en[en.length - 1].isIntersecting)).observe(hero);
}

/* Reserva a altura da cena mais longa: a troca de texto nao desloca CTAs nem o cartao.
   Eyebrow e titulo recebem min-height; a folga da lead vai para a margem dos CTAs,
   para que o filete dourado da lead continue do tamanho do proprio texto. */
const heroText = [$('#heroEyebrow'), $('#heroTitle'), $('#heroLead')];
const heroActions = $('.hero__actions');
const HERO_KEYS = ['eyebrow', 'title', 'lead'];
let leadRoom = [], actionsGap = 0;
function stabiliseHero(){
  const max = [0, 0, 0], leadH = [];
  heroText.forEach(el => { el.style.minHeight = ''; });
  heroActions.style.marginTop = '';
  actionsGap = parseFloat(getComputedStyle(heroActions).marginTop) || 0;
  SLIDES.forEach((s, i) => heroText.forEach((el, k) => {
    el.textContent = s[HERO_KEYS[k]];
    const h = el.offsetHeight;
    max[k] = Math.max(max[k], h);
    if(k === 2) leadH[i] = h;
  }));
  leadRoom = leadH.map(h => max[2] - h);
  heroText.forEach((el, k) => {
    el.textContent = SLIDES[slide][HERO_KEYS[k]];
    if(k < 2) el.style.minHeight = max[k] + 'px';
  });
  alignHeroActions(slide);
}
function alignHeroActions(i){
  if(!leadRoom.length) return;
  heroActions.style.marginTop = (actionsGap + leadRoom[i]) + 'px';
}

paintSlide(0);
stabiliseHero();
if(document.fonts && document.fonts.ready) document.fonts.ready.then(stabiliseHero);
calibrateHero();
startHero();

/* ============ Build rail + accordion ============ */
const rail = $('#rail'), accordion = $('#accordion');
function metaHtml(meta){ return meta.map(m => '<dt>' + m[0] + '</dt><dd>' + m[1] + '</dd>').join(''); }

ORDER.forEach((key, i) => {
  const s = SERVICES[key];
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'rail__opt'; b.dataset.svc = key;
  b.setAttribute('role','radio');
  b.setAttribute('aria-checked', String(i === 0));
  b.tabIndex = i === 0 ? 0 : -1;
  b.innerHTML = '<span class="rail__dot" aria-hidden="true"></span><span>' +
    '<span class="rail__name">' + s.name + '</span>' +
    '<span class="rail__sum">' + s.summary + '</span>' +
    '<span class="rail__state">Selected</span></span>';
  rail.appendChild(b);

  const item = document.createElement('div');
  item.className = 'acc-item';
  item.innerHTML =
    '<h3 class="u-m-0"><button class="acc-btn" type="button" data-svc="' + key + '" aria-expanded="' + (i === 0) + '" aria-controls="acc-' + key + '">' +
      '<span class="rail__dot" aria-hidden="true"></span><span>' +
      '<span class="rail__name">' + s.name + '</span>' +
      '<span class="rail__sum">' + s.summary + '</span>' +
      '<span class="rail__state">Selected</span></span></button></h3>' +
    '<div class="collapse" id="acc-' + key + '" data-collapse><div class="collapse__inner acc-body">' +
      '<div class="acc-photo" role="img" aria-label="' + s.alt + '" style="--photo:' + s.img + ';background-position:' + s.pos + '"></div>' +
      '<p class="u-ink-soft">' + s.desc + '</p>' +
      '<h4 class="label">What\'s included</h4>' +
      '<ul class="checks">' + s.incl.map(x => '<li>' + CHECK + '<span>' + x + '</span></li>').join('') + '</ul>' +
      '<h4 class="label">Details</h4><dl class="meta">' + metaHtml(s.meta) + '</dl>' +
      '<button class="btn btn--petrol js-svc-cta" type="button" data-svc="' + key + '">' + s.cta + '</button>' +
    '</div></div>';
  accordion.appendChild(item);
});

/* ============ Service panel ============ */
const marker = $('#railMarker'), photo = $('#panelPhoto');
let front = $('#layerA'), back = $('#layerB'), firstPaint = true, shownService = null;

function moveMarker(){
  const active = rail.querySelector('.rail__opt[aria-checked="true"]');
  if(!active || !rail.offsetParent){ marker.style.opacity = '0'; return; }
  marker.style.opacity = '1';
  marker.style.height = active.offsetHeight + 'px';
  marker.style.transform = 'translateY(' + active.offsetTop + 'px)';
}

function renderService(key, animate){
  const s = SERVICES[key];
  /* selecionar -> ajustar: o painel so calibra quando o servico realmente muda */
  const calibrate = animate && !firstPaint && key !== shownService;
  shownService = key;

  $$('.rail__opt').forEach(b => {
    const on = b.dataset.svc === key;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  moveMarker();

  $$('.acc-btn').forEach(b => {
    const open = b.dataset.svc === key;
    b.setAttribute('aria-expanded', String(open));
    toggleCollapse(document.getElementById('acc-' + b.dataset.svc), open);
  });

  $('#panelName').textContent = s.name;
  $('#panelDesc').textContent = s.desc;
  $('#panelKind').textContent = s.kind;
  $('#panelMeta').innerHTML = metaHtml(s.meta);
  photo.setAttribute('aria-label', s.alt);
  const cta = $('#panelCta'); cta.textContent = s.cta; cta.dataset.svc = key;
  $('#panelIncl').innerHTML = s.incl.map(x => '<li>' + CHECK + '<span>' + x + '</span></li>').join('');

  if(firstPaint || reduced() || !animate){
    front.style.setProperty('--photo', s.img);
    front.style.backgroundPosition = s.pos;
    front.style.opacity = '1';
    back.style.opacity = '0';
    firstPaint = false;
  } else {
    back.style.setProperty('--photo', s.img);
    back.style.backgroundPosition = s.pos;
    back.style.opacity = '1';
    front.style.opacity = '0';
    const t = front; front = back; back = t;
  }

  $('#planSvc').textContent = s.name;
  $('#planNote').textContent = s.planNote;

  if(calibrate){
    replay($('#panel'), 'is-calibrating');
    replay(front, 'is-settling');
    replay($('#planNote'), 'is-confirmed');
  }
}

/* confirmar: a nota da frequencia recebe a varredura de luz so quando muda */
function setFreqDesc(f){
  const el = $('#freqDesc');
  const changed = el.dataset.freq !== f;
  el.innerHTML = '<strong>' + FREQS[f].label + '.</strong> ' + FREQS[f].desc;
  el.dataset.freq = f;
  if(changed) replay(el, 'is-confirmed');
}

function renderFrequency(){
  const s = SERVICES[state.service];
  if(!s.freqs.includes(state.freq)) state.freq = s.defaultFreq;
  $('#freqRow').innerHTML = s.freqs.map(f =>
    '<button class="chip chip--radio" type="button" role="radio" data-freq="' + f + '" aria-checked="' + (f === state.freq) +
    '" tabindex="' + (f === state.freq ? 0 : -1) + '"><span class="chip__mark" aria-hidden="true"></span>' + FREQS[f].label + '</button>').join('');
  setFreqDesc(state.freq);
  const sel = $('#fFreq');
  sel.innerHTML = s.freqs.map(f => '<option value="' + f + '">' + FREQS[f].label + '</option>').join('');
  sel.value = state.freq;
  $('#fFreqHelp').textContent = FREQS[state.freq].desc;
}

function renderNeeds(){
  const s = SERVICES[state.service];
  state.needs = state.needs.filter(n => s.needs.includes(n));
  const html = s.needs.map(n =>
    '<button class="chip" type="button" data-need="' + esc(n) + '" aria-pressed="' + state.needs.includes(n) +
    '"><span class="chip__mark" aria-hidden="true"></span>' + n + '</button>').join('');
  $('#needRow').innerHTML = html;
  $('#fNeedRow').innerHTML = html;
}

function setService(key, opts){
  opts = opts || {};
  if(!SERVICES[key]) return;
  state.service = key;
  renderService(key, opts.animate !== false);
  renderFrequency();
  renderNeeds();
  $('#fService').value = key;
  syncSummary();
}

function setFreq(f){
  state.freq = f;
  $$('#freqRow .chip').forEach(c => {
    const on = c.dataset.freq === f;
    c.setAttribute('aria-checked', String(on));
    c.tabIndex = on ? 0 : -1;
  });
  setFreqDesc(f);
  $('#fFreq').value = f;
  $('#fFreqHelp').textContent = FREQS[f].desc;
  syncSummary();
}

function toggleNeed(n){
  const i = state.needs.indexOf(n);
  i > -1 ? state.needs.splice(i, 1) : state.needs.push(n);
  $$('[data-need]').forEach(c => { if(c.dataset.need === n) c.setAttribute('aria-pressed', String(i === -1)); });
  syncSummary();
}

/* contratar: cada linha do resumo confirma a escolha com um tick curto */
function setSum(id, text){
  const el = $('#' + id);
  if(el.textContent === text) return;
  el.textContent = text;
  replay(el, 'is-ticked');
}

function syncSummary(){
  setSum('sumService', SERVICES[state.service].name);
  setSum('sumFreq', FREQS[state.freq].label);
  setSum('sumNeeds', state.needs.length ? state.needs.join(', ') : 'None selected');
}

/* ============ Delegated clicks ============ */
document.addEventListener('click', e => {
  const opt = e.target.closest('.rail__opt');
  if(opt){ setService(opt.dataset.svc); return; }

  const accBtn = e.target.closest('.acc-btn');
  if(accBtn){
    if(accBtn.getAttribute('aria-expanded') === 'true'){
      accBtn.setAttribute('aria-expanded','false');
      closeCollapse(document.getElementById('acc-' + accBtn.dataset.svc));
    } else setService(accBtn.dataset.svc);
    return;
  }

  const fq = e.target.closest('[data-freq]');
  if(fq){ setFreq(fq.dataset.freq); return; }

  const nd = e.target.closest('[data-need]');
  if(nd){ toggleNeed(nd.dataset.need); return; }

  const svcCta = e.target.closest('.js-svc-cta');
  if(svcCta){ if(svcCta.dataset.svc) setService(svcCta.dataset.svc); goToQuote(); return; }

  const cta = e.target.closest('.js-cta');
  if(cta){ e.preventDefault(); if(cta.dataset.service) setService(cta.dataset.service); goToQuote(); return; }

  const foot = e.target.closest('.site-footer [data-service]');
  if(foot){ setService(foot.dataset.service); return; }

  const faq = e.target.closest('.faq__btn');
  if(faq){
    const panel = document.getElementById(faq.getAttribute('aria-controls'));
    const open = faq.getAttribute('aria-expanded') === 'true';
    /* Acordeao exclusivo: abrir uma pergunta fecha as outras que estiverem
       abertas. Reclicar na propria pergunta fecha so ela, entao a limpeza roda
       apenas no caminho de abertura. O acordeao de servicos (.acc-btn) e tratado
       antes, em outro ramo, e nao passa por aqui. */
    if(!open){
      $$('.faq__btn[aria-expanded="true"]').forEach(outra => {
        if(outra === faq) return;
        outra.setAttribute('aria-expanded', 'false');
        toggleCollapse(document.getElementById(outra.getAttribute('aria-controls')), false);
      });
    }
    faq.setAttribute('aria-expanded', String(!open));
    toggleCollapse(panel, !open);
  }
});

/* ============ Keyboard: radiogroups ============ */
rail.addEventListener('keydown', e => {
  if(!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key)) return;
  e.preventDefault();
  let i = ORDER.indexOf(state.service);
  if(e.key === 'ArrowDown' || e.key === 'ArrowRight') i = (i + 1) % ORDER.length;
  else if(e.key === 'ArrowUp' || e.key === 'ArrowLeft') i = (i - 1 + ORDER.length) % ORDER.length;
  else if(e.key === 'Home') i = 0; else i = ORDER.length - 1;
  setService(ORDER[i]);
  const b = rail.querySelector('.rail__opt[data-svc="' + ORDER[i] + '"]');
  if(b) b.focus();
});

$('#freqRow').addEventListener('keydown', e => {
  if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) return;
  e.preventDefault();
  const list = SERVICES[state.service].freqs;
  let i = list.indexOf(state.freq);
  i = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
  setFreq(list[i]);
  const b = $('#freqRow .chip[data-freq="' + list[i] + '"]');
  if(b) b.focus();
});

/* ============ Before / after ============ */
const cmp = $('#compare'), cmpRange = $('#cmpRange');
const tagA = cmp.querySelector('.compare__tag--a'), tagB = cmp.querySelector('.compare__tag--b');
let tagEdges = null;
/* Inspecao: a etiqueta do lado encoberto recua para nao rotular a foto errada. */
function readTags(v){
  if(!tagEdges) tagEdges = {a:tagA.offsetLeft + tagA.offsetWidth, b:tagB.offsetLeft};
  const x = v / 100 * cmp.clientWidth;
  cmp.classList.toggle('is-before-covered', x < tagEdges.a);
  cmp.classList.toggle('is-after-covered', x > tagEdges.b);
}
function setCmp(v){
  v = Math.max(0, Math.min(100, v));
  cmp.style.setProperty('--pos', v + '%');
  $('#cmpValue').textContent = Math.round(v);
  cmpRange.value = v;
  readTags(v);
}
function remeasureCmp(){ tagEdges = null; readTags(parseFloat(cmpRange.value)); }
cmpRange.addEventListener('input', () => setCmp(parseFloat(cmpRange.value)));
cmpRange.addEventListener('focus', () => cmp.classList.add('is-focused'));
cmpRange.addEventListener('blur', () => cmp.classList.remove('is-focused'));
let dragging = false;
function dragFrom(e){
  const r = cmp.getBoundingClientRect();
  setCmp(((e.clientX - r.left) / r.width) * 100);
}
function endInspect(){ dragging = false; cmp.classList.remove('is-inspecting'); }
cmp.addEventListener('pointerdown', e => {
  cmp.classList.add('is-inspecting');
  if(e.target === cmpRange) return;
  dragging = true;
  try{ cmp.setPointerCapture(e.pointerId); }catch(err){}
  dragFrom(e);
});
cmp.addEventListener('pointermove', e => { if(dragging) dragFrom(e); });
cmp.addEventListener('pointerup', endInspect);
cmp.addEventListener('pointercancel', endInspect);
setCmp(50);
if(document.fonts && document.fonts.ready) document.fonts.ready.then(remeasureCmp);

/* ============ Quote form ============ */
const form = $('#quoteForm'), TOTAL = 4;

function goToQuote(){
  $('#quote').scrollIntoView({behavior: reduced() ? 'auto' : 'smooth', block:'start'});
  setTimeout(() => { if(state.step === 1) $('#fService').focus({preventScroll:true}); }, reduced() ? 0 : 520);
}

function showStep(n){
  const prev = state.step;
  state.step = n;
  $$('.step').forEach(f => { f.hidden = Number(f.dataset.step) !== n; });
  /* percorrer: a etapa entra pelo lado para onde o percurso avancou */
  if(n !== prev){
    form.dataset.dir = n > prev ? 'fwd' : 'back';
    replay(form.querySelector('.step[data-step="' + n + '"]'), 'is-entering');
  }
  $$('.step-pill').forEach(p => {
    const s = Number(p.dataset.step);
    p.classList.toggle('is-active', s === n);
    p.classList.toggle('is-done', s < n);
  });
  $('#progressBar').style.width = (n / TOTAL * 100) + '%';
  $('#btnBack').hidden = n === 1;
  $('#btnNext').hidden = n === TOTAL;
  $('#btnSubmit').hidden = n !== TOTAL;
  $('#stepCount').textContent = 'Step ' + n + ' of ' + TOTAL;
  setSum('sumStep', n + ' of 4');
  if(n === TOTAL) renderReview();
}

function collect(){
  state.data = {
    service:SERVICES[$('#fService').value].name,
    frequency:FREQS[$('#fFreq').value].label,
    needs:state.needs.length ? state.needs.join(', ') : 'None selected',
    propertyType:$('#fType').value || '—',
    size:$('#fSize').value ? $('#fSize').value + ' sq ft' : '—',
    floors:$('#fFloors').value || 'Not specified',
    access:$('#fAccess').value || 'No preference',
    notes:$('#fNotes').value.trim() || '—',
    name:$('#fName').value.trim(),
    company:$('#fCompany').value.trim() || '—',
    email:$('#fEmail').value.trim(),
    phone:$('#fPhone').value.trim() || '—',
    address:$('#fAddr').value.trim()
  };
  return state.data;
}

function fieldError(wrapId, on){
  const w = $('#' + wrapId);
  w.classList.toggle('has-error', on);
  const input = w.querySelector('input,select,textarea');
  if(input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
  return !on;
}

function validate(n){
  let ok = true, first = null;
  if(n === 2){
    if(!fieldError('wrapType', !$('#fType').value)){ ok = false; first = first || $('#fType'); }
    const size = parseInt($('#fSize').value, 10);
    if(!fieldError('wrapSize', !($('#fSize').value !== '' && size >= 100))){ ok = false; first = first || $('#fSize'); }
  }
  if(n === 3){
    if(!fieldError('wrapName', $('#fName').value.trim().length < 2)){ ok = false; first = first || $('#fName'); }
    if(!fieldError('wrapEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#fEmail').value.trim()))){ ok = false; first = first || $('#fEmail'); }
    if(!fieldError('wrapAddr', $('#fAddr').value.trim().length < 3)){ ok = false; first = first || $('#fAddr'); }
  }
  if(first) first.focus();
  return ok;
}

const REVIEW = [
  ['Service','service',1],['Frequency','frequency',1],['Priorities','needs',1],
  ['Property type','propertyType',2],['Approx. size','size',2],['Floor surfaces','floors',2],
  ['Service window','access',2],['Notes','notes',2],
  ['Name','name',3],['Company','company',3],['Email','email',3],['Phone','phone',3],['Service area','address',3]
];

function renderReview(){
  const d = collect();
  $('#reviewList').innerHTML = REVIEW.map(r =>
    '<div class="review-row"><dt>' + r[0] + '</dt><dd>' + esc(d[r[1]] || '—') +
    '</dd><button class="btn btn--ghost btn--sm" type="button" data-edit="' + r[2] + '">Edit</button></div>').join('');
}

$('#reviewList').addEventListener('click', e => {
  const b = e.target.closest('[data-edit]');
  if(b){ showStep(Number(b.dataset.edit)); $('.card').scrollIntoView({behavior: reduced() ? 'auto' : 'smooth', block:'start'}); }
});

$('#btnNext').addEventListener('click', () => { if(validate(state.step)) showStep(Math.min(TOTAL, state.step + 1)); });
$('#btnBack').addEventListener('click', () => showStep(Math.max(1, state.step - 1)));
$('#fService').addEventListener('change', e => setService(e.target.value));
$('#fFreq').addEventListener('change', e => setFreq(e.target.value));
form.addEventListener('input', e => {
  const w = e.target.closest('.field');
  if(w && w.classList.contains('has-error')) w.classList.remove('has-error');
});

/* O envio e real: POST para a funcao /api/quote, que manda o e-mail.
   Tres estados ja existiam no HTML (#formShell -> #formSending -> #formDone);
   o que entra aqui e o quarto, o de falha. Ele nunca mostra "Request received":
   o formulario volta inteiro, com tudo preenchido, e o telefone ao lado. Uma
   confirmacao falsa faria a pessoa esperar por um retorno que nunca vem. */
form.addEventListener('submit', async e => {
  e.preventDefault();
  if(!validate(3)){ showStep(3); return; }
  const d = collect();
  const submit = $('#btnSubmit');
  $('#formError').classList.remove('is-on');
  $('#formShell').style.display = 'none';
  $('#formSending').classList.add('is-on');
  submit.disabled = true;

  try {
    const res = await fetch('/api/quote', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(d)
    });
    if(!res.ok){
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || ('HTTP ' + res.status));
    }
    $('#formSending').classList.remove('is-on');
    $('#doneList').innerHTML = REVIEW.map(r =>
      '<div class="review-row"><dt>' + r[0] + '</dt><dd>' + esc(d[r[1]] || '—') + '</dd></div>').join('');
    $('#formDone').classList.add('is-on');
    $('#doneTitle').focus();
  } catch(err){
    console.error('[quote]', err);
    $('#formSending').classList.remove('is-on');
    $('#formShell').style.display = '';
    showStep(TOTAL);
    $('#formError').classList.add('is-on');
    $('#formErrorTitle').focus();
  } finally {
    submit.disabled = false;
  }
});

$('#btnRestart').addEventListener('click', () => {
  $('#formDone').classList.remove('is-on');
  $('#formShell').style.display = '';
  showStep(1);
  $('#fService').focus();
});

/* ============ Init ============ */
$('#year').textContent = new Date().getFullYear();
setService('commercial', {animate:false});
showStep(1);
requestAnimationFrame(moveMarker);
window.addEventListener('load', moveMarker);

/* Capitulos: cada secao marca sua entrada uma unica vez. As entradas so rodam
   com .sp-motion; sem ela a classe e inofensiva e o conteudo ja esta visivel. */
if('IntersectionObserver' in window){
  const chapterIO = new IntersectionObserver(entries => entries.forEach(en => {
    if(!en.isIntersecting) return;
    en.target.classList.add('is-in');
    chapterIO.unobserve(en.target);
  }), {threshold:.2, rootMargin:'0px 0px -10% 0px'});
  $$('main > section:not(.hero)').forEach(s => chapterIO.observe(s));
}

let rt;
window.addEventListener('resize', () => {
  document.querySelectorAll('[data-collapse]').forEach(c => { if(c.dataset.open === '1') c.style.height = 'auto'; });
  clearTimeout(rt);
  rt = setTimeout(() => { moveMarker(); stabiliseHero(); remeasureCmp(); }, 120);
});

/* ============ Superficie de Precisao — inclinacao da placa ============ */
/* Superficie de Precisao — leve efeito de ponteiro na placa de credenciais.
   Apenas desktop, ponteiro fino, hover real e sem reducao de movimento.
   A placa e a ancora do hero: so inclina (rotacao <= 1deg) como superficie sob
   luz rasante; nao se desloca na direcao do cursor. Sem alteracao de layout. */
(function(){
  var card = document.querySelector('.hero__card');
  if(!card || !window.matchMedia) return;
  var mq = window.matchMedia('(min-width:921px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  var raf = 0, bound = false;
  function onMove(e){
    if(raf) return;
    raf = requestAnimationFrame(function(){
      raf = 0;
      var r = card.getBoundingClientRect();
      if(!r.width || !r.height) return;
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = 'perspective(760px) rotateX(' + (y * -2).toFixed(2) + 'deg) rotateY(' + (x * 2).toFixed(2) + 'deg)';
    });
  }
  function reset(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } card.style.transform = ''; }
  function sync(){
    if(mq.matches && !bound){
      bound = true;
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', reset);
    } else if(!mq.matches && bound){
      bound = false;
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', reset);
      reset();
    }
  }
  sync();
  if(mq.addEventListener) mq.addEventListener('change', sync); else if(mq.addListener) mq.addListener(sync);
})();

/* ============ Campo marinho em shader ============ */
/* Um unico campo fixo atras da pagina, no lugar das seis copias de --nf-flow.
   A estetica e a mesma da camada data-navy-flow="logo": os quatro tons sao
   lidos das variaveis CSS e o ciclo vem de --nf-dur, entao um ajuste de cor
   ou de tempo no styles.css vale aqui e nas superficies que seguem no CSS.
   O movimento vem do shader "Oceanic" (21st.dev, @yaoztorun/adisyon-shader):
   nevoa fbm, onda senoidal, distorcao de dominio, deriva lenta, vinheta e
   granulacao fixa. Sem o reflexo do original: #1F6F8B ja e o tom mais claro
   da paleta e qualquer brilho acima dele derrubaria o contraste do texto que
   a camada calibrou em 4,5:1. Assim a saida fica limitada aos quatro tons.
   Desktop anima; abaixo de 921px e com reducao de movimento, um quadro so.
   Sem WebGL, data-field-engine nunca e escrito e o site fica no gradiente. */
(function(){
  'use strict';

  var host = document.querySelector('.nf-field');
  var canvas = document.getElementById('nfField');
  if(!host || !canvas || docEl.getAttribute('data-navy-field') !== 'shader') return;

  /* FIELD repete a receita do Oceanic (escala, detalhe, rotacao do campo,
     deriva, deslocamento e tempo invertido). Em LOOK, a vinheta desce de
     0,21 para 0,10: as janelas ficam justamente nas bordas da viewport, e a
     0,21 os cantos escureciam 21% e desenhavam um degrade visivel ao longo
     de toda a largura do cabecalho e do rodape. */
  var LOOK = { mist:0.54, warp:0.042, grain:0.08, vignette:0.10 };
  var FIELD = { scale:2, detail:1.536, rotate:5.6549, drift:0.116,
                offsetX:0.11, offsetY:-0.19, seed:12.7, timeScale:-0.727 };
  var PIXEL_BUDGET = 2e6;
  var TONES = ['--nf-navy', '--nf-mid-1', '--nf-mid-2', '--nf-blue'];

  var VERT = 'attribute vec2 a_position;\n' +
    'void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;',
    'uniform vec2 u_clock;',     // x: tempo da nevoa, y: fase do fluxo (0..1)
    'uniform vec4 u_look;',      // nevoa, distorcao, granulacao, vinheta
    'uniform vec4 u_field;',     // escala, detalhe, rotacao, deriva
    'uniform vec3 u_extra;',     // deslocamento.xy, semente
    'uniform vec3 u_colors[4];', // --nf-navy, --nf-mid-1, --nf-mid-2, --nf-blue
    'float hash21(vec2 p){',
    '#ifndef GL_FRAGMENT_PRECISION_HIGH',
    '  p = mod(p, 31.0);',
    '#endif',
    '  p = fract(p * vec2(234.34, 435.345));',
    '  p += dot(p, p + 34.23);',
    '  return fract(p.x * p.y);',
    '}',
    // Ruido branco uniforme para a granulacao (hash12 de Dave Hoskins).
    'float grainHash(vec2 p){',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    'float noise(vec2 p){',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),',
    '    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),',
    '    u.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  for (int i = 0; i < 5; i++){',
    '    v += a * noise(p);',
    '    p = p * 2.03 + vec2(17.0, 9.2);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    // Mesmos pontos do gradiente CSS (0, 1/3, 2/3, 1), com a transicao em
    // smoothstep do Oceanic: cada tom ganha um patamar visivel.
    'vec3 palette(float x){',
    '  float f = clamp(x, 0.0, 1.0) * 3.0;',
    '  vec3 col = u_colors[0];',
    '  col = mix(col, u_colors[1], smoothstep(0.0, 1.0, clamp(f,       0.0, 1.0)));',
    '  col = mix(col, u_colors[2], smoothstep(0.0, 1.0, clamp(f - 1.0, 0.0, 1.0)));',
    '  col = mix(col, u_colors[3], smoothstep(0.0, 1.0, clamp(f - 2.0, 0.0, 1.0)));',
    '  return col;',
    '}',
    'void main(){',
    '  vec2 frag = gl_FragCoord.xy;',
    '  float span = u_res.x + u_res.y;',
    '  float yDown = u_res.y - frag.y;',
    // Coordenada do linear-gradient(135deg): 0 no canto superior esquerdo,
    // 1 no inferior direito, com a mesma proporcao do CSS em qualquer tela.
    '  float diag = (frag.x + yDown) / span;',
    '  float along = (frag.x - yDown) / span;',
    // Campo da nevoa, como no Oceanic: escala, rotacao, deslocamento,
    // deriva lenta e distorcao de dominio.
    '  vec2 p = (frag - 0.5 * u_res) / min(u_res.x, u_res.y);',
    '  p *= u_field.x;',
    '  float cr = cos(u_field.z), sr = sin(u_field.z);',
    '  p = mat2(cr, -sr, sr, cr) * p;',
    '  p += u_extra.xy;',
    '  float t = u_clock.x;',
    '  p += u_field.w * vec2(sin(t * 0.31), cos(t * 0.23));',
    '  p += u_look.y * (vec2(',
    '    fbm(p * u_field.y + u_extra.z),',
    '    fbm(p * u_field.y + vec2(5.2, 1.3))) - 0.5);',
    // Onda e nevoa deslocam a diagonal. Amplitude um pouco acima da metade
    // da do Oceanic: aqui meio ciclo ja percorre a paleta inteira.
    '  float mist = fbm(p * 2.0 + t * 0.1);',
    '  float d = diag',
    '    + sin(along * (3.0 + u_look.x * 9.0) + t * 0.8) * 0.045',
    '    + (mist - 0.5) * u_look.x * 0.4;',
    // Onda triangular: marinho na fase 0, azul da logo na fase 0,5.
    '  float ph = fract(d - u_clock.y);',
    '  float v = 1.0 - abs(ph * 2.0 - 1.0);',
    '  vec3 col = palette(v);',
    '  vec2 suv = frag / u_res;',
    '  float vd = length(suv - 0.5) * 1.41421356;',
    '  col *= 1.0 - u_look.w * smoothstep(0.35, 1.0, vd);',
    '  col += (grainHash(frag + u_extra.z * vec2(17.0, 31.0)) - 0.5) * u_look.z;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  var gl = null, loc = null, contextLost = false;
  var raf = 0, stillRaf = 0, last = null;
  var noiseT = 0, phase = 0;
  var pageVisible = !document.hidden;
  var rect = canvas.getBoundingClientRect();

  /* ---- Cores e ciclo: lidos das variaveis CSS, fonte unica ---- */
  function cssVar(name){ return getComputedStyle(docEl).getPropertyValue(name).trim(); }
  var cycle = parseFloat(cssVar('--nf-dur')) || 24;

  function hexToRgb(hex){
    var h = hex.replace('#', '');
    if(h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  /* ---- WebGL ---- */
  function compile(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
      var log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(log || 'falha ao compilar o shader');
    }
    return s;
  }

  function initGL(){
    gl = gl || canvas.getContext('webgl', {
      antialias:false, alpha:false, depth:false, stencil:false,
      premultipliedAlpha:false, powerPreference:'low-power',
      // os espelhos leem este buffer com drawImage logo apos o desenho
      preserveDrawingBuffer:true
    });
    if(!gl) return false;
    var prog;
    try {
      var vs = compile(gl.VERTEX_SHADER, VERT);
      var fs = compile(gl.FRAGMENT_SHADER, FRAG);
      prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if(!gl.getProgramParameter(prog, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(prog) || 'falha ao ligar o programa');
    } catch(err){
      console.error('[campo marinho]', err);
      return false;
    }
    gl.useProgram(prog);

    // Um triangulo que cobre a tela inteira.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    function u(name){ return gl.getUniformLocation(prog, name); }
    loc = { res:u('u_res'), clock:u('u_clock') };
    var rgb = [];
    for(var i = 0; i < TONES.length; i++) rgb = rgb.concat(hexToRgb(cssVar(TONES[i])));
    gl.uniform3fv(u('u_colors'), new Float32Array(rgb));
    gl.uniform4f(u('u_look'), LOOK.mist, LOOK.warp, LOOK.grain, LOOK.vignette);
    gl.uniform4f(u('u_field'), FIELD.scale, FIELD.detail, FIELD.rotate, FIELD.drift);
    gl.uniform3f(u('u_extra'), FIELD.offsetX, FIELD.offsetY, FIELD.seed);
    canvas.width = 0; // forca o viewport no primeiro desenho
    return true;
  }

  // Densidade limitada a 2x e a ~2 megapixels: a imagem e macia, entao
  // pixels a mais so custariam GPU.
  function resize(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    var k = Math.min(1, Math.sqrt(PIXEL_BUDGET / (w * h)));
    w = Math.max(1, Math.round(w * k));
    h = Math.max(1, Math.round(h * k));
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  /* ---- Espelhos: o recorte do campo que cai sob cada elemento ----
     O cabecalho e sticky (z-index 100) e o menu mobile pendura-se nele, entao
     os dois pintam acima da pagina: transparentes, mostrariam o conteudo
     rolando, nao o campo em z-index -1. Aqui cada um recebe a sua fatia do
     mesmo quadro, nas mesmas coordenadas de viewport, entao o fluxo continua
     exatamente onde o campo continuaria. */
  var mirrors = [];
  (function(){
    var pairs = [['.site-header', 'nfHeaderField'], ['.mobile-nav', 'nfNavField']];
    for(var i = 0; i < pairs.length; i++){
      var el = document.querySelector(pairs[i][0]);
      var cv = document.getElementById(pairs[i][1]);
      var ctx2d = el && cv && cv.getContext ? cv.getContext('2d') : null;
      if(ctx2d) mirrors.push({ el:el, cv:cv, ctx:ctx2d });
    }
  })();

  function blit(){
    if(!mirrors.length) return;
    var vw = window.innerWidth || 1, vh = window.innerHeight || 1;
    // px do campo por px de CSS: o campo cobre a viewport, mas pode estar
    // reduzido pelo PIXEL_BUDGET
    var sx = canvas.width / vw, sy = canvas.height / vh;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    for(var i = 0; i < mirrors.length; i++){
      var m = mirrors[i];
      var r = m.el.getBoundingClientRect();
      if(r.width < 1 || r.height < 1) continue;
      var w = Math.max(1, Math.round(r.width * dpr));
      var h = Math.max(1, Math.round(r.height * dpr));
      if(m.cv.width !== w || m.cv.height !== h){ m.cv.width = w; m.cv.height = h; }
      m.ctx.drawImage(canvas,
        r.left * sx, r.top * sy,
        Math.max(1, r.width * sx), Math.max(1, r.height * sy),
        0, 0, w, h);
    }
  }

  function draw(){
    if(!gl || contextLost) return;
    resize();
    gl.uniform2f(loc.res, canvas.width, canvas.height);
    gl.uniform2f(loc.clock, noiseT, phase);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    blit();
    // So aqui as janelas abrem: com pixel ja na tela, nao ha papel piscando.
    if(docEl.dataset.fieldEngine !== 'webgl') docEl.dataset.fieldEngine = 'webgl';
  }

  /* ---- Laco: so com a aba visivel e movimento liberado ----
     Sem IntersectionObserver, ao contrario do conceito: o cabecalho e sticky,
     entao ha sempre uma janela marinha na tela e o observer nunca desligaria
     nada. motionMQ ja e "(min-width:921px) and (prefers-reduced-motion: no-
     preference)": abaixo disso o campo fica num quadro parado. */
  function shouldAnimate(){ return gl && !contextLost && pageVisible && motionMQ.matches; }

  function tick(now){
    raf = 0;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    noiseT += dt * FIELD.timeScale;
    phase = (phase + dt / cycle) % 1;
    draw();
    if(shouldAnimate()) raf = requestAnimationFrame(tick);
    else last = null;
  }

  function drawStill(){
    if(stillRaf || !gl || contextLost) return;
    stillRaf = requestAnimationFrame(function(){ stillRaf = 0; draw(); });
  }

  function sync(){
    if(shouldAnimate()){
      if(!raf) raf = requestAnimationFrame(tick);
      return;
    }
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    last = null;
    drawStill();
  }

  /* ---- Ciclo de vida ---- */
  /* O campo acompanha a viewport; os espelhos tambem sao observados para que
     abrir o menu mobile reescreva a fatia dele — no celular o campo esta
     parado e nao haveria quadro seguinte para faze-lo. */
  function remeasure(){
    rect = canvas.getBoundingClientRect();
    drawStill();
  }
  if('ResizeObserver' in window){
    var ro = new ResizeObserver(remeasure);
    ro.observe(canvas);
    for(var i = 0; i < mirrors.length; i++) ro.observe(mirrors[i].el);
  } else {
    window.addEventListener('resize', remeasure);
  }
  document.addEventListener('visibilitychange', function(){
    pageVisible = !document.hidden;
    sync();
  });
  if(motionMQ.addEventListener) motionMQ.addEventListener('change', sync);
  else if(motionMQ.addListener) motionMQ.addListener(sync);

  // Se o navegador derrubar o WebGL, o CSS assume ate ele voltar.
  canvas.addEventListener('webglcontextlost', function(e){
    e.preventDefault();
    contextLost = true;
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    delete docEl.dataset.fieldEngine;
  });
  canvas.addEventListener('webglcontextrestored', function(){
    contextLost = false;
    if(initGL()) sync();
  });

  if(initGL()) sync();
})();

/* ============ Campo areia em shader ============ */
/* A versao clara do campo marinho, do conceito-fluxo-areia.html. O mesmo
   shader "Oceanic" (21st.dev, @yaoztorun/adisyon-shader) e o mesmo FIELD do
   marinho, entao as duas metades da pagina sao a mesma onda em duas paletas.
   Tres coisas mudam, e todas vem do conceito: a paleta tem as paradas
   deslocadas (a areia entra cedo, o marfim ocupa faixa larga, o papel fica
   so na crista), volta o reflexo na crista recortado pela nevoa, e a vinheta
   mistura com a areia profunda em vez de multiplicar — sobre tons claros a
   multiplicacao deixaria os cantos acinzentados.
   As secoes claras nao podem ser janelas transparentes como as marinhas: o
   campo marinho ja esta em z-index -1 atras da pagina e seria ele a aparecer.
   Entao este campo nunca pinta e cada secao recebe a sua fatia por um canvas
   espelho. Os espelhos do marinho sao ancorados ao topo da viewport e sempre
   inteiros; aqui as secoes sao mais altas que a tela e o campo so tem pixels
   de uma viewport, entao cada espelho e um canvas position:sticky, preso a
   viewport pelo compositor e recortado na caixa da secao. O JS nao o move: so
   le onde o sticky parou e copia dali a fatia certa do campo.
   Acima de 920px apenas. Abaixo disso a rolagem por compositor passaria na
   frente do reposicionamento dos espelhos, e o campo marinho tambem ja fica
   num quadro parado. Sem WebGL, data-sand-engine nunca e escrito e as secoes
   claras ficam como estao. */
(function(){
  'use strict';

  var host = document.querySelector('.sf-field');
  var canvas = document.getElementById('sfField');
  if(!host || !canvas || docEl.getAttribute('data-sand-field') !== 'shader') return;

  /* FIELD e identico ao do campo marinho. Em LOOK, a vinheta desce de 0,35
     (o conceito, que e um palco unico) para 0,12 pelo mesmo motivo que a do
     marinho desceu de 0,21 para 0,10: aqui o campo e fixo na viewport e visto
     por janelas que vao de borda a borda, entao uma vinheta forte desenharia
     uma moldura escura parada em volta da tela enquanto a pagina rola. */
  var LOOK = { mist:0.54, warp:0.042, sheen:0.3, grain:0.07, vignette:0.12 };
  var FIELD = { scale:2, detail:1.536, rotate:5.6549, drift:0.116,
                offsetX:0.11, offsetY:-0.19, seed:12.7, timeScale:-0.727 };
  var PIXEL_BUDGET = 2e6;
  var TONES = ['--sf-sand-deep', '--sf-sand', '--sf-ivory', '--sf-paper'];

  var VERT = 'attribute vec2 a_position;\n' +
    'void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;',
    'uniform vec2 u_clock;',     // x: tempo da nevoa, y: fase do fluxo (0..1)
    'uniform vec4 u_look;',      // nevoa, distorcao, granulacao, vinheta
    'uniform vec4 u_field;',     // escala, detalhe, rotacao, deriva
    'uniform vec4 u_extra;',     // deslocamento.xy, semente, reflexo
    'uniform vec3 u_colors[4];', // areia profunda, areia, marfim, papel
    'uniform vec3 u_sheen;',     // --sf-sheen
    'float hash21(vec2 p){',
    '#ifndef GL_FRAGMENT_PRECISION_HIGH',
    '  p = mod(p, 31.0);',
    '#endif',
    '  p = fract(p * vec2(234.34, 435.345));',
    '  p += dot(p, p + 34.23);',
    '  return fract(p.x * p.y);',
    '}',
    // Ruido branco uniforme para a granulacao (hash12 de Dave Hoskins).
    'float grainHash(vec2 p){',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    'float noise(vec2 p){',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),',
    '    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),',
    '    u.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  for (int i = 0; i < 5; i++){',
    '    v += a * noise(p);',
    '    p = p * 2.03 + vec2(17.0, 9.2);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    // Transicao em smoothstep do Oceanic, com as paradas deslocadas em vez
    // dos tercos: a areia entra cedo, o marfim segura de 0,60 a 0,82 e o
    // papel fica so na crista.
    'vec3 palette(float x){',
    '  float f = clamp(x, 0.0, 1.0);',
    '  vec3 col = u_colors[0];',
    '  col = mix(col, u_colors[1], smoothstep(0.06, 0.34, f));',
    '  col = mix(col, u_colors[2], smoothstep(0.36, 0.60, f));',
    '  col = mix(col, u_colors[3], smoothstep(0.82, 1.00, f));',
    '  return col;',
    '}',
    'void main(){',
    '  vec2 frag = gl_FragCoord.xy;',
    '  float span = u_res.x + u_res.y;',
    '  float yDown = u_res.y - frag.y;',
    // Coordenada do linear-gradient(135deg): 0 no canto superior esquerdo,
    // 1 no inferior direito, com a mesma proporcao em qualquer tela.
    '  float diag = (frag.x + yDown) / span;',
    '  float along = (frag.x - yDown) / span;',
    // Campo da nevoa, como no Oceanic: escala, rotacao, deslocamento,
    // deriva lenta e distorcao de dominio.
    '  vec2 p = (frag - 0.5 * u_res) / min(u_res.x, u_res.y);',
    '  p *= u_field.x;',
    '  float cr = cos(u_field.z), sr = sin(u_field.z);',
    '  p = mat2(cr, -sr, sr, cr) * p;',
    '  p += u_extra.xy;',
    '  float t = u_clock.x;',
    '  p += u_field.w * vec2(sin(t * 0.31), cos(t * 0.23));',
    '  p += u_look.y * (vec2(',
    '    fbm(p * u_field.y + u_extra.z),',
    '    fbm(p * u_field.y + vec2(5.2, 1.3))) - 0.5);',
    // Onda e nevoa deslocam a diagonal. Amplitude um pouco acima da metade
    // da do Oceanic: aqui meio ciclo ja percorre a paleta inteira.
    '  float mist = fbm(p * 2.0 + t * 0.1);',
    '  float d = diag',
    '    + sin(along * (3.0 + u_look.x * 9.0) + t * 0.8) * 0.045',
    '    + (mist - 0.5) * u_look.x * 0.4;',
    // Onda triangular: areia profunda na fase 0, papel na crista (fase 0,5).
    '  float ph = fract(d - u_clock.y);',
    '  float v = 1.0 - abs(ph * 2.0 - 1.0);',
    '  vec3 col = palette(v);',
    // Reflexo: uma camada de luz na crista do papel, recortada pela nevoa,
    // no lugar da faixa clara do Oceanic.
    '  float crest = smoothstep(0.72, 1.0, v) * mix(0.35, 1.0, smoothstep(0.38, 0.72, mist));',
    '  col = mix(col, u_sheen, u_extra.w * crest * 0.45);',
    // Vinheta quente: mistura com a areia profunda. Multiplicar a cor, como
    // no marinho, deixaria os cantos claros acinzentados.
    '  vec2 suv = frag / u_res;',
    '  float vd = length(suv - 0.5) * 1.41421356;',
    '  col = mix(col, u_colors[0], u_look.w * smoothstep(0.35, 1.0, vd));',
    '  col += (grainHash(frag + u_extra.z * vec2(17.0, 31.0)) - 0.5) * u_look.z;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  var gl = null, loc = null, contextLost = false;
  var raf = 0, stillRaf = 0, last = null;
  var noiseT = 0, phase = 0;
  var pageVisible = !document.hidden;
  var rect = canvas.getBoundingClientRect();
  // o marinho para abaixo de 921px pelo motionMQ; aqui a largura e condicao
  // propria, porque os espelhos dependem de reescrever a fatia visivel
  var wideMQ = window.matchMedia('(min-width:921px)');

  /* ---- Cores e ciclo: lidos das variaveis CSS, fonte unica ---- */
  function cssVar(name){ return getComputedStyle(docEl).getPropertyValue(name).trim(); }
  var cycle = parseFloat(cssVar('--sf-dur')) || 24;

  function hexToRgb(hex){
    var h = hex.replace('#', '');
    if(h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  /* ---- WebGL ---- */
  function compile(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
      var log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(log || 'falha ao compilar o shader');
    }
    return s;
  }

  function initGL(){
    gl = gl || canvas.getContext('webgl', {
      antialias:false, alpha:false, depth:false, stencil:false,
      premultipliedAlpha:false, powerPreference:'low-power',
      // os espelhos leem este buffer com drawImage logo apos o desenho
      preserveDrawingBuffer:true
    });
    if(!gl) return false;
    var prog;
    try {
      var vs = compile(gl.VERTEX_SHADER, VERT);
      var fs = compile(gl.FRAGMENT_SHADER, FRAG);
      prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if(!gl.getProgramParameter(prog, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(prog) || 'falha ao ligar o programa');
    } catch(err){
      console.error('[campo areia]', err);
      return false;
    }
    gl.useProgram(prog);

    // Um triangulo que cobre a tela inteira.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    function u(name){ return gl.getUniformLocation(prog, name); }
    loc = { res:u('u_res'), clock:u('u_clock') };
    var rgb = [];
    for(var i = 0; i < TONES.length; i++) rgb = rgb.concat(hexToRgb(cssVar(TONES[i])));
    gl.uniform3fv(u('u_colors'), new Float32Array(rgb));
    gl.uniform3fv(u('u_sheen'), new Float32Array(hexToRgb(cssVar('--sf-sheen'))));
    gl.uniform4f(u('u_look'), LOOK.mist, LOOK.warp, LOOK.grain, LOOK.vignette);
    gl.uniform4f(u('u_field'), FIELD.scale, FIELD.detail, FIELD.rotate, FIELD.drift);
    gl.uniform4f(u('u_extra'), FIELD.offsetX, FIELD.offsetY, FIELD.seed, LOOK.sheen);
    canvas.width = 0; // forca o viewport no primeiro desenho
    return true;
  }

  // Densidade limitada a 2x e a ~2 megapixels: a imagem e macia, entao
  // pixels a mais so custariam GPU.
  function resize(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    var k = Math.min(1, Math.sqrt(PIXEL_BUDGET / (w * h)));
    w = Math.max(1, Math.round(w * k));
    h = Math.max(1, Math.round(h * k));
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  /* ---- Espelhos: o quadro inteiro do campo, um por secao ----
     Cada espelho e um canvas position:fixed cobrindo a viewport e recebe o
     quadro completo da origem, 1:1, sem recorte: a origem e os espelhos tem a
     mesma caixa (fixed, inset 0) e o mesmo buffer, entao o pixel (x,y) da
     origem cai no pixel (x,y) da tela. Quem recorta cada um nos limites da sua
     secao e o clip-path do host, por layout.
     Com isso a cobertura nao depende da rolagem: o compositor mantem o canvas
     parado na tela e um atraso na animacao apenas congela o quadro, sem abrir
     buraco. Nao ha handler de scroll nem leitura de posicao aqui.
     Nenhum espelho e zerado enquanto o efeito esta ligado: os distantes ficam
     com um quadro completo, so menos recente, para que um salto por ancora
     nunca caia numa area vazia. */
  var mirrors = [];
  (function(){
    var list = document.querySelectorAll('.sf-mirror');
    for(var i = 0; i < list.length; i++){
      var cv = list[i];
      var el = cv.closest ? cv.closest('section') : null;
      var ctx2d = el && cv.getContext ? cv.getContext('2d') : null;
      if(ctx2d) mirrors.push({ el:el, cv:cv, ctx:ctx2d, ready:false });
    }
  })();
  if(!mirrors.length) return;

  function fill(m){
    if(m.cv.width !== canvas.width || m.cv.height !== canvas.height){
      m.cv.width = canvas.width;
      m.cv.height = canvas.height;
    }
    m.ctx.drawImage(canvas, 0, 0);
    m.ready = true;
  }

  // So quando o efeito sai do ar (fora da faixa do wideMQ, contexto perdido):
  // a base opaca da secao ja esta valendo, entao da para devolver a memoria.
  function release(m){
    if(m.cv.width !== 1){ m.cv.width = 1; m.cv.height = 1; }
    m.ready = false;
  }

  function releaseAll(){
    for(var i = 0; i < mirrors.length; i++) release(mirrors[i]);
  }

  /* As secoes visiveis e as vizinhas sao redesenhadas a cada quadro; das
     distantes, uma por quadro, em rodizio. O custo por quadro fica constante e
     nenhuma delas atrasa muito em relacao a fase da animacao. */
  var turn = 0;
  function blit(){
    var vh = window.innerHeight || 1;
    var idle = [];
    for(var i = 0; i < mirrors.length; i++){
      var m = mirrors[i];
      var r = m.el.getBoundingClientRect();
      var near = r.bottom > -vh && r.top < 2 * vh;
      // buffer com tamanho velho ou ainda vazio entra junto, em qualquer caso
      if(near || !m.ready || m.cv.width !== canvas.width || m.cv.height !== canvas.height) fill(m);
      else idle.push(m);
    }
    if(idle.length) fill(idle[turn++ % idle.length]);
  }

  function draw(){
    if(!gl || contextLost) return;
    resize();
    gl.uniform2f(loc.res, canvas.width, canvas.height);
    gl.uniform2f(loc.clock, noiseT, phase);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    blit();
    // So aqui as secoes abrem: com pixel ja na tela, nao ha chapado piscando.
    if(docEl.dataset.sandEngine !== 'webgl') docEl.dataset.sandEngine = 'webgl';
  }

  /* ---- Laco: espelhos acima de 920px, movimento pelo motionMQ ---- */
  function live(){ return !!gl && !contextLost && wideMQ.matches; }
  function shouldAnimate(){ return live() && pageVisible && motionMQ.matches; }

  function tick(now){
    raf = 0;
    var dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    noiseT += dt * FIELD.timeScale;
    phase = (phase + dt / cycle) % 1;
    draw();
    if(shouldAnimate()) raf = requestAnimationFrame(tick);
    else last = null;
  }

  function drawStill(){
    if(stillRaf || !live()) return;
    stillRaf = requestAnimationFrame(function(){ stillRaf = 0; draw(); });
  }

  function sleep(){
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    last = null;
    // primeiro o atributo sai e a base opaca da secao volta a valer; so depois
    // os buffers sao devolvidos, entao nao ha quadro sem cobertura nenhuma
    if(docEl.dataset.sandEngine) delete docEl.dataset.sandEngine;
    releaseAll();
  }

  function sync(){
    if(!live()){ sleep(); return; }
    if(shouldAnimate()){
      if(!raf) raf = requestAnimationFrame(tick);
      return;
    }
    if(raf){ cancelAnimationFrame(raf); raf = 0; }
    last = null;
    drawStill();
  }

  /* ---- Ciclo de vida ---- */
  /* Sem handler de rolagem: o espelho e fixo e carrega o quadro inteiro, entao
     rolar nao muda nada do que ele mostra. Mudancas de altura das secoes
     (acordeao de #services, chips de #planning, passos do formulario em
     #quote) tambem nao pedem redesenho: quem segue a caixa da secao e o host,
     por layout. Fica so a viewport, que muda o tamanho do campo. */
  function remeasure(){
    rect = canvas.getBoundingClientRect();
    drawStill();
  }
  if('ResizeObserver' in window){
    new ResizeObserver(remeasure).observe(canvas);
  } else {
    window.addEventListener('resize', remeasure);
  }
  document.addEventListener('visibilitychange', function(){
    pageVisible = !document.hidden;
    sync();
  });
  if(motionMQ.addEventListener) motionMQ.addEventListener('change', sync);
  else if(motionMQ.addListener) motionMQ.addListener(sync);
  if(wideMQ.addEventListener) wideMQ.addEventListener('change', sync);
  else if(wideMQ.addListener) wideMQ.addListener(sync);

  // Se o navegador derrubar o WebGL, as secoes claras voltam ao chapado.
  canvas.addEventListener('webglcontextlost', function(e){
    e.preventDefault();
    contextLost = true;
    sleep();
  });
  canvas.addEventListener('webglcontextrestored', function(){
    contextLost = false;
    if(initGL()) sync();
  });

  if(initGL()) sync();
})();
