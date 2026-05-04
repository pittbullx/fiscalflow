const N8N_WEBHOOK_URL = "https://n8n.iflows.com.br/webhook/230c395b-070d-4e94-8cbc-ea207a01b58d";
const N8N_PREVIEW_NFCE_URL = "https://n8n.iflows.com.br/webhook/preview-nfce";
const N8N_DASHBOARD_URL = "https://n8n.iflows.com.br/webhook/dashboard";
const N8N_HISTORICO_URL = "https://n8n.iflows.com.br/webhook/historico";
const N8N_PREVIEW_XML_URL = "https://n8n.iflows.com.br/webhook/preview-xml";
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
let nfcePreviewData = null;

// Screens
const homeScreen = document.getElementById("homeScreen");
const scanScreen = document.getElementById("scanScreen");
const confirmarNfceScreen = document.getElementById("confirmarNfceScreen");
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

  atualizarResumoParcelamento();
}

function showScreen(screen) {
  homeScreen.classList.remove("active");
  scanScreen.classList.remove("active");
  confirmarNfceScreen.classList.remove("active");
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

xmlFileInput?.addEventListener("change", async () => {
  if (!xmlFileInput.files.length) return;

  const file = xmlFileInput.files[0];

  try {
    resetarTelaProcessamento();
    fluxoStatus.innerText = "Lendo XML...";
    showScreen(processingScreen);
    atualizarEtapaProcessamento(1);

    const xmlText = await file.text();

    fluxoStatus.innerText = "Enviando XML...";
    atualizarEtapaProcessamento(2);

    const response = await fetch(N8N_PREVIEW_XML_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml"
      },
      body: xmlText
    });

    const text = await response.text();
    const data = JSON.parse(text);
    const nota = Array.isArray(data) ? data[0] : data;

    if (nota.status === "preview") {
      mostrarConfirmacaoNfce(nota);
    } else {
      alert("XML processado, mas o retorno não veio como preview.");
      console.log(nota);
    }

  } catch (error) {
    console.error("Erro ao processar XML:", error);
    fluxoStatus.innerText = "Erro ao processar XML";
    document.querySelector(".processing-sub").innerText =
      "Não foi possível ler o XML.";

    mostrarAcoesPosProcessamento();
  } finally {
    xmlFileInput.value = "";
  }
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
    const response = await fetch(N8N_PREVIEW_NFCE_URL, {
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

    if (nota.status === "preview") {
      mostrarConfirmacaoNfce(nota);
    } else {
      mostrarResultado(nota);
    }

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
let modoPeriodo = "ANO";
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

    let mesParaUsar = mesSelecionado;

    if (!mesParaUsar) {
      const hoje = new Date();
      mesParaUsar = hoje.toISOString().slice(0, 7);
    }

    // fallback se não existir no dataset
    if (!dashboardCache[mesParaUsar]) {
      mesParaUsar = mesesGrafico[mesesGrafico.length - 1]?.mes;
    }

    aplicarDashboardPorMes(mesParaUsar);

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
  renderizarTopCategorias(dados);
  renderizarInsightsMensais();
  atualizarComparativoMes(dados);
  
}

function atualizarComparativoMes(dados) {
  const percentEl = document.getElementById("comparePercent");
  const textEl = document.getElementById("compareText");

  if (!percentEl || !textEl) return;

  const mesAtual = dados.mes_selecionado;
  const indiceAtual = mesesGrafico.findIndex(m => m.mes === mesAtual);
  const mesAnterior = indiceAtual > 0 ? mesesGrafico[indiceAtual - 1] : null;

  const valorAtual = Number(dados.total_mes || 0);
  const valorAnterior = Number(mesAnterior?.total || 0);

  if (!mesAnterior || valorAnterior <= 0) {
    percentEl.innerText = "0%";
    textEl.innerText = "sem mês anterior";
    return;
  }

  const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
  const seta = variacao >= 0 ? "↑" : "↓";
  const sinal = variacao >= 0 ? "+" : "";

  percentEl.innerText = `${seta} ${sinal}${Math.round(variacao)}%`;
  textEl.innerText = `vs. ${formatarLabelMes(mesAnterior.mes)}`;
}


function formatarLabelMes(mes) {
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [ano, mesNum] = mes.split("-");
  return nomes[Number(mesNum) - 1];
}
function nomeMesCompleto(yyyyMM) {
  if (!yyyyMM) return "-";

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const mesIndex = parseInt(yyyyMM.split("-")[1], 10) - 1;

  return meses[mesIndex] || "-";
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
  renderizarTopCategorias(dados);
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
      total: existente ? Number(existente.total || 0) : 0,
      quantidade: existente ? Number(existente.quantidade || 0) : 0,
      categorias: existente ? (existente.categorias || {}) : {}
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
  const dropdown = document.getElementById("periodDropdown");
  const btn = document.getElementById("periodDropdownBtn");
  const label = document.getElementById("periodDropdownLabel");
  const menu = document.getElementById("periodDropdownMenu");

  if (!dropdown || !btn || !label || !menu) return;

  label.innerText = modoPeriodo === "ANO" ? "Ano" : "12M";

  menu.querySelectorAll("button").forEach(button => {
    button.classList.toggle("active", button.dataset.period === modoPeriodo);

    button.onclick = () => {
      modoPeriodo = button.dataset.period;

      if (modoPeriodo === "12M") {
        const hoje = new Date();
        mesSelecionado = hoje.toISOString().slice(0, 7);
      }

      dropdown.classList.remove("open");
      carregarDashboard();
    };
  });

  btn.onclick = (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("open");
  };

  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
  });
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

    <div class="bars-layer"></div>
  `;

  const barsLayer = chart.querySelector(".bars-layer");

  meses.forEach(m => {
    const total = Number(m.total || 0);
    const altura = total > 0 ? Math.max((total / escalaMax) * 100, 5) : 4;
    const ativo = m.mes === dados.mes_selecionado;

    const item = document.createElement("div");
    item.className = `bar-item ${ativo ? "active" : ""}`;

    item.innerHTML = `
      <div class="bar ${ativo ? "active" : ""}" style="height:${altura}%"></div>
      <div class="bar-label">${m.label}</div>
    `;

    item.onclick = () => aplicarDashboardPorMes(m.mes);

    barsLayer.appendChild(item);
  });
}

function renderizarInsightsMensais() {
  if (!mesesGrafico || mesesGrafico.length === 0) return;

  const mesesComGasto = mesesGrafico.filter(m => Number(m.total || 0) > 0);

  if (mesesComGasto.length === 0) return;

  const maior = [...mesesComGasto].sort((a, b) => b.total - a.total)[0];
  const menor = [...mesesComGasto].sort((a, b) => a.total - b.total)[0];

  const media =
    mesesComGasto.reduce((soma, m) => soma + Number(m.total || 0), 0) /
    mesesComGasto.length;

  document.getElementById("maiorDespesaMes").innerText = nomeMesCompleto(maior.mes);
  document.getElementById("maiorDespesaValor").innerText = moedaBR(maior.total);

  document.getElementById("menorDespesaMes").innerText = nomeMesCompleto(menor.mes);
  document.getElementById("menorDespesaValor").innerText = moedaBR(menor.total);

  document.getElementById("mediaMensalValor").innerText = moedaBR(media);
}

function renderizarTopCategorias(dados) {
  const lista = document.getElementById("topCategoriasList");
  if (!lista) return;

  const mesSelecionadoAtual = dados?.mes_selecionado || mesSelecionado;
  const categoriasMes = dados?.categorias || {};

  const todasCategorias = new Set();

  Object.keys(categoriasMes).forEach(cat => todasCategorias.add(cat));

  mesesGrafico.forEach(m => {
    Object.keys(m.categorias || {}).forEach(cat => todasCategorias.add(cat));
  });

  const linhas = [...todasCategorias].map(nome => {
    const valorMes = Number(categoriasMes[nome] || 0);

    const mesesBaseMedia = obterMesesBaseMedia();

    const somaBase = mesesBaseMedia.reduce((acc, m) => {
      return acc + Number((m.categorias || {})[nome] || 0);
    }, 0);

    const mediaOutros = mesesBaseMedia.length > 0 ? somaBase / mesesBaseMedia.length : 0;

    return {
      nome,
      valorMes,
      mediaOutros
    };
  })
  .filter(c => c.valorMes > 0 || c.mediaOutros > 0)
  .sort((a, b) => b.valorMes - a.valorMes)
  .slice(0, 10);

  const maiorReferencia = Math.max(
    ...linhas.map(c => Math.max(c.valorMes, c.mediaOutros)),
    1
  );

  lista.innerHTML = "";

  if (linhas.length === 0) {
    lista.innerHTML = `
      <div class="top-category-empty">
        Nenhuma categoria encontrada para este período.
      </div>
    `;
    return;
  }

  linhas.forEach((cat, index) => {
    const larguraMes = Math.max((cat.valorMes / maiorReferencia) * 100, cat.valorMes > 0 ? 6 : 0);
    const larguraMedia = Math.max((cat.mediaOutros / maiorReferencia) * 100, cat.mediaOutros > 0 ? 6 : 0);

    const row = document.createElement("div");
    row.className = "top-category-row";

    row.innerHTML = `
      <div class="top-category-rank">${index + 1}</div>

      <div class="top-category-icon">
        ${iconeCategoriaMinimalista(cat.nome)}
      </div>

      <div class="top-category-main">
        <div class="top-category-name">${cat.nome}</div>

        <div class="top-category-bars">
          <div class="top-category-track">
            <div class="top-category-fill current" style="width:${larguraMes}%"></div>
          </div>

          <div class="top-category-track">
            <div class="top-category-fill average" style="width:${larguraMedia}%"></div>
          </div>
        </div>
      </div>

      <div class="top-category-values">
        <div class="top-category-value current">${moedaBR(cat.valorMes)}</div>
        <div class="top-category-average">${moedaBR(cat.mediaOutros)}</div>
      </div>
    `;

    lista.appendChild(row);
  });
}

function obterMesesBaseMedia() {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  const anoAtual = hoje.getFullYear();

  if (modoPeriodo === "ANO") {
    return mesesGrafico.filter(m => {
      const [ano, mes] = m.mes.split("-").map(Number);
      return ano === anoAtual && mes <= hoje.getMonth() + 1;
    });
  }

  return mesesGrafico
    .filter(m => m.mes <= mesAtual)
    .slice(-12);
}

function iconeCategoriaMinimalista(nome) {
  const n = String(nome || "").toLowerCase();

  if (n.includes("aliment") || n.includes("alimento") || n.includes("bebida")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M7 3v18" />
        <path d="M4 3v6a3 3 0 0 0 6 0V3" />
        <path d="M17 3v18" />
        <path d="M14 3h4v8h-4z" />
      </svg>
    `;
  }

  if (n.includes("transporte") || n.includes("combust")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M5 16h14" />
        <path d="M7 16l1-6h8l1 6" />
        <circle cx="8" cy="18" r="1.5" />
        <circle cx="16" cy="18" r="1.5" />
        <path d="M9 10V7h6v3" />
      </svg>
    `;
  }

  if (n.includes("casa") || n.includes("moradia")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v10h12V10" />
        <path d="M10 20v-6h4v6" />
      </svg>
    `;
  }

  if (n.includes("saúde") || n.includes("saude")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    `;
  }

  if (n.includes("educ")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M4 8l8-4 8 4-8 4-8-4z" />
        <path d="M6 10v5c2 2 10 2 12 0v-5" />
      </svg>
    `;
  }

  if (n.includes("lazer")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M7 15h10" />
        <path d="M9 13v4" />
        <path d="M15 13v4" />
        <path d="M6 10h12l2 8H4l2-8z" />
      </svg>
    `;
  }

  if (n.includes("comunicação") || n.includes("comunicacao")) {
    return `
      <svg viewBox="0 0 24 24">
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
    `;
  }

  if (n.includes("limpeza") || n.includes("higiene")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M8 11h8" />
        <path d="M9 11l1-7h4l1 7" />
        <path d="M6 11h12l-1 10H7L6 11z" />
      </svg>
    `;
  }

  if (n.includes("vest")) {
    return `
      <svg viewBox="0 0 24 24">
        <path d="M9 4l3 3 3-3 4 3-2 4-2-1v10H9V10l-2 1-2-4 4-3z" />
      </svg>
    `;
  }

  if (n.includes("pet")) {
    return `
      <svg viewBox="0 0 24 24">
        <circle cx="8" cy="9" r="1.5" />
        <circle cx="16" cy="9" r="1.5" />
        <circle cx="10" cy="6" r="1.2" />
        <circle cx="14" cy="6" r="1.2" />
        <path d="M8 16c1.5-3 6.5-3 8 0 1 2-1 4-4 4s-5-2-4-4z" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 12h6" />
    </svg>
  `;
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


  async function carregarUltimasNotas() {
  try {
    const res = await fetch(`${N8N_HISTORICO_URL}?page=1&limit=5`);
    const notas = await res.json();

    const totalNotasEl = document.getElementById("totalNotas");
    const totalItensEl = document.getElementById("itens");
    const lista = document.getElementById("transactionsList");

    if (!lista) return;

    lista.innerHTML = "";

    if (!Array.isArray(notas) || notas.length === 0) {
      lista.innerHTML = `
        <div class="latest-note-empty">
          Nenhuma nota registrada ainda.
        </div>
      `;
      return;
    }

    if (totalNotasEl) totalNotasEl.innerText = notas.length;

    if (totalItensEl) {
      const totalItens = notas.reduce((soma, n) => {
        return soma + Number(n.quantidade_itens || 0);
      }, 0);

      totalItensEl.innerText = totalItens;
    }

    notas.slice(0, 5).forEach(nota => {
      const div = document.createElement("div");
      div.className = "latest-note-row";

      div.innerHTML = `
        <div class="latest-note-icon">
          <svg viewBox="0 0 24 24">
            <path d="M7 4h10v16H7z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h3" />
          </svg>
        </div>

        <div class="latest-note-main">
          <div class="latest-note-title">
            ${nota.estabelecimento || "Estabelecimento não identificado"}
          </div>
          <div class="latest-note-meta">
            ${formatarDataNota(nota.data_compra)} • ${nota.quantidade_itens || 0} itens
          </div>
        </div>

        <div class="latest-note-value">
          ${moedaBR(nota.valor_total)}
        </div>

        <div class="latest-note-arrow">›</div>
      `;

      lista.appendChild(div);
    });

  } catch (err) {
    console.error("Erro últimas notas:", err);
  }
}

function formatarDataNota(data) {
  if (!data) return "-";

  if (data.includes("-")) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return data;
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

  if (estabelecimento) {
    estabelecimento.innerText =
      nota?.estabelecimento || "Estabelecimento não identificado";
  }

  if (valor) {
    valor.innerText =
      nota?.valor_total != null ? moedaBR(nota.valor_total) : "R$ 0,00";
  }

  if (itensEl) {
    itensEl.innerText =
      nota?.quantidade_itens != null ? nota.quantidade_itens : 0;
  }

  dashboardCache = {};
  carregarDashboard();
  carregarUltimasNotas();
  limparFormularioManual();
  mostrarAcoesPosProcessamento();
}

function mostrarConfirmacaoNfce(nota) {
    if (!nota.itens || !Array.isArray(nota.itens) || nota.itens.length === 0) {
    alert("Não foi possível extrair os itens dessa NFC-e. Tente escanear novamente ou lançar manualmente.");
    showScreen(scanScreen);
    return;
  }
 
  nfcePreviewData = nota;

  document.getElementById("nfceEstabelecimento").innerText =
    nota.estabelecimento || "Estabelecimento não identificado";

  document.getElementById("nfceData").innerText =
    nota.data_compra || "-";

  document.getElementById("nfceTotal").innerText =
    moedaBR(nota.valor_total || 0);

  const pagamento = document.getElementById("nfcePagamento");
  pagamento.value = nota.forma_pagamento_detectada || "17 - PIX";

  renderizarItensConfirmacaoNfce(nota.itens || []);
  atualizarParcelamentoNfce();

  showScreen(confirmarNfceScreen);
}

function renderizarItensConfirmacaoNfce(itens) {
  const lista = document.getElementById("nfceItens");
  if (!lista) return;

  lista.innerHTML = "";

  itens.forEach(item => {
    const div = document.createElement("div");
    div.className = "item-row";

    div.innerHTML = `
      <input value="${item.produto || ""}" readonly>
      <input value="${moedaBR(item.valor_total || 0)}" readonly>
      <select disabled>
        <option>${item.categoria || "Outros"}</option>
      </select>
    `;

    lista.appendChild(div);
  });
}

function pagamentoNfceEhCredito() {
  const forma = document.getElementById("nfcePagamento")?.value || "";
  return forma.toLowerCase().includes("crédito") || forma.toLowerCase().includes("credito");
}

function atualizarParcelamentoNfce() {
  const card = document.getElementById("nfceParcelamentoCard");
  if (!card) return;

  if (pagamentoNfceEhCredito()) {
    card.classList.remove("hidden");
  } else {
    card.classList.add("hidden");
    document.getElementById("nfceParcelas").value = "1";
    document.getElementById("nfcePrimeiraParcela").value = "";
  }
}

document.getElementById("nfcePagamento")?.addEventListener("change", atualizarParcelamentoNfce);

document.getElementById("nfcePrimeiraParcela")?.addEventListener("input", () => {
  const input = document.getElementById("nfcePrimeiraParcela");
  let v = input.value.replace(/\D/g, "");

  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5, 9);

  input.value = v;
});

