const N8N_WEBHOOK_URL = "https://n8n.iflows.com.br/webhook/nfce";
const N8N_DASHBOARD_URL = "https://n8n.iflows.com.br/webhook/dashboard";
const N8N_HISTORICO_URL = "https://n8n.iflows.com.br/webhook/historico";
const tabScan = document.getElementById("tabScan");
const tabManual = document.getElementById("tabManual");
const tabOCR = document.getElementById("tabOCR");
const tabXML = document.getElementById("tabXML");
const ocrMode = document.getElementById("ocrMode");
const xmlMode = document.getElementById("xmlMode");
const ocrFileInput = document.getElementById("ocrFileInput");
const xmlFileInput = document.getElementById("xmlFileInput");
const scanMode = document.getElementById("scanMode");
const manualMode = document.getElementById("manualMode");
const salvarManualBtn = document.getElementById("salvarManualBtn");
const itensContainer = document.getElementById("itensContainer");
const addItemBtn = document.getElementById("addItemBtn");
const manualTotal = document.getElementById("manualTotal");

let itensManuais = [];

// Screens
const homeScreen = document.getElementById("homeScreen");
const scanScreen = document.getElementById("scanScreen");
const processingScreen = document.getElementById("processingScreen");

// Buttons
const openScanCard = document.getElementById("openScanCard");
const bottomScanBtn = document.getElementById("bottomScanBtn");
const backHomeBtn = document.getElementById("backHomeBtn");
const backFromProcessingBtn = document.getElementById("backFromProcessingBtn");
const flashBtn = document.getElementById("flashBtn");

// Elements
const qrResult = document.getElementById("qrResult");
const fluxoStatus = document.getElementById("fluxoStatus");

// Resultado
const estabelecimento = document.getElementById("estabelecimento");
const valor = document.getElementById("valor");
const itensEl = document.getElementById("itens");

// Camera
const cameraPlaceholder = document.getElementById("cameraPlaceholder");

let html5QrCode = null;
let flashOn = false;
let videoTrack = null;

// ================= NAV =================

function adicionarItem() {
  const index = itensManuais.length;

  itensManuais.push({ nome: "", valor: 0, categoria: "Outros" });

  const div = document.createElement("div");
  div.className = "item-row";

  div.innerHTML = `
    <input placeholder="Produto"
      oninput="atualizarItem(${index}, 'nome', this.value)">

    <input type="number" placeholder="Valor" step="0.01"
      oninput="atualizarItem(${index}, 'valor', this.value)">

    <select onchange="atualizarItem(${index}, 'categoria', this.value)">
      <option value="Alimentação">Alimentação</option>
      <option value="Casa">Casa</option>
      <option value="Transporte">Transporte</option>
      <option value="Saúde">Saúde</option>
      <option value="Limpeza">Limpeza</option>
      <option value="Vestuário">Vestuário</option>
      <option value="Educação">Educação</option>
      <option value="Lazer">Lazer</option>
      <option value="Comunicação">Comunicação</option>
      <option value="Outros" selected>Outros</option>
    </select>

    <button onclick="removerItem(${index})" class="remove-btn">✕</button>
  `;

  itensContainer.appendChild(div);
}

function removerItem(index) {
  itensManuais.splice(index, 1);

  // limpa e recria lista
  itensContainer.innerHTML = "";

  const copia = [...itensManuais];
  itensManuais = [];

  copia.forEach(() => adicionarItem());

  calcularTotal();
}

function atualizarItem(index, campo, valor) {
  if (campo === "valor") {
    valor = parseFloat(valor) || 0;
  }

  itensManuais[index][campo] = valor;
  calcularTotal();
}

function calcularTotal() {
  const total = itensManuais.reduce((acc, item) => acc + item.valor, 0);
  manualTotal.innerText = "R$ " + total.toFixed(2);
}

