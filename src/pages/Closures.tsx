import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from "../components/DataUi";
import { InlineFeedback } from "../components/IntegrationUi";
import {
  backend,
  type ProcessResponse,
  type ClosureResponse,
} from "../services/backend";
import { useResource } from "../hooks/useResource";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { operationError } from "../services/operationErrors";
import { formatDate, readable } from "../services/format";

export default function Closures() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(params.get("q") || "");
  const q = useDebouncedValue(search);
  const finalized = params.get("status") === "FINALIZADO";
  const load = useCallback(
    (signal: AbortSignal) =>
      backend.operation.closures(page - 1, q, finalized ? "FINALIZADO" : "EM_PROCESSO_DE_BAIXA", signal).catch(operationError),
    [page, q, finalized],
  );
  const list = useResource(load);

  const paramProcessId = params.get("processo") || "";
  const [input, setInput] = useState({ param: paramProcessId, value: paramProcessId });
  const id = input.param === paramProcessId ? input.value : (paramProcessId);
  const setId = (value: string) => setInput({ param: paramProcessId, value });
  const [process, setProcess] = useState<ProcessResponse | null>(null);
  const [closure, setClosure] = useState<ClosureResponse | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  const lookupById = useCallback(async (rawId: string, signal?: AbortSignal) => {
    setBusy(true);
    setError("");
    setProcess(null);
    setClosure(null);
    setNote("");
    try {
      const value = Number(rawId);
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error("Informe um processo válido.");
      }
      const p = await backend.processes.get(value, signal);
      if (signal?.aborted) return;
      if (!p || !Number.isSafeInteger(p.id) || typeof p.status !== "string") {
        throw new Error(
          "O servidor retornou dados incompletos para o processo.",
        );
      }
      setProcess(p);
      if (p.status === "FINALIZADO") {
        const c = await backend.processes.getClosure(value, signal).catch(() => null);
        if (!signal?.aborted) setClosure(c);
      }
    } catch (e) {
      if (!signal?.aborted) setError((e as Error).message);
    } finally {
      if (!signal?.aborted) setBusy(false);
    }
  }, [setBusy, setError, setProcess, setClosure, setNote]);

  useEffect(() => {
    const trimmed = paramProcessId.trim();
    if (!trimmed) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void lookupById(trimmed, controller.signal);
    });
    return () => controller.abort();
  }, [paramProcessId, lookupById]);

  async function inspect(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const trimmed = id.trim();
    const nextParams: Record<string, string> = {};
    if (search) nextParams.q = search;
    if (finalized) nextParams.status = "FINALIZADO";
    if (page > 1) nextParams.page = String(page);
    if (trimmed) nextParams.processo = trimmed;
    if (trimmed && trimmed !== paramProcessId) {
      setParams(nextParams, { replace: true });
      return;
    }
    await lookupById(trimmed);
  }

  async function close() {
    if (!process || busy) return;
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const result = await backend.processes.createClosure(
        process.id,
        note.trim(),
      );
      setClosure(result);
      setProcess({ ...process, status: "FINALIZADO" });
      list.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const validItems = (Array.isArray(list.data?.items) ? list.data.items : []).filter(
    (p): p is ProcessResponse =>
      Boolean(p && Number.isSafeInteger(p.id) && typeof p.status === "string"),
  );

  return (
    <AdminShell
      title="Baixas pendentes"
      subtitle="Confira o processo antes de concluir a baixa"
    >
      <section className="panel data-panel">
        <h2>{finalized ? "Baixas concluídas" : "Processos em baixa"}</h2>
        <label className="field">
          Situação da baixa
          <select value={finalized ? "FINALIZADO" : ""} onChange={event => {
            const next = new URLSearchParams(params);
            next.delete("page");
            if (event.target.value) next.set("status", event.target.value);
            else next.delete("status");
            setParams(next);
          }}>
            <option value="">Pendentes</option>
            <option value="FINALIZADO">Concluídas</option>
          </select>
        </label>
        <label className="field">
          Buscar processos
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              const nextParams: Record<string, string> = {
                q: e.target.value,
                page: "1",
              };
              if (finalized) nextParams.status = "FINALIZADO";
              if (paramProcessId) nextParams.processo = paramProcessId;
              setParams(nextParams);
            }}
          />
        </label>
        {list.loading ? (
          <Skeleton />
        ) : list.error ? (
          <ErrorState message={list.error} retry={list.refresh} />
        ) : validItems.length ? (
          <>
            <div className="table-scroll">
              <table className="admin-table admin-table-cards" role="table">
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader" scope="col">Processo</th>
                    <th role="columnheader" scope="col">Status</th>
                    <th role="columnheader" scope="col">Atualizado em</th>
                    <th role="columnheader" scope="col">Ação</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {validItems.map((p) => (
                    <tr role="row" key={p.id}>
                      <td role="cell" data-label="Processo">#{p.id}</td>
                      <td role="cell" data-label="Status">{readable(p.status)}</td>
                      <td role="cell" data-label="Atualizado em">{formatDate(p.atualizadoEm)}</td>
                      <td role="cell" data-label="Ação">
                        <button
                          className="button secondary"
                          onClick={() => {
                            if (p.status === "FINALIZADO") {
                              setId(String(p.id));
                              void lookupById(String(p.id));
                              return;
                            }
                            setId(String(p.id));
                            setProcess(p);
                            setClosure(null);
                            setError("");
                            setNote("");
                          }}
                        >
                          Conferir processo #{p.id}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              total={list.data?.total || validItems.length}
              size={20}
              onChange={(n) => {
                const nextParams: Record<string, string> = {
                  q: search,
                  page: String(n),
                };
                if (finalized) nextParams.status = "FINALIZADO";
                if (paramProcessId) nextParams.processo = paramProcessId;
                setParams(nextParams);
              }}
            />
          </>
        ) : (
          <EmptyState
            title={finalized ? "Nenhuma baixa concluída encontrada" : "Nenhuma baixa pendente"}
            description={finalized ? "Os comprovantes ficam disponíveis após concluir uma baixa." : "Os processos em fase de baixa aparecerão nesta lista."}
          />
        )}
      </section>
      <form className="panel admin-form" onSubmit={inspect}>
        <h2>Conferência individual</h2>
        <label className="field">
          ID do processo
          <input
            type="number"
            required
            min="1"
            step="1"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setProcess(null);
              setClosure(null);
              setError("");
            }}
          />
        </label>
        <button className="button secondary" disabled={busy}>
          {busy ? "Consultando…" : "Consultar processo"}
        </button>
      </form>
      {error && <InlineFeedback message={error} kind="error" />}
      {process && (
        <section className="panel admin-form">
          <h2>Processo #{process.id}</h2>
          <p>Status: {readable(process.status)}</p>
          <p>
            Contemplação #{process.contemplacaoId} · Atualizado em{" "}
            {formatDate(process.atualizadoEm)}
          </p>
          <Link to={"/admin/contemplados?processo=" + process.id}>
            Ver comunicação e histórico
          </Link>
          {closure ? (
            <div role="status">
              <h3>Baixa registrada #{closure.id}</h3>
              <p>
                {formatDate(closure.data)} · Responsável #{closure.usuarioId}
              </p>
              <p>{closure.observacao}</p>
            </div>
          ) : process.status === "EM_PROCESSO_DE_BAIXA" ? (
            <>
              <p>
                Confirme que a comunicação e a documentação foram conferidas. A
                conclusão será validada pelo serviço.
              </p>
              <label className="field">
                Observação da baixa
                <textarea
                  value={note}
                  maxLength={255}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Concluir baixa
              </button>
            </>
          ) : (
            <p role="status">
              Este processo não está na etapa de baixa. Nenhuma alteração será
              realizada por esta tela.
            </p>
          )}
        </section>
      )}
      <ConfirmDialog
        open={confirm}
        title={"Concluir baixa do processo #" + process?.id + "?"}
        description="A conclusão encerra este processo. Confira os dados antes de confirmar."
        confirmLabel="Confirmar baixa"
        onCancel={() => setConfirm(false)}
        onConfirm={() => void close()}
      />
    </AdminShell>
  );
}

