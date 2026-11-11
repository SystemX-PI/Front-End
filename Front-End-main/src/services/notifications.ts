export type Toast = {
  id: number;
  message: string;
  kind: "info" | "success" | "error";
};
let nextId = 0;

export function notify(message: string, kind: Toast["kind"] = "info") {
  window.dispatchEvent(
    new CustomEvent("app:toast", { detail: { id: ++nextId, message, kind } }),
  );
}