function showScreen(screen) {
  homeScreen.classList.remove("active");
  scanScreen.classList.remove("active");
  processingScreen.classList.remove("active");

  screen.classList.add("active");
}

if (openScanCard) {
  openScanCard.addEventListener("click", startScan);
}

if (bottomScanBtn) {
  bottomScanBtn.addEventListener("click", startScan);
}

if (backHomeBtn) {
  backHomeBtn.addEventListener("click", () => {
    stopCamera();
    showScreen(homeScreen);
  });
}

if (backFromProcessingBtn) {
  backFromProcessingBtn.addEventListener("click", () => {
    showScreen(homeScreen);
  });
}

if (flashBtn) {
  flashBtn.addEventListener("click", toggleFlash);
}
if (addItemBtn) {
  addItemBtn.addEventListener("click", adicionarItem);
}

if (salvarManualBtn) {
  salvarManualBtn.addEventListener("click", salvarDespesaManual);
}

// ===== ABAS SCAN / OCR / XML / MANUAL =====

function limparAbasImportacao() {
  if (tabScan) tabScan.classList.remove("active");
  if (tabOCR) tabOCR.classList.remove("active");
  if (tabXML) tabXML.classList.remove("active");
  if (tabManual) tabManual.classList.remove("active");

  if (scanMode) scanMode.classList.add("hidden");
  if (ocrMode) ocrMode.classList.add("hidden");
  if (xmlMode) xmlMode.classList.add("hidden");
  if (manualMode) manualMode.classList.add("hidden");
}

function ativarScan(event) {
  if (event) event.preventDefault();

  limparAbasImportacao();

  if (tabScan) tabScan.classList.add("active");
  if (scanMode) scanMode.classList.remove("hidden");

  startScan();
}

function ativarOCR(event) {
  if (event) event.preventDefault();

  limparAbasImportacao();

  if (tabOCR) tabOCR.classList.add("active");
  if (ocrMode) ocrMode.classList.remove("hidden");

  stopCamera();
}

function ativarXML(event) {
  if (event) event.preventDefault();

  limparAbasImportacao();

  if (tabXML) tabXML.classList.add("active");
  if (xmlMode) xmlMode.classList.remove("hidden");

  stopCamera();
}

function ativarManual(event) {
  if (event) event.preventDefault();

  limparAbasImportacao();

  if (tabManual) tabManual.classList.add("active");
  if (manualMode) manualMode.classList.remove("hidden");

  stopCamera();
}

if (tabScan) {
  tabScan.addEventListener("pointerdown", ativarScan);
}

if (tabOCR) {
  tabOCR.addEventListener("pointerdown", ativarOCR);
}

if (tabXML) {
  tabXML.addEventListener("pointerdown", ativarXML);
}

if (tabManual) {
  tabManual.addEventListener("pointerdown", ativarManual);
}

document.getElementById("btnSelecionarImagemOCR")?.addEventListener("click", () => {
  ocrFileInput?.click();
});

document.getElementById("tirarFotoOCRBtn")?.addEventListener("click", () => {
  ocrFileInput?.setAttribute("capture", "environment");
  ocrFileInput?.click();
});

document.getElementById("selecionarOCRBtn")?.addEventListener("click", () => {
  ocrFileInput?.removeAttribute("capture");
  ocrFileInput?.click();
});

document.getElementById("btnSelecionarXML")?.addEventListener("click", () => {
  xmlFileInput?.click();
});

ocrFileInput?.addEventListener("change", () => {
  if (!ocrFileInput.files.length) return;

  resetarTelaProcessamento();
  fluxoStatus.innerText = "Processando OCR...";
  showScreen(processingScreen);
  atualizarEtapaProcessamento(1);

  alert("Imagem selecionada. Próximo passo: enviar para o fluxo OCR no n8n.");
});

