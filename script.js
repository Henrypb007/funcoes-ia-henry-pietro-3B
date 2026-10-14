const inputPergunta = document.getElementById("input-pergunta");
const btnPerguntar = document.getElementById("btn-perguntar");
const seletorVozes = document.getElementById("seletor-vozes");
const statusBusca = document.getElementById("status-busca");
const caixaResultado = document.querySelector(".caixa-resultado");
const textoResultado = document.querySelector(".texto-resultado");
const btnOuvir = document.getElementById("btn-ouvir");
const btnNovaPergunta = document.getElementById("btn-nova-pergunta");

let vozesPTBR = [];
let respostaAtualTexto = "";

// Carrega as vozes PT-BR nativas
function carregarVozes() {
    if (!('speechSynthesis' in window)) return;

    const todasVozes = window.speechSynthesis.getVoices();
    vozesPTBR = todasVozes.filter(v => v.lang.toLowerCase() === 'pt-br' || v.lang.toLowerCase() === 'pt_br');

    if (vozesPTBR.length === 0) {
        vozesPTBR = todasVozes.filter(v => v.lang.toLowerCase().startsWith('pt'));
    }

    seletorVozes.innerHTML = "";

    if (vozesPTBR.length === 0) {
        const option = document.createElement("option");
        option.textContent = "Voz padrão do sistema";
        seletorVozes.appendChild(option);
        return;
    }

    let indiceMaisNatural = 0;

    vozesPTBR.forEach((voz, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${voz.name} (${voz.lang})`;
        
        const nomeUpper = voz.name.toUpperCase();
        if (nomeUpper.includes("GOOGLE") || nomeUpper.includes("LUCIANA") || nomeUpper.includes("FELIPE") || nomeUpper.includes("FRANCISCA") || nomeUpper.includes("NATURAL")) {
            indiceMaisNatural = index;
        }
        seletorVozes.appendChild(option);
    });

    seletorVozes.selectedIndex = indiceMaisNatural;
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = carregarVozes;
    carregarVozes();
}

// Busca e gera a resposta inteira na própria página
async function buscarEResponder(termo) {
    statusBusca.classList.remove("esconder");
    caixaResultado.classList.add("esconder");

    try {
        // Tenta buscar o resumo completo na Wikipedia PT
        const urlWiki = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`;
        const resposta = await fetch(urlWiki);

        if (resposta.ok) {
            const dados = await resposta.json();
            if (dados.extract) {
                exibirResposta(dados.extract);
                return;
            }
        }

        // Se não achar na Wikipedia, consulta a API Instant Answers do DuckDuckGo
        buscarDuckDuckGo(termo);

    } catch (e) {
        buscarDuckDuckGo(termo);
    }
}

function buscarDuckDuckGo(termo) {
    const termoBusca = `engenharia automotiva ${termo}`;
    const scriptJSONP = document.createElement("script");

    window.processarDuckDuckGo = function(dados) {
        statusBusca.classList.add("esconder");

        let respostaTexto = "";

        if (dados.AbstractText && dados.AbstractText !== "") {
            respostaTexto = dados.AbstractText;
        } else if (dados.RelatedTopics && dados.RelatedTopics.length > 0 && dados.RelatedTopics[0].Text) {
            respostaTexto = dados.RelatedTopics[0].Text;
        } else {
            respostaTexto = `Não foi possível encontrar uma explicação técnica direta sobre "${termo}". Tente reformular a pergunta com palavras como "motor", "frenagem", "turbo", "suspensão" ou "bateria".`;
        }

        exibirResposta(respostaTexto);
        document.body.removeChild(scriptJSONP);
    };

    scriptJSONP.src = `https://api.duckduckgo.com/?q=${encodeURIComponent(termoBusca)}&format=json&pretty=1&kl=br-pt&callback=processarDuckDuckGo`;
    document.body.appendChild(scriptJSONP);
}

function processarPerguntaDigitada() {
    const textoPergunta = inputPergunta.value.trim();

    if (textoPergunta === "") {
        alert("Por favor, digite uma pergunta sobre engenharia automotiva.");
        return;
    }

    buscarEResponder(textoPergunta);
}

function exibirResposta(resposta) {
    statusBusca.classList.add("esconder");
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    respostaAtualTexto = resposta;
    textoResultado.textContent = respostaAtualTexto;
    
    caixaResultado.classList.remove("esconder");
}

function limparTextoParaFala(texto) {
    return texto
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[*_#@$%&\(\)\[\]\{\}\<\>]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Leitura de Voz em PT-BR
btnOuvir.addEventListener("click", () => {
    if (!('speechSynthesis' in window)) {
        alert("Seu navegador não suporta leitura por voz.");
        return;
    }

    window.speechSynthesis.cancel();

    const textoLimpo = limparTextoParaFala(respostaAtualTexto);
    const fala = new SpeechSynthesisUtterance(textoLimpo);
    
    fala.lang = 'pt-BR';
    fala.rate = 0.95;
    fala.pitch = 1.0;

    const indiceVoz = seletorVozes.value;
    if (vozesPTBR.length > 0 && indiceVoz !== "") {
        fala.voice = vozesPTBR[indiceVoz];
    }

    window.speechSynthesis.speak(fala);
});

btnPerguntar.addEventListener("click", processarPerguntaDigitada);

inputPergunta.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        processarPerguntaDigitada();
    }
});

btnNovaPergunta.addEventListener("click", () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    inputPergunta.value = "";
    caixaResultado.classList.add("esconder");
    inputPergunta.focus();
});