document.getElementById("btnCancelarNfce")?.addEventListener("click", () => {
  nfcePreviewData = null;
  showScreen(scanScreen);
  ativarScan();
});

document.getElementById("btnConfirmarNfce")?.addEventListener("click", confirmarNfce);

async function confirmarNfce() {
  if (!nfcePreviewData) {
    alert("Nenhuma NFC-e carregada para confirmar.");
    return;
  }

  if (!nfcePreviewData.itens || !Array.isArray(nfcePreviewData.itens) || nfcePreviewData.itens.length === 0) {
    alert("Essa NFC-e está sem itens. Não vou salvar uma nota incompleta.");
    return;
  }


  const formaPagamento = document.getElementById("nfcePagamento").value;
  const ehCredito = pagamentoNfceEhCredito();

  const parcelas = ehCredito
    ? Number(document.getElementById("nfceParcelas").value || 1)
    : 1;

  const primeiraParcelaInput = document.getElementById("nfcePrimeiraParcela").value;
  const primeiraParcela = ehCredito
    ? converterDataBRparaISO(primeiraParcelaInput)
    : String(nfcePreviewData.data_compra || "").slice(0, 10);

  if (ehCredito && !primeiraParcela) {
    alert("Informe a data da primeira parcela.");
    return;
  }

  const payload = {
    origem: "nfce_qrcode",
    data_captura: nfcePreviewData.data_captura,
    data_compra: String(nfcePreviewData.data_compra || "").slice(0, 10),
    url_nfce: nfcePreviewData.url_nfce,
    url_original: nfcePreviewData.url_original,
    chave_nfce: nfcePreviewData.chave_nfce,
    estabelecimento: nfcePreviewData.estabelecimento,
    cnpj: nfcePreviewData.cnpj,
    valor_total: nfcePreviewData.valor_total,
    forma_pagamento: formaPagamento,
    parcelas: parcelas,
    primeira_parcela: primeiraParcela,
    quantidade_itens: nfcePreviewData.itens.length,
    itens: nfcePreviewData.itens
  };

  resetarTelaProcessamento();
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

    alert("Despesa salva com sucesso!");
    location.reload();

  } catch (error) {
    console.error("Erro ao confirmar NFC-e:", error);
    fluxoStatus.innerText = "Erro ao salvar NFC-e";
    document.querySelector(".processing-sub").innerText =
      "Não foi possível registrar a despesa";

    mostrarAcoesPosProcessamento();
  }
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
  const ehCreditoManual = pagamentoEhCredito();
  const parcelasManual = ehCreditoManual ? Number(manualParcelas?.value || 1) : 1;
  const primeiraParcelaInput = ehCreditoManual ? manualPrimeiraParcela?.value : "";
  const primeiraParcelaManual = ehCreditoManual
    ? converterDataBRparaISO(primeiraParcelaInput)
    : "";
  const estabelecimentoManual = document.getElementById("manualEstabelecimento").value.trim();
  const dataManualInput = document.getElementById("manualData").value;
  const dataManual = converterDataBRparaISO(dataManualInput);

  const itensValidos = itensManuais.filter(i => i.nome && i.valor > 0);

  if (!estabelecimentoManual || !dataManual || itensValidos.length === 0) {
    alert("Preencha estabelecimento, data e pelo menos um item com valor.");
    return;
  }

  if (ehCreditoManual && (!parcelasManual || parcelasManual < 1 || !primeiraParcelaManual)) {
    alert("Para cartão de crédito, informe as parcelas e a data da primeira parcela.");
    return;
  }

  const totalManual = itensValidos.reduce((acc, item) => acc + item.valor, 0);

  const payload = {
    origem: "manual",
    estabelecimento: estabelecimentoManual,
    data_compra: dataManual,
    valor_total: totalManual,
    forma_pagamento: formaPagamentoManual,
    parcelas: parcelasManual,
    primeira_parcela: primeiraParcelaManual || dataManual,
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

const manualPagamento = document.getElementById("manualPagamento");
const parcelamentoCard = document.getElementById("parcelamentoCard");
const manualParcelas = document.getElementById("manualParcelas");
const manualPrimeiraParcela = document.getElementById("manualPrimeiraParcela");
const parcelamentoResumo = document.getElementById("parcelamentoResumo");

function pagamentoEhCredito() {
  const forma = manualPagamento?.value || "";
  return forma.toLowerCase().includes("crédito") || forma.toLowerCase().includes("credito");
}

function atualizarParcelamentoCard() {
  if (!parcelamentoCard) return;

  if (pagamentoEhCredito()) {
    parcelamentoCard.classList.remove("hidden");

    if (manualPrimeiraParcela && !manualPrimeiraParcela.value) {
      manualPrimeiraParcela.value = document.getElementById("manualData")?.value || "";
    }

    atualizarResumoParcelamento();
  } else {
    parcelamentoCard.classList.add("hidden");

    if (manualParcelas) manualParcelas.value = "1";
    if (manualPrimeiraParcela) manualPrimeiraParcela.value = "";

    atualizarResumoParcelamento();
  }
}

function atualizarResumoParcelamento() {
  if (!parcelamentoResumo) return;

  const total = itensManuais.reduce((acc, item) => acc + item.valor, 0);
  const parcelas = Number(manualParcelas?.value || 1);

  if (!pagamentoEhCredito()) {
    parcelamentoResumo.innerText = "Parcelamento disponível apenas para cartão de crédito.";
    return;
  }

  if (!total || total <= 0) {
    parcelamentoResumo.innerText = "Adicione os itens para calcular o valor das parcelas.";
    return;
  }

  const valorParcela = total / parcelas;
  const primeira = manualPrimeiraParcela?.value || "não informada";

  parcelamentoResumo.innerText =
    `Total ${moedaBR(total)} em ${parcelas}x de ${moedaBR(valorParcela)}. ` +
    `Primeira parcela: ${primeira}.`;
}

if (manualPagamento) {
  manualPagamento.addEventListener("change", atualizarParcelamentoCard);
}

if (manualParcelas) {
  manualParcelas.addEventListener("change", atualizarResumoParcelamento);
}

if (manualPrimeiraParcela) {
  manualPrimeiraParcela.addEventListener("input", () => {
    let v = manualPrimeiraParcela.value.replace(/\D/g, "");

    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5, 9);

    manualPrimeiraParcela.value = v;
    atualizarResumoParcelamento();
  });
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
atualizarParcelamentoCard();

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