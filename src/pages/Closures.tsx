import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
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
import { ApiError } from "../services/http";
import { useResource } from "../hooks/useResource";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { closureReadFailure, unavailable } from "../services/operationErrors";
import { formatDate, readable } from "../services/format";

export default function Closures() {
  const [params, setParams] = useSearchParams();
  const requestedPage = Number(params.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 2147483647 ? requestedPage : 1;
  const search = params.get("q") || "";
  const q = useDebouncedValue(search);
  const finalized = params.get("status") === "FINALIZADO";
  const load = useCallback(
    (signal: AbortSignal) =>
      backend.operation.closures(page - 1, q, finalized ? "FINALIZADO" : "EM_PROCESSO_DE_BAIXA", signal).catch((failure: unknown) => {
        if (signal.aborted) throw failure;
        if (unavailable(failure)) throw new Error("A listagem de baixas está aguardando a integração do serviço.");
        throw new Error(closureReadFailure(failure).message);
      }),
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
  const [retryId, setRetryId] = useState<string | null>(null);
  const [missingReceipt, setMissingReceipt] = useState(false);
  const [requiresReview, setRequiresReview] = useState(false);
  const selectedId = useRef("");
  const lookup = useRef<AbortController | null>(null);
  const lastPage = Math.max(1, Math.ceil((list.data?.total ?? 0) / (list.data?.size || 20)));

  useEffect(() => {
    if (list.loading || list.error || !list.data || list.data.page !== page - 1 || page <= lastPage) return;
    setParams(current => {
      const next = new URLSearchParams(current);
      next.set("page", String(lastPage));
      return next;
    }, { replace: true });
  }, [lastPage, list.data, list.error, list.loading, page, setParams]);

  const lookupById = useCallback(async (rawId: string) => {
    lookup.current?.abort();
    const controller = new AbortController();
    lookup.current = controller;
    const { signal } = controller;
    setBusy(true);
    setError("");
    setRetryId(null);
    setMissingReceipt(false);
    if (selectedId.current !== rawId) {
      selectedId.current = rawId;
      setProcess(null);
      setClosure(null);
      setNote("");
      setRequiresReview(false);
    }
    try {
      const value = Number(rawId);
      if (!Number.isSafeInteger(value) || value < 1) {
        setError("Informe um processo válido.");
        return;
      }
      const p = await backend.processes.get(value, signal);
      if (signal.aborted) return;
      if (!p || p.id !== value || typeof p.status !== "string") {
        setError("O servidor retornou dados incompletos para o processo.");
        return;
      }
      setProcess(p);
      if (p.status === "FINALIZADO") {
        try {
          const c = await backend.processes.getClosure(value, signal);
          if (!signal.aborted) setClosure(c);
        } catch (failure) {
          if (signal.aborted) return;
          if (failure instanceof ApiError && failure.status === 404) {
            setClosure(null);
            setMissingReceipt(true);
            return;
          }
          throw failure;
        }
      } else {
        setClosure(null);
      }
      setRequiresReview(false);
    } catch (failure) {
      if (signal.aborted) return;
      if (failure instanceof ApiError && [401, 403, 404].includes(failure.status)) setClosure(null);
      const result = closureReadFailure(failure);
      setError(result.message);
      if (result.retry) setRetryId(rawId);
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }, [setBusy, setError, setRetryId, setMissingReceipt, setProcess, setClosure, setNote, setRequiresReview]);

  useEffect(() => {
    let disposed = false;
    if (paramProcessId) void Promise.resolve().then(() => {
      if (!disposed) void lookupById(paramProcessId);
    });
    return () => {
      disposed = true;
      lookup.current?.abort();
    };
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
    if (process?.status !== "EM_PROCESSO_DE_BAIXA" || closure || busy || requiresReview) return;
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const result = await backend.processes.createClosure(
        process.id,
        note.trim(),
      );
      setClosure(result);
      setProcess({ ...process, status: "FINALIZADO", transicoesPermitidas: [] });
      list.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        list.refresh();
        setError("A baixa só pode ser concluída na etapa Em processo de baixa. Consulte o processo novamente para ver o status atual.");
      } else if (e instanceof ApiError && (e.transport || e.status >= 500)) {
        setError("Não foi possível confirmar se a baixa foi concluída. Consulte o processo antes de tentar novamente.");
      } else {
        setError(closureReadFailure(e).message);
      }
      setRequiresReview(true);
      if (closureReadFailure(e).retry) setRetryId(String(process.id));
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
              const nextParams: Record<string, string> = {
                q: e.target.value,
                page: "1",
              };
              if (finalized) nextParams.status = "FINALIZADO";
              if (paramProcessId) nextParams.processo = paramProcessId;
              setParams(nextParams, { replace: true });
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
                          disabled={busy}
                          onClick={() => {
                            setId(String(p.id));
                            void lookupById(String(p.id));
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
              total={list.data?.total ?? validItems.length}
              size={list.data?.size || 20}
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
            disabled={busy}
            onChange={(e) => {
              setId(e.target.value);
              setProcess(null);
              setClosure(null);
              setError("");
              setRetryId(null);
              setMissingReceipt(false);
            }}
          />
        </label>
        <button className="button secondary" disabled={busy}>
          {busy ? "Consultando…" : "Consultar processo"}
        </button>
      </form>
      {error && <InlineFeedback message={error} kind="error" />}
      {retryId && <button type="button" className="button secondary" disabled={busy}
        onClick={() => void lookupById(retryId)}>Consultar novamente</button>}
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
          ) : process.status === "FINALIZADO" ? (
            missingReceipt && <p role="status">O comprovante da baixa não está disponível para este processo.</p>
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
                disabled={busy || requiresReview}
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

