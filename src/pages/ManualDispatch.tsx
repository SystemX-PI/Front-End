em comoimport {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import { ChannelStatus } from "../components/CommunicationQueue";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  PageHeading,
  Pagination,
  Skeleton,
} from "../components/DataUi";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
import OperationHistory from "../components/OperationHistory";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useResource } from "../hooks/useResource";
import {
  apiRequest,
  backend,
  type CommunicationResponse,
  type PageResponse,
  type ProcessResponse,
  type QueueItem,
  type UserResponse,
} from "../services/backend";
import { digits, formatDate, formatPhone, readable } from "../services/format";
import { notify } from "../services/notifications";

type Feedback = { message: string; kind: "info" | "success" | "error" } | null;
type ChannelMode = "WHATSAPP" | "RESEND";
type SourceTab = "QUEUE" | "CLIENTS";
type TemplateKey = "contemplacao" | "documentos" | "baixa" | "livre";

interface MessageTemplate {
  key: TemplateKey;
  label: string;
  description: string;
  build: (context: {
    processoId: number | null;
    idExterno?: string | null;
    recipientName?: string;
  }) => string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: "contemplacao",
    label: "Aviso de contemplação",
    description: "Comunica a contemplação da cota e orienta os próximos passos.",
    build: ({ processoId, idExterno, recipientName }) => {
      const greeting = recipientName ? `Olá, ${recipientName}!` : "Olá!";
      const reference = idExterno
        ? `processo #${processoId ?? "—"} (${idExterno})`
        : `processo #${processoId ?? "—"}`;
      return `${greeting} Informamos que o seu ${reference} foi contemplado no ConsorTech. Entre em contato com a nossa equipe ou acesse o portal do consorciado para conferir as orientações e dar andamento à liberação do crédito.`;
    },
  },
  {
    key: "documentos",
    label: "Solicitação de documentos",
    description: "Pede o envio ou complementação de documentos para análise.",
    build: ({ processoId, idExterno, recipientName }) => {
      const greeting = recipientName ? `Olá, ${recipientName}!` : "Olá!";
      const reference = idExterno
        ? `processo #${processoId ?? "—"} (${idExterno})`
        : `processo #${processoId ?? "—"}`;
      return `${greeting} Referente ao ${reference}, aguardamos o envio da documentação pendente para prosseguirmos com a análise cadastral da sua contemplação. Caso já tenha enviado, desconsidere esta mensagem.`;
    },
  },
  {
    key: "baixa",
    label: "Conferência e baixa",
    description: "Informa que o processo está em etapa final de conferência.",
    build: ({ processoId, idExterno, recipientName }) => {
      const greeting = recipientName ? `Olá, ${recipientName}!` : "Olá!";
      const reference = idExterno
        ? `processo #${processoId ?? "—"} (${idExterno})`
        : `processo #${processoId ?? "—"}`;
      return `${greeting} Atualização sobre o ${reference}: sua documentação foi conferida e o processo encontra-se na etapa de conclusão e baixa operacional.`;
    },
  },
  {
    key: "livre",
    label: "Mensagem livre",
    description: "Redija um comunicado personalizado para o destinatário.",
    build: ({ processoId, recipientName }) => {
      const greeting = recipientName ? `Olá, ${recipientName}! ` : "Olá! ";
      return `${greeting}Entramos em contato sobre o processo de contemplação #${processoId ?? "—"}.`;
    },
  },
];