xmlFileInput?.addEventListener("change", () => {
  if (!xmlFileInput.files.length) return;

  resetarTelaProcessamento();
  fluxoStatus.innerText = "Processando XML...";
  showScreen(processingScreen);
  atualizarEtapaProcessamento(1);

  alert("XML selecionado. Próximo passo: enviar para o fluxo XML no n8n.");
});
console.log("Fiscal Flow app.js carregado corretamente");

// ================= SCAN =================

async function startScan() {
  console.log("Clique no botão Escanear detectado");
  showScreen(scanScreen);
  cameraPlaceholder.style.display = "none";

  try {
    if (html5QrCode) {
      try { await html5QrCode.stop(); } catch {}
      try { html5QrCode.clear(); } catch {}
    }

    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10 },
      async (decodedText) => {
        qrResult.value = decodedText;

        await stopCamera();

        processarNota();
      },
      () => {}
    );

    setTimeout(capturarVideoTrack, 500);

  } catch (err) {
    console.error("Erro ao abrir câmera:", err);
    cameraPlaceholder.innerText = "Erro ao abrir câmera";
    cameraPlaceholder.style.display = "flex";
  }
}

function capturarVideoTrack() {
  const video = document.querySelector("#reader video");

  if (video && video.srcObject) {
    videoTrack = video.srcObject.getVideoTracks()[0];
    console.log("Track capturada:", videoTrack);
  } else {
    console.warn("Não foi possível capturar a track da câmera.");
  }
}

async function stopCamera() {
  flashOn = false;
  videoTrack = null;

  if (flashBtn) {
    flashBtn.innerText = "🔦";
  }

  if (html5QrCode) {
    try { await html5QrCode.stop(); } catch {}
  }
}

// ================= FLASH =================

async function toggleFlash() {
  if (!videoTrack) {
    alert("Abra a câmera primeiro.");
    return;
  }

  try {
    const capabilities = videoTrack.getCapabilities
      ? videoTrack.getCapabilities()
      : {};

    console.log("Capabilities:", capabilities);

    if (!capabilities.torch) {
      alert("Lanterna não suportada neste celular/navegador.");
      return;
    }

    flashOn = !flashOn;

    await videoTrack.applyConstraints({
      advanced: [{ torch: flashOn }]
    });

    flashBtn.innerText = flashOn ? "💡" : "🔦";

  } catch (err) {
    console.error("Erro ao acionar lanterna:", err);
    alert("Não foi possível acionar a lanterna.");
  }
}

// ================= PROCESSAMENTO =================

function processarNota() {
  resetarTelaProcessamento();
  showScreen(processingScreen);

  fluxoStatus.innerText = "Processando dados...";
  atualizarEtapaProcessamento(1);

  setTimeout(() => {
    enviarParaN8N();
  }, 800);
}

function mostrarAcoesPosProcessamento() {
  const tabs = document.getElementById("postProcessTabs");
  if (!tabs) return;

  tabs.classList.remove("hidden");

  document.getElementById("postNovoScanBtn").onclick = () => {
    showScreen(scanScreen);
    ativarScan();
  };

  document.getElementById("postNovoManualBtn").onclick = () => {
    showScreen(scanScreen);
    ativarManual();
  };
}

// ================= ENVIO =================

function normalizeNfceUrl(rawUrl) {
  let url = rawUrl.trim();

  url = url.replace("qrcode.xhtml", "qrcode.xhtml?");
  url = url.replace("qrcode.xhtml??", "qrcode.xhtml?");
  url = url.replace(
    "https://nfce.fazenda.mg.gov.br",
    "https://portalsped.fazenda.mg.gov.br"
  );

  return url;
}

async function enviarParaN8N() {
  fluxoStatus.innerText = "Enviando dados...";
  atualizarEtapaProcessamento(2);

  const urlNfce = normalizeNfceUrl(qrResult.value);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        data_captura: new Date().toISOString(),
        url_nfce: urlNfce,
        url_original: qrResult.value,
        origem: "pwa_dark"
      })
    });

    const text = await response.text();
    const data = JSON.parse(text);
    const nota = Array.isArray(data) ? data[0] : data;

    mostrarResultado(nota);

  } catch (err) {
    console.error(err);
    fluxoStatus.innerText = "Erro no processamento";
    mostrarAcoesPosProcessamento();
  }
}

