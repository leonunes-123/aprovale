/* Aprovale – scripts compartilhados por todas as páginas */

/* ---------- menu mobile ---------- */
const menuBotao = document.querySelector('.menu-botao');
const menu = document.getElementById('menu');
if (menuBotao && menu) {
  menuBotao.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    menuBotao.setAttribute('aria-expanded', aberto);
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) { menu.classList.remove('aberto'); menuBotao.setAttribute('aria-expanded', 'false'); }
  });
}

/* ---------- submenu "Institucional" (clique/teclado; o mouse abre pelo CSS) ---------- */
document.querySelectorAll('.sub-botao').forEach((botao) => {
  botao.addEventListener('click', () => {
    botao.setAttribute('aria-expanded', botao.getAttribute('aria-expanded') !== 'true');
  });
  botao.parentElement.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { botao.setAttribute('aria-expanded', 'false'); botao.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!botao.parentElement.contains(e.target)) botao.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- vitrine de fotos (só na página inicial) ---------- */
const vitrine = document.querySelector('.vitrine');
if (vitrine) iniciarVitrine(vitrine);

function iniciarVitrine(vitrine) {
  const trilho = vitrine.querySelector('.vitrine-trilho');
  const slides = [...trilho.children];
  const total = slides.length;
  const miniNav = vitrine.querySelector('.miniaturas');
  const status = vitrine.querySelector('[role="status"]');
  const contador = vitrine.querySelector('.vitrine-contador');
  const pausaBtn = vitrine.querySelector('.vitrine-pausa');
  const progresso = vitrine.querySelector('.vitrine-progresso');
  const palco = vitrine.querySelector('.vitrine-palco');
  const reduzirMov = matchMedia('(prefers-reduced-motion: reduce)');
  const INTERVALO = 5500;

  const minis = slides.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ver foto ${i + 1} de ${total}`);
    const num = s.querySelector('img').getAttribute('src').match(/(\d+)\.jpg$/)[1];
    b.innerHTML = `<img src="img/cursos/mini/${num}.jpg" alt="" width="240" height="180">`;
    b.addEventListener('click', () => { pararAuto(true); anunciar = true; irPara(i); });
    miniNav.append(b);
    return b;
  });

  let alvo = null, atual = -1, assentado = 0, anunciar = false;

  const indiceAtual = () => {
    const centro = trilho.scrollLeft + trilho.clientWidth / 2;
    let melhor = 0, dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - centro);
      if (d < dist) { dist = d; melhor = i; }
    });
    return melhor;
  };

  function marcar(i) {
    if (i === atual) return;
    atual = i;
    minis.forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
    contador.textContent = `${i + 1} / ${total}`;
    const m = minis[i];
    miniNav.scrollTo({ left: m.offsetLeft - miniNav.clientWidth / 2 + m.offsetWidth / 2, behavior: reduzirMov.matches ? 'auto' : 'smooth' });
  }

  function irPara(i) {
    i = (i + total) % total;
    alvo = i;
    marcar(i);
    const s = slides[i];
    trilho.scrollTo({ left: s.offsetLeft - (trilho.clientWidth - s.offsetWidth) / 2, behavior: reduzirMov.matches ? 'auto' : 'smooth' });
  }
  const passo = (d) => irPara((alvo ?? indiceAtual()) + d);

  vitrine.querySelector('[data-direcao="anterior"]').addEventListener('click', () => { pararAuto(true); anunciar = true; passo(-1); });
  vitrine.querySelector('[data-direcao="proxima"]').addEventListener('click', () => { pararAuto(true); anunciar = true; passo(1); });

  let quadro = 0;
  trilho.addEventListener('scroll', () => {
    if (alvo !== null || quadro) return;
    quadro = requestAnimationFrame(() => { quadro = 0; marcar(indiceAtual()); });
  }, { passive: true });

  function aoAssentar() {
    alvo = null;
    const i = indiceAtual();
    marcar(i);
    if (i !== assentado && anunciar) status.textContent = `Foto ${i + 1} de ${total}`;
    anunciar = false;
    assentado = i;
  }
  if ('onscrollend' in window) trilho.addEventListener('scrollend', aoAssentar);
  else { let t; trilho.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(aoAssentar, 120); }, { passive: true }); }
  trilho.addEventListener('pointerdown', () => { anunciar = true; pararAuto(true); });
  trilho.addEventListener('keydown', () => { anunciar = true; pararAuto(true); });

  // passagem automática: pausa com o mouse em cima, fora da tela, aba oculta ou pelo botão
  let timer = null, pausadoPelaPessoa = reduzirMov.matches, sobre = false, visivel = false;
  const progAnim = () => {
    progresso.getAnimations().forEach((a) => a.cancel());
    if (!reduzirMov.matches) progresso.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: INTERVALO, easing: 'linear' });
  };
  function avaliarAuto() {
    const rodar = !pausadoPelaPessoa && !sobre && visivel && !document.hidden;
    if (rodar && !timer) { progAnim(); timer = setInterval(() => { passo(1); progAnim(); }, INTERVALO); }
    else if (!rodar && timer) { clearInterval(timer); timer = null; progresso.getAnimations().forEach((a) => a.cancel()); }
  }
  function atualizarPausaBtn() {
    pausaBtn.dataset.pausado = pausadoPelaPessoa;
    pausaBtn.querySelector('span').textContent = pausadoPelaPessoa ? 'Passar fotos' : 'Pausar';
  }
  function pararAuto(pelaPessoa) { if (pelaPessoa) { pausadoPelaPessoa = true; atualizarPausaBtn(); } avaliarAuto(); }
  pausaBtn.addEventListener('click', () => { pausadoPelaPessoa = !pausadoPelaPessoa; atualizarPausaBtn(); avaliarAuto(); });
  palco.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { sobre = true; avaliarAuto(); } });
  palco.addEventListener('pointerleave', () => { sobre = false; avaliarAuto(); });
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; avaliarAuto(); }, { threshold: 0.4 }).observe(palco);
  document.addEventListener('visibilitychange', avaliarAuto);

  marcar(0);
  atualizarPausaBtn();
}

/* ---------- máscaras de CPF e telefone ---------- */
const soDigitos = (v) => v.replace(/\D/g, '');
function cpfValido(d) {
  if (/^(\d)\1{10}$/.test(d)) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += +d[i] * (n + 1 - i);
    if (((soma * 10) % 11) % 10 !== +d[n]) return false;
  }
  return true;
}
document.querySelectorAll('input[data-mascara="cpf"]').forEach((cpf) => cpf.addEventListener('input', () => {
  const d = soDigitos(cpf.value).slice(0, 11);
  cpf.value = d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  cpf.setCustomValidity(d.length === 11 && !cpfValido(d) ? 'CPF inválido' : '');
}));
document.querySelectorAll('input[data-mascara="telefone"]').forEach((tel) => tel.addEventListener('input', () => {
  const d = soDigitos(tel.value).slice(0, 11);
  tel.value = d.length > 10 ? d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    : d.length > 6 ? d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    : d.length > 2 ? d.replace(/^(\d{2})(\d+)/, '($1) $2') : d;
}));

/* ---------- formulários enviados por e-mail (FormSubmit) ---------- */
// Erros só aparecem depois que a pessoa mexe no campo (:user-invalid), e o
// aria-invalid acompanha o que se vê, para leitores de tela.
const linkErro = (el, mostrar) => {
  const id = el.dataset.error; if (!id) return;
  const base = (el.dataset.descricao || '').split(/\s+/).filter(Boolean);
  if (mostrar) base.push(id);
  if (base.length) el.setAttribute('aria-describedby', base.join(' ')); else el.removeAttribute('aria-describedby');
};
const sync = (el) => {
  if (!el.matches?.('form[data-envio] [data-error]')) return;
  const inv = el.matches(':user-invalid');
  el.setAttribute('aria-invalid', inv ? 'true' : 'false');
  linkErro(el, inv);
};

document.querySelectorAll('form[data-envio]').forEach((form) => {
  const status = form.querySelector('.form-status');
  form.querySelectorAll('[data-error]').forEach(sync);
  ['blur', 'change', 'input', 'invalid'].forEach((ev) => form.addEventListener(ev, (e) => sync(e.target), true));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Enviando…';
    try {
      const resp = await fetch(form.dataset.envio, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json.success === 'false' || json.success === false) throw new Error(json.message || resp.status);
      form.reset();
      form.querySelectorAll('[data-error]').forEach((el) => { el.setAttribute('aria-invalid', 'false'); linkErro(el, false); });
      status.classList.add('ok');
      status.textContent = form.dataset.sucesso;
    } catch {
      status.classList.add('falha');
      status.textContent = 'Não foi possível enviar agora. Tente de novo ou fale com a gente pelo WhatsApp.';
    } finally {
      botao.disabled = false;
    }
  });
});

/* ---------- visual moderno: cabeçalho ao rolar e elementos que aparecem ---------- */
const topo = document.querySelector('.topo');
if (topo) {
  const marcarTopo = () => topo.classList.toggle('rolado', scrollY > 12);
  marcarTopo();
  addEventListener('scroll', marcarTopo, { passive: true });
}
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const alvos = document.querySelectorAll(
    '.secao-cabeca, .dois-col > *, .lei, .cartao, .docs li, .diretoria li, .cursos-texto > *, .contato > *, .associe > *, .tabela-titulo, .tabela-rolagem, .vitrine, .faixa-whats .wrap > *, .objetivos li, .cursos-lista li, .texto-corrido'
  );
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  alvos.forEach((el) => {
    if (el.closest('.revelar')) return;
    const irmaos = [...el.parentElement.children].filter((x) => x.matches('.lei, .cartao, .docs li, .diretoria li, .objetivos li, .cursos-lista li'));
    const i = irmaos.indexOf(el);
    if (i > 0) el.style.setProperty('--atraso', `${Math.min(i, 5) * 0.08}s`);
    el.classList.add('revelar');
    obs.observe(el);
  });
}
