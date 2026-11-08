import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import { ErrorState, Skeleton } from "../components/DataUi";
import { useResource } from "../hooks/useResource";
import { platformRequest, type Context } from "../services/platform";
import { Mailboxes } from "./PlatformApp";
import PlatformWhatsApp from "./PlatformWhatsApp";

export default function AdminChannels() {
  const [channel, setChannel] = useState<"whatsapp" | "gmail">("whatsapp");
  const [context, setContext] = useState<Context | null>(null);
  const reload = useCallback(async () => {
    setContext(await platformRequest<Context>("/operation-channels", null));
  }, []);
  const result = useResource(reload);
  return <AdminShell title="Canais internos" subtitle="Remetentes da administração para envios de teste.">
    <div className="dialog-actions" role="group" aria-label="Canal interno">
      <button className="button secondary" aria-pressed={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>WhatsApp</button>
      <button className="button secondary" aria-pressed={channel === "gmail"} onClick={() => setChannel("gmail")}>Gmail</button>
      <Link className="button secondary" to="/admin/disparo-manual?modo=teste">Abrir envio de teste</Link>
    </div>
    {result.loading ? <Skeleton /> : result.error ? <ErrorState message={result.error} retry={result.refresh} /> :
      context && (channel === "whatsapp" ? <PlatformWhatsApp context={context} accountId={null} reload={reload} />
        : <Mailboxes context={context} accountId={null} reload={reload} />)}
  </AdminShell>;
}
