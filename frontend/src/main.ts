import "./style.css";

type AuthResponse = {
  token: string;
  user: { id: string; email: string; status?: string };
};

const API_BASE = "http://localhost:4000";

const state = {
  token: "",
  userEmail: ""
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Elemento #app não encontrado");
}

app.innerHTML = `
  <main class="container">
    <h1>Memória Digital Póstuma</h1>
    <p>Crie cartas e mensagens que só serão entregues após verificação de vida.</p>

    <section class="card">
      <h2>Autenticação</h2>
      <form id="auth-form" class="grid">
        <input id="email" type="email" placeholder="Email" required />
        <input id="password" type="password" placeholder="Senha (mín. 8)" required />
        <select id="verificationMode">
          <option value="checkin">Verificação por check-in</option>
          <option value="external_api">Verificação por API externa</option>
        </select>
        <div class="row">
          <button data-action="register" type="submit">Registrar</button>
          <button data-action="login" type="submit">Entrar</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Criar memória criptografada</h2>
      <form id="memory-form" class="grid">
        <input id="title" placeholder="Título" required />
        <select id="type">
          <option value="mensagem">Mensagem</option>
          <option value="carta">Carta</option>
          <option value="video">Vídeo</option>
          <option value="recomendacao">Recomendação</option>
        </select>
        <textarea id="content" placeholder="Conteúdo secreto" required></textarea>
        <input id="recipient" placeholder="Destinatário (nome/email)" required />
        <input id="vaultPassword" type="password" placeholder="Senha do cofre" required />
        <select id="deliveryMode">
          <option value="date">Entrega por data</option>
          <option value="event">Entrega por evento</option>
        </select>
        <input id="deliverAt" type="datetime-local" />
        <input id="eventName" placeholder="Nome do evento" />
        <button type="submit">Salvar memória</button>
      </form>
    </section>

    <section class="card">
      <h2>Verificação de vida</h2>
      <div class="row">
        <button id="checkin-btn">Fazer check-in</button>
        <button id="verify-btn">Verificar agora</button>
      </div>
    </section>

    <section class="card">
      <h2>Memórias</h2>
      <button id="refresh-btn">Atualizar lista</button>
      <ul id="memories"></ul>
    </section>

    <pre id="status" class="status">Pronto.</pre>
  </main>
`;

const statusEl = document.querySelector<HTMLPreElement>("#status")!;
const memoriesEl = document.querySelector<HTMLUListElement>("#memories")!;

function setStatus(message: string): void {
  statusEl.textContent = message;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (state.token) {
    headers.set("authorization", `Bearer ${state.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Erro inesperado");
  }

  return data as T;
}

document.querySelector<HTMLFormElement>("#auth-form")!.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitter = event.submitter as HTMLButtonElement | null;
  const action = submitter?.dataset.action;

  const email = (document.querySelector<HTMLInputElement>("#email")!).value;
  const password = (document.querySelector<HTMLInputElement>("#password")!).value;
  const verificationMode = (document.querySelector<HTMLSelectElement>("#verificationMode")!).value;

  try {
    const body = action === "register"
      ? { email, password, verificationMode }
      : { email, password };

    const endpoint = action === "register" ? "/auth/register" : "/auth/login";
    const data = await request<AuthResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(body)
    });

    state.token = data.token;
    state.userEmail = data.user.email;
    setStatus(`Autenticado como ${data.user.email}`);
    await loadMemories();
  } catch (error) {
    setStatus((error as Error).message);
  }
});

document.querySelector<HTMLFormElement>("#memory-form")!.addEventListener("submit", async (event) => {
  event.preventDefault();
  const deliveryMode = (document.querySelector<HTMLSelectElement>("#deliveryMode")!).value;
  const deliverAtValue = (document.querySelector<HTMLInputElement>("#deliverAt")!).value;

  const payload = {
    title: (document.querySelector<HTMLInputElement>("#title")!).value,
    type: (document.querySelector<HTMLSelectElement>("#type")!).value,
    content: (document.querySelector<HTMLTextAreaElement>("#content")!).value,
    recipient: (document.querySelector<HTMLInputElement>("#recipient")!).value,
    vaultPassword: (document.querySelector<HTMLInputElement>("#vaultPassword")!).value,
    deliveryMode,
    deliverAt: deliveryMode === "date" && deliverAtValue
      ? new Date(deliverAtValue).toISOString()
      : undefined,
    eventName: deliveryMode === "event"
      ? (document.querySelector<HTMLInputElement>("#eventName")!).value
      : undefined
  };

  try {
    await request("/memories", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setStatus("Memória criada com sucesso.");
    await loadMemories();
  } catch (error) {
    setStatus((error as Error).message);
  }
});

document.querySelector<HTMLButtonElement>("#checkin-btn")!.addEventListener("click", async () => {
  try {
    const data = await request<{ message: string; lastCheckInAt: string }>("/life/check-in", { method: "POST" });
    setStatus(`${data.message}: ${new Date(data.lastCheckInAt).toLocaleString()}`);
  } catch (error) {
    setStatus((error as Error).message);
  }
});

document.querySelector<HTMLButtonElement>("#verify-btn")!.addEventListener("click", async () => {
  try {
    const data = await request<{ status: string; delivered: number }>("/life/verify-now", { method: "POST" });
    setStatus(`Status: ${data.status} | Entregas liberadas: ${data.delivered}`);
    await loadMemories();
  } catch (error) {
    setStatus((error as Error).message);
  }
});

document.querySelector<HTMLButtonElement>("#refresh-btn")!.addEventListener("click", () => {
  void loadMemories();
});

async function loadMemories(): Promise<void> {
  if (!state.token) {
    memoriesEl.innerHTML = "<li>Faça login para listar memórias.</li>";
    return;
  }

  const data = await request<Array<{ title: string; type: string; deliveryMode: string; deliveredAt?: string }>>("/memories");

  if (data.length === 0) {
    memoriesEl.innerHTML = "<li>Nenhuma memória cadastrada.</li>";
    return;
  }

  memoriesEl.innerHTML = data
    .map(
      (memory) =>
        `<li><strong>${memory.title}</strong> (${memory.type}) - modo: ${memory.deliveryMode} - entregue: ${memory.deliveredAt ? "sim" : "não"}</li>`
    )
    .join("");
}