// ================= RESULTADO =================

function moedaBR(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function percentual(valor, total) {
  if (!total || total <= 0) return "0%";
  return Math.round((Number(valor || 0) / Number(total)) * 100) + "%";
}

let dashboardAtual = null;
let mesSelecionado = null;
let modoGrafico = "bar";
let modoPeriodo = "12M";
let dashboardCache = {};
let mesesGrafico = [];

async function carregarDashboard() {
  try {
    const res = await fetch(N8N_DASHBOARD_URL);
    const dados = await res.json();

    let lista = dados;

  if (modoPeriodo === "ANO") {
    const anoAtual = new Date().getFullYear();

    lista = gerarAnoCompleto(anoAtual, dados);
  }

  mesesGrafico = lista.map(m => ({
    mes: m.mes,
    label: formatarLabelMes(m.mes),
    total: Number(m.total || 0),
    quantidade: Number(m.quantidade || 0),
    categorias: m.categorias || {}
  }));

    dashboardCache = {};

    mesesGrafico.forEach(m => {
      dashboardCache[m.mes] = {
        mes_selecionado: m.mes,
        total_mes: m.total,
        quantidade: m.quantidade,
        ultimos_6_meses: mesesGrafico,
        categorias: m.categorias || {}
      };
    });

    const ultimoMes = mesesGrafico[mesesGrafico.length - 1]?.mes;
    aplicarDashboardPorMes(ultimoMes);

  } catch (err) {
    console.error("Erro dashboard:", err);
  }
}
function aplicarDashboardPorMes(mes) {
  const dados = dashboardCache[mes];
  if (!dados) return;

  dashboardAtual = dados;
  mesSelecionado = mes;

  document.getElementById("homeTotal").innerText =
    moedaBR(dados.total_mes || 0);

  montarSeletorPeriodo();
  renderizarGraficoBarras(dados);
  renderizarCategoriasTop3(dados);
  
}
function formatarLabelMes(mes) {
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [ano, mesNum] = mes.split("-");
  return nomes[Number(mesNum) - 1];
}
function aplicarDashboard(dados) {
  dashboardAtual = dados;
  mesSelecionado = dados.mes_selecionado;

  if (!mesesFixosGrafico.length) {
    mesesFixosGrafico = dados.ultimos_6_meses || [];
  }

  dados.ultimos_6_meses = mesesFixosGrafico;

  document.getElementById("homeTotal").innerText =
    moedaBR(dados.total_mes || 0);

  montarSeletorPeriodo(mesesFixosGrafico);
  renderizarGraficoBarras(dados);
  renderizarCategoriasTop3(dados);
  precarregarMesesDashboard();
}

async function precarregarMesesDashboard() {
  const meses = mesesFixosGrafico || [];

  for (const m of meses) {
    if (!m.mes) continue;
    if (dashboardCache[m.mes]) continue;

    try {
      const url = `${N8N_DASHBOARD_URL}?mes=${m.mes}-01`;
      const res = await fetch(url);
      const dados = await res.json();

      dashboardCache[m.mes] = dados;
    } catch (err) {
      console.warn("Erro ao pré-carregar mês:", m.mes, err);
    }
  }
}


function gerarAnoCompleto(ano, dados) {
  const meses = [];

  for (let i = 1; i <= 12; i++) {
    const mesStr = `${ano}-${String(i).padStart(2, "0")}`;

    const existente = dados.find(d => d.mes === mesStr);

    meses.push({
      mes: mesStr,
      total: existente ? existente.total : 0,
      quantidade: existente ? existente.quantidade : 0
    });
  }

  return meses;
}
function aplicarDashboard(dados) {
  dashboardAtual = dados;
  mesSelecionado = dados.mes_selecionado;

  if (!mesesFixosGrafico.length) {
    mesesFixosGrafico = dados.ultimos_6_meses || [];
  }

  dados.ultimos_6_meses = mesesFixosGrafico;

  document.getElementById("homeTotal").innerText =
    moedaBR(dados.total_mes || 0);

  montarSeletorPeriodo(mesesFixosGrafico);
  renderizarGraficoBarras(dados);
  renderizarCategoriasTop3(dados);
}

function montarSeletorPeriodo() {
  const select = document.getElementById("periodSelector");
  if (!select) return;

  select.value = modoPeriodo;

  select.onchange = () => {
    modoPeriodo = select.value;
    carregarDashboard();
  };
}

function renderizarGraficoBarras(dados) {
  const chart = document.getElementById("barChart");
  if (!chart) return;

  const meses = dados.ultimos_6_meses || mesesGrafico || [];
  const maior = Math.max(...meses.map(m => Number(m.total || 0)), 1);

  const baseEscala = maior <= 500 ? 100 : maior <= 2000 ? 500 : maior <= 10000 ? 1000 : 5000;
  const escalaMax = Math.ceil(maior / baseEscala) * baseEscala;

  chart.innerHTML = `
    <div class="y-axis-labels">
      <span>${escalaMax}</span>
      <span>${Math.round(escalaMax * 0.75)}</span>
      <span>${Math.round(escalaMax * 0.5)}</span>
      <span>${Math.round(escalaMax * 0.25)}</span>
      <span>0</span>
    </div>
  `;

  meses.forEach(m => {
    const total = Number(m.total || 0);
    const altura = total > 0 ? Math.max((total / maior) * 100, 6) : 5;
    const ativo = m.mes === dados.mes_selecionado;

    const item = document.createElement("div");
    item.className = `bar-item ${ativo ? "active" : ""}`;
    item.style.setProperty("--bar-height", `${altura}%`);

    item.innerHTML = `
      <div class="bar ${ativo ? "active" : ""}" style="height:${altura}%"></div>
      <div class="bar-label">${m.label}</div>
    `;

    item.onclick = () => aplicarDashboardPorMes(m.mes);

    chart.appendChild(item);
  });
}

function renderizarCategoriasTop3(dados) {
  const total = Number(dados.total_mes || 0);
  const cat = dados.categorias || {};

  const nomes = document.getElementsByClassName("cat-name");
  const valores = document.getElementsByClassName("cat-value");
  const percentuais = document.getElementsByClassName("cat-percent");
  const icones = document.getElementsByClassName("cat-icon");
  const cardsHtml = document.getElementsByClassName("cat");

  const mapaIcones = {
    "Alimentação": "🍴",
    "Transporte": "🚗",
    "Casa": "🏠",
    "Saúde": "💊",
    "Limpeza": "🧽",
    "Vestuário": "👕",
    "Educação": "📚",
    "Lazer": "🎮",
    "Comunicação": "📱",
    "Higiene": "🧴",
    "Outros": "•••"
  };

  const top3 = Object.entries(cat)
    .map(([nome, valor]) => ({ nome, valor: Number(valor || 0) }))
    .filter(c => c.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3);

  for (let i = 0; i < cardsHtml.length; i++) {
    if (i < 3) {
      const card = top3[i] || { nome: "-", valor: 0 };

      cardsHtml[i].style.display = "flex";
      nomes[i].innerText = card.nome;
      valores[i].innerText = moedaBR(card.valor);
      percentuais[i].innerText = percentual(card.valor, total);
      icones[i].innerText = mapaIcones[card.nome] || "🏷️";
    } else {
      cardsHtml[i].style.display = "none";
    }
  }

  renderizarDonutLegenda(top3, total);
}

function renderizarDonutLegenda(top3, total) {
  const legend = document.getElementById("donutLegend");
  if (!legend) return;

  legend.innerHTML = "";

  top3.forEach(c => {
    const row = document.createElement("div");
    row.className = "legend-row";
    row.innerHTML = `
      <span>${c.nome}</span>
      <strong>${percentual(c.valor, total)}</strong>
    `;
    legend.appendChild(row);
  });
}

document.getElementById("btnBarChart")?.addEventListener("click", () => {
  modoGrafico = "bar";
  document.getElementById("barChart").classList.remove("hidden");
  document.getElementById("donutView").classList.add("hidden");
  document.getElementById("btnBarChart").classList.add("active");
  document.getElementById("btnDonutChart").classList.remove("active");
});

document.getElementById("btnDonutChart")?.addEventListener("click", () => {
  modoGrafico = "donut";
  document.getElementById("barChart").classList.add("hidden");
  document.getElementById("donutView").classList.remove("hidden");
  document.getElementById("btnDonutChart").classList.add("active");
  document.getElementById("btnBarChart").classList.remove("active");
});

  async function carregarUltimasNotas() {
    try {
      const res = await fetch(`${N8N_HISTORICO_URL}?page=1&limit=3`);
      const notas = await res.json();
      const totalNotasEl = document.getElementById("totalNotas");
      const totalItensEl = document.getElementById("itens");

      const lista = document.getElementById("transactionsList");
      if (!lista) return;

      lista.innerHTML = "";

      if (!Array.isArray(notas) || notas.length === 0) {
        lista.innerHTML = `
          <div class="transaction">
            <div class="tx-icon green">🛒</div>
            <div>
              <div class="tx-title">Nenhuma nota lida</div>
              <div class="tx-meta">Escaneie uma NFC-e</div>
            </div>
            <div class="tx-value">R$ 0,00</div>
            <div class="tx-arrow">›</div>
          </div>
        `;
        return;
      }

      notas.forEach(nota => {
        if (Array.isArray(notas)) {
          totalNotasEl.innerText = notas.length;

          const totalItens = notas.reduce((soma, n) => {
            return soma + (n.quantidade_itens || 0);
          }, 0);

          totalItensEl.innerText = totalItens;
        }
        const div = document.createElement("div");
        div.className = "transaction";

        div.innerHTML = `
          <div class="tx-icon green">🛒</div>
          <div>
            <div class="tx-title">${nota.estabelecimento || "Estabelecimento não identificado"}</div>
            <div class="tx-meta">${nota.data_compra || "-"} • ${nota.quantidade_itens || 0} itens</div>
          </div>
          <div class="tx-value">${moedaBR(nota.valor_total)}</div>
          <div class="tx-arrow">›</div>
        `;

        lista.appendChild(div);
      });

    } catch (err) {
      console.error("Erro últimas notas:", err);
    }
  }

function resetarTelaProcessamento() {
  const tabs = document.getElementById("postProcessTabs");
  if (tabs) tabs.classList.add("hidden");

  document.querySelector(".progress-inner").innerHTML = "📄";

  document.querySelector(".progress-ring").style.animation = "";
  document.querySelector(".progress-inner").style.animation = "";
  document.querySelector(".progress-inner").style.transition = "all .3s ease";

  document.querySelector(".processing-sub").innerText =
    "Isso pode levar alguns segundos";

  fluxoStatus.innerText = "Processando dados...";

  atualizarEtapaProcessamento(1);
}

  function mostrarResultado(nota) {
  document.querySelector(".progress-inner").innerHTML = "✔️";
  document.querySelector(".progress-ring").style.animation = "none";
  document.querySelector(".progress-inner").style.animation = "none";
  document.querySelector(".processing-sub").innerText = "Despesa registrada com sucesso";

  fluxoStatus.innerText = "Concluído";
  atualizarEtapaProcessamento(3);

  estabelecimento.innerText =
    nota?.estabelecimento || "Estabelecimento não identificado";

  valor.innerText =
    nota?.valor_total != null ? "R$ " + nota.valor_total : "R$ 0,00";

  itensEl.innerText =
    nota?.quantidade_itens != null ? nota.quantidade_itens : 0;

  dashboardCache = {};
  carregarDashboard();
  carregarUltimasNotas();
  limparFormularioManual();
  mostrarAcoesPosProcessamento();
}

function converterDataBRparaISO(dataBR) {
  if (!dataBR) return "";

  const partes = dataBR.split("/");
  if (partes.length !== 3) return "";

  const [dia, mes, ano] = partes;

  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return "";

  return `${ano}-${mes}-${dia}`;
}

async function salvarDespesaManual() {
  resetarTelaProcessamento();
  const actions = document.getElementById("postProcessActions");
  if (actions) actions.style.display = "none";
  
  const formaPagamentoManual = document.getElementById("manualPagamento").value;
  const estabelecimentoManual = document.getElementById("manualEstabelecimento").value.trim();
  const dataManualInput = document.getElementById("manualData").value;
  const dataManual = converterDataBRparaISO(dataManualInput);

  const itensValidos = itensManuais.filter(i => i.nome && i.valor > 0);

  if (!estabelecimentoManual || !dataManual || itensValidos.length === 0) {
    alert("Preencha estabelecimento, data e pelo menos um item com valor.");
    return;
  }

  const totalManual = itensValidos.reduce((acc, item) => acc + item.valor, 0);

  const payload = {
    origem: "manual",
    estabelecimento: estabelecimentoManual,
    data_compra: dataManual,
    valor_total: totalManual,
    forma_pagamento: formaPagamentoManual,
    quantidade_itens: itensValidos.length,
    itens: itensValidos.map(i => ({
      produto: i.nome,
      categoria: i.categoria || "Outros",
      valor_total: i.valor,
      quantidade: 1,
      unidade: "UN"
    }))
  };

  fluxoStatus.innerText = "Salvando despesa...";
  showScreen(processingScreen);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = payload;
    }

    const nota = Array.isArray(data) ? data[0] : data;

    mostrarResultado({
      estabelecimento: nota.estabelecimento || estabelecimentoManual,
      valor_total: nota.valor_total || totalManual,
      quantidade_itens: nota.quantidade_itens || itensValidos.length
    });

  } catch (error) {
    console.error("Erro ao salvar manual:", error);
    fluxoStatus.innerText = "Erro ao salvar despesa";
    document.querySelector(".processing-sub").innerText =
      "Não foi possível registrar a despesa";

    mostrarAcoesPosProcessamento();
  }
}

const manualDataInput = document.getElementById("manualData");

if (manualDataInput) {
  manualDataInput.addEventListener("input", () => {
    let v = manualDataInput.value.replace(/\D/g, "");

    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5, 9);

    manualDataInput.value = v;
  });
}

function limparFormularioManual() {
  const est = document.getElementById("manualEstabelecimento");
  const data = document.getElementById("manualData");

  if (est) est.value = "";
  if (data) data.value = "";

  itensContainer.innerHTML = "";
  itensManuais = [];

  adicionarItem();
  calcularTotal();
}

carregarDashboard();
carregarUltimasNotas();
adicionarItem();

function atualizarEtapaProcessamento(etapa) {
  const steps = document.querySelectorAll(".step");

  steps.forEach(step => {
    step.classList.remove("done", "active");
  });

  if (etapa >= 1 && steps[0]) steps[0].classList.add("done");
  if (etapa >= 2 && steps[1]) steps[1].classList.add("done");
  if (etapa >= 3 && steps[2]) steps[2].classList.add("done");

  if (etapa < 3 && steps[etapa]) {
    steps[etapa].classList.add("active");
  }
}