function parseInitialProcessId(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function ManualDispatch() {
  const [params, setParams] = useSearchParams();
  const initialId = parseInitialProcessId(params.get("processo"));

  const [sourceTab, setSourceTab] = useState<SourceTab>("QUEUE");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatus, setQueueStatus] = useState("");
  const [queuePage, setQueuePage] = useState(1);
  const debouncedQueueSearch = useDebouncedValue(queueSearch);

  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const debouncedClientSearch = useDebouncedValue(clientSearch);

  const [processInput, setProcessInput] = useState(
    initialId ? String(initialId) : "",
  );
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(
    initialId,
  );
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(
    null,
  );
  const [selectedClient, setSelectedClient] = useState<UserResponse | null>(
    null,
  );

  const [channelMode, setChannelMode] = useState<ChannelMode>("WHATSAPP");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("contemplacao");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(() =>
    initialId
      ? MESSAGE_TEMPLATES[0].build({ processoId: initialId })
      : "",
  );

  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [manualCommOverride, setManualCommOverride] =
    useState<CommunicationResponse | null>(null);
  const [historyRevision, setHistoryRevision] = useState(0);

  const loadQueue = useCallback(
    (signal: AbortSignal) =>
      backend.integrations.queuePage(
        queuePage - 1,
        debouncedQueueSearch,
        queueStatus,
        signal,
      ),
    [queuePage, debouncedQueueSearch, queueStatus],
  );
  const queueResource = useResource(loadQueue);

  const loadClients = useCallback(
    (signal: AbortSignal) =>
      apiRequest<PageResponse<UserResponse>>(
        `/api/clientes/pagina?${new URLSearchParams({
          page: String(clientPage - 1),
          size: "10",
          q: debouncedClientSearch,
        })}`,
        { signal },
      ),
    [clientPage, debouncedClientSearch],
  );
  const clientsResource = useResource(loadClients);

  const loadSelectedTarget = useCallback(
    async (signal: AbortSignal) => {
      if (selectedProcessId === null) {
        return {
          process: null as ProcessResponse | null,
          communication: null as CommunicationResponse | null,
        };
      }
      const [processResult, commResult] = await Promise.allSettled([
        apiRequest<ProcessResponse>(
          `/api/processos-contemplacao/${selectedProcessId}`,
          { signal },
        ),
        apiRequest<CommunicationResponse>(
          `/api/integracoes/processos/${selectedProcessId}/comunicacao`,
          { signal },
        ),
      ]);
      if (
        processResult.status === "rejected" &&
        commResult.status === "rejected"
      ) {
        throw processResult.reason instanceof Error
          ? processResult.reason
          : new Error("Não foi possível consultar o processo selecionado.");
      }
      return {
        process:
          processResult.status === "fulfilled" ? processResult.value : null,
        communication:
          commResult.status === "fulfilled" ? commResult.value : null,
      };
    },
    [selectedProcessId],
  );
  const targetResource = useResource(loadSelectedTarget);

  const queueItems = queueResource.data?.items || [];
  const matchedQueueItem =
    selectedQueueItem?.processoId === selectedProcessId
      ? selectedQueueItem
      : queueItems.find((item) => item.processoId === selectedProcessId) ||
        null;

  const activeProcess = targetResource.data?.process || null;
  const activeCommunication =
    manualCommOverride?.processoId === selectedProcessId
      ? manualCommOverride
      : targetResource.data?.communication ||
        matchedQueueItem?.comunicacao ||
        null;

  const defaultWhatsappRecipient =
    activeCommunication?.whatsapp?.destinatario ||
    matchedQueueItem?.comunicacao.whatsapp?.destinatario ||
    "";
  const effectivePhone =
    phone || (defaultWhatsappRecipient ? formatPhone(defaultWhatsappRecipient) : "");

  function selectProcessFromQueue(item: QueueItem) {
    setSelectedProcessId(item.processoId);
    setSelectedQueueItem(item);
    setProcessInput(String(item.processoId));
    setManualCommOverride(item.comunicacao);
    setFeedback(null);
    setParams({ processo: String(item.processoId) }, { replace: true });

    const candidatePhone = item.comunicacao.whatsapp?.destinatario || "";
    setPhone(candidatePhone ? formatPhone(candidatePhone) : "");

    const activeTemplate =
      MESSAGE_TEMPLATES.find((itemTemplate) => itemTemplate.key === templateKey) ||
      MESSAGE_TEMPLATES[0];
    setMessage(
      activeTemplate.build({
        processoId: item.processoId,
        idExterno: item.idExterno,
        recipientName: selectedClient?.nome,
      }),
    );
  }

  function handleDirectLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(processInput.trim());
    if (!Number.isSafeInteger(id) || id <= 0) {
      setFeedback({
        kind: "error",
        message: "Informe um identificador numérico de processo maior que zero.",
      });
      return;
    }
    setFeedback(null);
    setSelectedProcessId(id);
    const inQueue = queueItems.find((item) => item.processoId === id) || null;
    setSelectedQueueItem(inQueue);
    setManualCommOverride(inQueue?.comunicacao || null);
    setParams({ processo: String(id) }, { replace: true });

    if (inQueue?.comunicacao.whatsapp?.destinatario) {
      setPhone(formatPhone(inQueue.comunicacao.whatsapp.destinatario));
    }
    if (!message.trim()) {
      const activeTemplate =
        MESSAGE_TEMPLATES.find((itemTemplate) => itemTemplate.key === templateKey) ||
        MESSAGE_TEMPLATES[0];
      setMessage(
        activeTemplate.build({
          processoId: id,
          idExterno: inQueue?.idExterno,
          recipientName: selectedClient?.nome,
        }),
      );
    }
  }

  function applyTemplate(nextKey: TemplateKey, recipientOverride?: string) {
    setTemplateKey(nextKey);
    const template =
      MESSAGE_TEMPLATES.find((item) => item.key === nextKey) ||
      MESSAGE_TEMPLATES[0];
    setMessage(
      template.build({
        processoId: selectedProcessId,
        idExterno: matchedQueueItem?.idExterno,
        recipientName: recipientOverride ?? selectedClient?.nome,
      }),
    );
  }

  function handleSelectClient(client: UserResponse) {
    setSelectedClient(client);
    const template =
      MESSAGE_TEMPLATES.find((item) => item.key === templateKey) ||
      MESSAGE_TEMPLATES[0];
    setMessage(
      template.build({
        processoId: selectedProcessId,
        idExterno: matchedQueueItem?.idExterno,
        recipientName: client.nome,
      }),
    );
    setFeedback({
      kind: "info",
      message: `Cliente ${client.nome} (${client.email}) vinculado à saudação da mensagem. Confirme o processo contemplado antes de disparar.`,
    });
  }

  function requestDispatchConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (selectedProcessId === null) {
      setFeedback({
        kind: "error",
        message:
          "Selecione um processo na fila ou consulte pelo ID antes de disparar a mensagem.",
      });
      return;
    }

    if (channelMode === "WHATSAPP") {
      const rawDigits = digits(effectivePhone);
      if (rawDigits.length < 10 || rawDigits.length > 15) {
        setFeedback({
          kind: "error",
          message:
            "Informe um telefone válido com DDD (entre 10 e 15 dígitos) para o disparo via WhatsApp.",
        });
        return;
      }
      if (!message.trim()) {
        setFeedback({
          kind: "error",
          message: "Digite o conteúdo da mensagem antes de solicitar o disparo.",
        });
        return;
      }
      if (message.trim().length > 1000) {
        setFeedback({
          kind: "error",
          message: "A mensagem deve ter no máximo 1.000 caracteres.",
        });
        return;
      }
    }

    setFeedback(null);
    setConfirmOpen(true);
  }

  async function executeManualDispatch() {
    if (selectedProcessId === null || sending) return;
    setConfirmOpen(false);
    setSending(true);
    setFeedback(null);

    try {
      if (channelMode === "WHATSAPP") {
        const cleanPhone = digits(effectivePhone);
        const cleanMessage = message.trim();
        const response = await backend.processes.sendWhatsApp(
          selectedProcessId,
          cleanPhone,
          cleanMessage,
        );
        setManualCommOverride(response);
        setHistoryRevision((value) => value + 1);
        queueResource.refresh();

        const whatsappError = response.whatsapp?.erro;
        const whatsappStatus = response.whatsapp?.status;
        if (whatsappError || whatsappStatus === "FALHA") {
          const errorMsg =
            whatsappError ||
            "O backend registrou falha ao tentar enviar a mensagem pelo WhatsApp.";
          setFeedback({ kind: "error", message: errorMsg });
          notify(errorMsg, "error");
        } else if (whatsappStatus === "SUCESSO" || whatsappStatus === "REALIZADA") {
          const successMsg = `Disparo manual de WhatsApp confirmado para o processo #${selectedProcessId} (${formatPhone(cleanPhone)}).`;
          setFeedback({ kind: "success", message: successMsg });
          notify(successMsg, "success");
        } else {
          const pendingMsg = `Solicitação registrada para o processo #${selectedProcessId}. Status retornado: ${readable(whatsappStatus || response.statusGeral)}.`;
          setFeedback({ kind: "info", message: pendingMsg });
          notify(pendingMsg, "info");
        }
      } else {
        const response =
          await backend.processes.resendCommunication(selectedProcessId);
        setManualCommOverride(response);
        setHistoryRevision((value) => value + 1);
        queueResource.refresh();

        const errors = [response.email?.erro, response.whatsapp?.erro]
          .filter(Boolean)
          .join(" ");
        if (errors) {
          setFeedback({ kind: "error", message: errors });
          notify(errors, "error");
        } else if (response.statusGeral !== "PENDENTE") {
          const successMsg = `Reenvio oficial processado para o processo #${selectedProcessId}. Status geral: ${readable(response.statusGeral)}.`;
          setFeedback({ kind: "success", message: successMsg });
          notify(successMsg, "success");
        } else {
          const infoMsg = `Reenvio solicitado para o processo #${selectedProcessId}, mas o status permanece pendente. Verifique a configuração dos canais no servidor.`;
          setFeedback({ kind: "info", message: infoMsg });
          notify(infoMsg, "info");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o disparo manual.";
      setFeedback({ kind: "error", message: errorMessage });
      notify(errorMessage, "error");
    } finally {
      setSending(false);
    }
  }

  const metrics = [
    {
      label: "Processos na página",
      value: queueItems.length,
      icon: Send,
      tone: "blue",
    },
    {
      label: "Pendentes de envio",
      value: queueItems.filter(
        (item) => item.comunicacao.statusGeral === "PENDENTE",
      ).length,
      icon: Clock3,
      tone: "amber",
    },
    {
      label: "Comunicados",
      value: queueItems.filter(
        (item) => item.comunicacao.statusGeral !== "PENDENTE",
      ).length,
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Canais com falha",
      value: queueItems.filter(
        (item) =>
          item.comunicacao.email?.status === "FALHA" ||
          item.comunicacao.whatsapp?.status === "FALHA",
      ).length,
      icon: TriangleAlert,
      tone: "red",
    },
  ];

  return (
    <AdminShell
      title="Disparo manual"
      subtitle="Envio individual de mensagens e acompanhamento por processo contemplado"
    >
      <ConfirmDialog
        open={confirmOpen}
        title={
          channelMode === "WHATSAPP"
            ? `Disparar WhatsApp para o processo #${selectedProcessId}?`
            : `Reenviar comunicação oficial do processo #${selectedProcessId}?`
        }
        description={
          channelMode === "WHATSAPP"
            ? `A mensagem personalizada será enviada ao número ${effectivePhone || "informado"} através do endpoint oficial de WhatsApp do processo #${selectedProcessId}.`
            : `O backend disparará o comunicado padrão nos canais configurados (E-mail e WhatsApp) do processo #${selectedProcessId}.`
        }
        confirmLabel={
          channelMode === "WHATSAPP"
            ? "Confirmar disparo"
            : "Confirmar reenvio"
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void executeManualDispatch()}
      />

      <PageHeading
        eyebrow="OPERAÇÃO DE COMUNICAÇÃO"
        title="Disparo manual de mensagens"
        description="Selecione um processo contemplado na fila ou consulte pelo identificador, personalize a mensagem de WhatsApp ou acione o reenvio nos canais oficiais."
        action={
          <div className="split-actions">
            <Link className="button secondary compact" to="/admin/comunicacao">
              Fila de comunicação
            </Link>
            <Link className="button secondary compact" to="/admin/contemplados">
              Consultar contemplados <ArrowRight size={15} />
            </Link>
          </div>
        }
      />

      <section className="admin-metrics" aria-label="Indicadores de disparo">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <article className={`metric-card metric-${tone}`} key={label}>
            <Icon size={22} />
            <span>
              <strong>
                {queueResource.loading || queueResource.error ? "—" : value}
              </strong>
              <small>{label}</small>
            </span>
          </article>
        ))}
      </section>

      <div className="manual-dispatch-grid">
        <aside className="panel data-panel dispatch-selector-panel">
          <div className="data-panel-heading">
            <div>
              <h3>1. Selecionar destinatário</h3>
              <p>
                Busque na fila de processos contemplados, consulte um ID direto
                ou localize um cliente cadastrado.
              </p>
            </div>
            <button
              type="button"
              className="button secondary compact"
              onClick={() => {
                queueResource.refresh();
                clientsResource.refresh();
              }}
              disabled={queueResource.loading}
            >
              <RefreshCw size={15} />
              Atualizar
            </button>
          </div>

          <form
            className="dispatch-direct-lookup"
            onSubmit={handleDirectLookup}
          >
            <label className="field">
              <span>ID do processo contemplado</span>
              <div className="dispatch-lookup-row">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex.: 7"
                  value={processInput}
                  onChange={(event) => setProcessInput(event.target.value)}
                />
                <button type="submit" className="button secondary compact">
                  <Search size={15} />
                  Carregar ID
                </button>
              </div>
            </label>
          </form>

          <div
            className="dispatch-source-tabs"
            role="tablist"
            aria-label="Fontes de busca"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sourceTab === "QUEUE"}
              className={
                sourceTab === "QUEUE"
                  ? "dispatch-tab active"
                  : "dispatch-tab"
              }
              onClick={() => setSourceTab("QUEUE")}
            >
              <Send size={14} />
              Fila de processos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sourceTab === "CLIENTS"}
              className={
                sourceTab === "CLIENTS"
                  ? "dispatch-tab active"
                  : "dispatch-tab"
              }
              onClick={() => setSourceTab("CLIENTS")}
            >
              <UserRound size={14} />
              Clientes cadastrados
            </button>
          </div>

          {sourceTab === "QUEUE" ? (
            <>
              <div className="list-toolbar">
                <label className="search-control">
                  <Search size={16} />
                  <input
                    aria-label="Buscar processo na fila"
                    placeholder="ID, código externo, e-mail ou telefone"
                    value={queueSearch}
                    onChange={(event) => {
                      setQueueSearch(event.target.value);
                      setQueuePage(1);
                    }}
                  />
                </label>
                <select
                  aria-label="Filtrar status na fila"
                  value={queueStatus}
                  onChange={(event) => {
                    setQueueStatus(event.target.value);
                    setQueuePage(1);
                  }}
                >
                  <option value="">Todos os status</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="COMUNICADO_PARCIAL">Envio parcial</option>
                  <option value="COMUNICADO_NOS_DOIS">Dois canais</option>
                  <option value="FALHA">Com falha</option>
                </select>
              </div>

              {queueResource.error ? (
                <ErrorState
                  message={queueResource.error}
                  retry={queueResource.refresh}
                />
              ) : queueResource.loading ? (
                <Skeleton rows={3} />
              ) : !queueItems.length ? (
                <EmptyState
                  title="Nenhum processo encontrado na fila"
                  description="Ajuste os filtros ou informe diretamente o ID do processo no campo acima."
                />
              ) : (
                <>
                  <div
                    className="dispatch-recipient-list"
                    role="listbox"
                    aria-label="Processos disponíveis para disparo"
                  >
                    {queueItems.map((item) => {
                      const isSelected = item.processoId === selectedProcessId;
                      return (
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          key={item.processoId}
                          className={
                            isSelected
                              ? "dispatch-recipient-item active"
                              : "dispatch-recipient-item"
                          }
                          onClick={() => selectProcessFromQueue(item)}
                        >
                          <div className="dispatch-recipient-top">
                            <strong>
                              {item.idExterno || `Processo #${item.processoId}`}
                            </strong>
                            <StatusPill
                              tone={
                                item.comunicacao.statusGeral === "PENDENTE"
                                  ? "amber"
                                  : item.comunicacao.email?.status ===
                                        "FALHA" ||
                                      item.comunicacao.whatsapp?.status ===
                                        "FALHA"
                                    ? "red"
                                    : "green"
                              }
                            >
                              {readable(item.comunicacao.statusGeral)}
                            </StatusPill>
                          </div>
                          <small className="dispatch-recipient-sub">
                            Processo #{item.processoId} ·{" "}
                            {item.origem || "Integração"} ·{" "}
                            {formatDate(item.recebidaEm)}
                          </small>
                          <div className="dispatch-recipient-channels">
                            <span>
                              <MessageCircle size={13} />
                              {item.comunicacao.whatsapp?.destinatario
                                ? formatPhone(
                                    item.comunicacao.whatsapp.destinatario,
                                  )
                                : "Sem telefone"}
                            </span>
                            <span>
                              <Mail size={13} />
                              {item.comunicacao.email?.destinatario ||
                                "Sem e-mail"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Pagination
                    total={queueResource.data?.total || 0}
                    page={queuePage}
                    onChange={setQueuePage}
                    size={20}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <label className="search-control">
                <Search size={16} />
                <input
                  aria-label="Buscar cliente cadastrado"
                  placeholder="Buscar cliente por nome ou e-mail"
                  value={clientSearch}
                  onChange={(event) => {
                    setClientSearch(event.target.value);
                    setClientPage(1);
                  }}
                />
              </label>
              <p className="subtle-note">
                Selecione um cliente para personalizar a saudação da mensagem. O
                contrato atual de usuários retorna nome e e-mail; o disparo
                permanece vinculado ao ID do processo contemplado.
              </p>
              {clientsResource.error ? (
                <ErrorState
                  message={clientsResource.error}
                  retry={clientsResource.refresh}
                />
              ) : clientsResource.loading ? (
                <Skeleton rows={3} />
              ) : !clientsResource.data?.items.length ? (
                <EmptyState
                  title="Nenhum cliente encontrado"
                  description="Não há clientes para o filtro informado."
                />
              ) : (
                <>
                  <div className="dispatch-recipient-list">
                    {clientsResource.data.items.map((client) => {
                      const isSelected = selectedClient?.id === client.id;
                      return (
                        <button
                          type="button"
                          key={client.id}
                          className={
                            isSelected
                              ? "dispatch-recipient-item active"
                              : "dispatch-recipient-item"
                          }
                          onClick={() => handleSelectClient(client)}
                        >
                          <div className="dispatch-recipient-top">
                            <strong>{client.nome}</strong>
                            <StatusPill
                              tone={client.ativo ? "green" : "neutral"}
                            >
                              {client.ativo ? "Ativo" : "Inativo"}
                            </StatusPill>
                          </div>
                          <small className="dispatch-recipient-sub">
                            Cliente #{client.id} · {client.email}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <Pagination
                    total={clientsResource.data.total || 0}
                    page={clientPage}
                    onChange={setClientPage}
                    size={10}
                  />
                </>
              )}
            </>
          )}
        </aside>

        <div className="dispatch-main-column">
          <section className="panel data-panel">
            <div className="data-panel-heading">
              <div>
                <h3>2. Contexto do processo e destinatário</h3>
                <p>
                  Confira os dados retornados pelo backend antes de acionar o
                  disparo manual.
                </p>
              </div>
              {selectedProcessId !== null ? (
                <button
                  type="button"
                  className="button secondary compact"
                  onClick={targetResource.refresh}
                  disabled={targetResource.loading}
                >
                  <RefreshCw size={15} />
                  Recarregar processo
                </button>
              ) : null}
            </div>

            {selectedProcessId === null ? (
              <EmptyState
                title="Nenhum processo selecionado"
                description="Escolha um registro na fila ao lado ou digite o ID do processo contemplado para carregar os canais de comunicação."
              />
            ) : targetResource.loading && !activeCommunication && !activeProcess ? (
              <Skeleton rows={2} />
            ) : targetResource.error && !activeCommunication && !activeProcess ? (
              <ErrorState
                message={targetResource.error}
                retry={targetResource.refresh}
              />
            ) : (
              <>
                <div className="dispatch-context-summary">
                  <div className="dispatch-context-header">
                    <div>
                      <span className="eyebrow">PROCESSO SELECIONADO</span>
                      <h4>
                        Processo #{selectedProcessId}
                        {matchedQueueItem?.idExterno
                          ? ` · ${matchedQueueItem.idExterno}`
                          : ""}
                      </h4>
                    </div>
                    <div className="split-actions">
                      {activeProcess?.status ||
                      matchedQueueItem?.statusProcesso ? (
                        <StatusPill
                          tone={
                            (activeProcess?.status ||
                              matchedQueueItem?.statusProcesso) === "FINALIZADO"
                              ? "green"
                              : "blue"
                          }
                        >
                          {readable(
                            activeProcess?.status ||
                              matchedQueueItem?.statusProcesso ||
                              "EM_COMUNICACAO",
                          )}
                        </StatusPill>
                      ) : null}
                      {activeCommunication ? (
                        <StatusPill
                          tone={
                            activeCommunication.statusGeral === "PENDENTE"
                              ? "amber"
                              : "green"
                          }
                        >
                          {readable(activeCommunication.statusGeral)}
                        </StatusPill>
                      ) : null}
                    </div>
                  </div>

                  <dl className="dispatch-meta-grid">
                    <div>
                      <dt>ID do processo</dt>
                      <dd>#{selectedProcessId}</dd>
                    </div>
                    <div>
                      <dt>Contemplação</dt>
                      <dd>
                        {activeProcess
                          ? `#${activeProcess.contemplacaoId}`
                          : "Não informado"}
                      </dd>
                    </div>
                    <div>
                      <dt>Origem / Código externo</dt>
                      <dd>
                        {matchedQueueItem?.origem || "ConsorTech"} ·{" "}
                        {matchedQueueItem?.idExterno || "Consulta direta"}
                      </dd>
                    </div>
                    <div>
                      <dt>Última atualização</dt>
                      <dd>
                        {formatDate(
                          activeProcess?.atualizadoEm ||
                            matchedQueueItem?.recebidaEm,
                        )}
                      </dd>
                    </div>
                    {selectedClient ? (
                      <div className="span-2">
                        <dt>Cliente em atendimento</dt>
                        <dd>
                          {selectedClient.nome} ({selectedClient.email})
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="channel-grid">
                    <ChannelStatus
                      channel={activeCommunication?.whatsapp ?? null}
                      name="WhatsApp"
                    />
                    <ChannelStatus
                      channel={activeCommunication?.email ?? null}
                      name="E-mail"
                    />
                  </div>
                </div>
              </>
            )}
          </section>

          <form
            className="panel data-panel dispatch-composer-panel"
            onSubmit={requestDispatchConfirmation}
          >
            <div className="data-panel-heading">
              <div>
                <h3>3. Configurar canal e mensagem</h3>
                <p>
                  Escolha a modalidade de envio compatível com os endpoints
                  disponíveis no backend.
                </p>
              </div>
              <StatusPill tone="blue">
                {channelMode === "WHATSAPP"
                  ? "WhatsApp personalizado"
                  : "Reenvio multicanal"}
              </StatusPill>
            </div>

            <div
              className="dispatch-channel-cards"
              role="radiogroup"
              aria-label="Canal de comunicação"
            >
              <button
                type="button"
                role="radio"
                aria-checked={channelMode === "WHATSAPP"}
                className={
                  channelMode === "WHATSAPP"
                    ? "dispatch-channel-card active"
                    : "dispatch-channel-card"
                }
                onClick={() => {
                  setChannelMode("WHATSAPP");
                  setFeedback(null);
                }}
              >
                <div className="dispatch-channel-card-head">
                  <span className="service-icon icon-green">
                    <MessageCircle size={19} />
                  </span>
                  <div>
                    <strong>WhatsApp — Mensagem personalizada</strong>
                    <small>
                      Permite informar o telefone do destinatário e redigir o
                      texto da mensagem.
                    </small>
                  </div>
                </div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={channelMode === "RESEND"}
                className={
                  channelMode === "RESEND"
                    ? "dispatch-channel-card active"
                    : "dispatch-channel-card"
                }
                onClick={() => {
                  setChannelMode("RESEND");
                  setFeedback(null);
                }}
              >
                <div className="dispatch-channel-card-head">
                  <span className="service-icon icon-red">
                    <Mail size={19} />
                  </span>
                  <div>
                    <strong>E-mail e Canais Padrão — Reenvio oficial</strong>
                    <small>
                      Aciona o disparo automático do servidor nos canais
                      registrados do processo.
                    </small>
                  </div>
                </div>
              </button>
            </div>

            {channelMode === "WHATSAPP" ? (
              <div className="dispatch-whatsapp-workspace">
                <div className="dispatch-form-column">
                  <label className="field">
                    <span>Telefone / WhatsApp do destinatário</span>
                    <div className="input-with-icon">
                      <Phone size={17} aria-hidden="true" />
                      <input
                        type="tel"
                        required
                        placeholder="+55 (11) 99999-9999"
                        value={effectivePhone}
                        onChange={(event) =>
                          setPhone(formatPhone(event.target.value))
                        }
                      />
                    </div>
                    <small>
                      Informe o código do país (55) + DDD + número. Apenas os
                      dígitos são enviados à API.
                    </small>
                  </label>

                  <div className="dispatch-templates-block">
                    <span className="dispatch-label">
                      <Sparkles size={14} /> Modelos rápidos de mensagem
                    </span>
                    <div className="dispatch-template-pills">
                      {MESSAGE_TEMPLATES.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={
                            templateKey === item.key
                              ? "button primary compact"
                              : "button secondary compact"
                          }
                          onClick={() => applyTemplate(item.key)}
                        >
                          <FileText size={13} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="field">
                    <span>Mensagem para envio</span>
                    <textarea
                      rows={5}
                      required
                      maxLength={1000}
                      placeholder="Digite a mensagem que será enviada para o WhatsApp do cliente contemplado..."
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                    <div className="dispatch-char-counter">
                      <small>
                        Endpoint:{" "}
                        <code>
                          POST /api/integracoes/processos/
                          {selectedProcessId ?? "{id}"}/comunicacao/whatsapp
                        </code>
                      </small>
                      <small>{message.trim().length}/1000 caracteres</small>
                    </div>
                  </label>
                </div>

                <aside
                  className="dispatch-preview-card"
                  aria-label="Prévia da mensagem"
                >
                  <div className="dispatch-preview-header">
                    <MessageCircle size={16} />
                    <div>
                      <strong>Prévia no WhatsApp</strong>
                      <small>
                        Destinatário:{" "}
                        {effectivePhone || "Telefone não informado"}
                      </small>
                    </div>
                  </div>
                  <div className="dispatch-preview-bubble">
                    <p>
                      {message.trim() ||
                        "Sua mensagem aparecerá aqui conforme você digitar ou selecionar um modelo acima."}
                    </p>
                    <span className="dispatch-preview-meta">
                      ConsorTech · Processo #{selectedProcessId ?? "—"}
                    </span>
                  </div>
                  <p className="subtle-note">
                    O envio depende da instância Evolution API estar conectada
                    no ambiente. Qualquer falha do provedor será exibida
                    fielmente abaixo.
                  </p>
                </aside>
              </div>
            ) : (
              <div className="dispatch-resend-info">
                <InlineFeedback
                  kind="info"
                  message="Nota técnica de contrato: o backend expõe personalização de destinatário e texto livre exclusivamente para o canal WhatsApp (POST /api/integracoes/processos/{id}/comunicacao/whatsapp). Para E-mail, o envio utiliza o template e o endereço cadastrados no servidor por meio da rota de reenvio oficial (POST /api/integracoes/processos/{id}/comunicacao/reenvio)."
                />
                <div className="dispatch-resend-targets">
                  <div>
                    <strong>Destinatário de E-mail vinculado</strong>
                    <p>
                      {activeCommunication?.email?.destinatario ||
                        "Nenhum destinatário de e-mail retornado para este processo."}
                    </p>
                  </div>
                  <div>
                    <strong>Destinatário de WhatsApp vinculado</strong>
                    <p>
                      {activeCommunication?.whatsapp?.destinatario
                        ? formatPhone(activeCommunication.whatsapp.destinatario)
                        : "Nenhum telefone retornado para este processo."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {feedback ? (
              <InlineFeedback kind={feedback.kind} message={feedback.message} />
            ) : null}

            <div className="partner-form-actions">
              <p>
                Nenhuma entrega é simulada na interface: o status exibido
                reflete exclusivamente o retorno real do backend.
              </p>
              <button
                type="submit"
                className="button primary"
                disabled={sending || selectedProcessId === null}
              >
                {sending ? (
                  <>
                    <span className="spinner" />
                    Enviando disparo…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {channelMode === "WHATSAPP"
                      ? "Disparar WhatsApp"
                      : "Solicitar reenvio oficial"}
                  </>
                )}
              </button>
            </div>
          </form>

          {selectedProcessId !== null ? (
            <OperationHistory
              key={`${selectedProcessId}-${historyRevision}`}
              processId={selectedProcessId}
            />
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
