export const digits = (value: string) => value.replace(/\D/g, "");

export function formatPhone(value: string) {
  const number = digits(value).slice(0, 15);
  if (number.startsWith("55") && number.length > 11) {
    const local = number.slice(2);
    return `+55 (${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}`;
  }
  if (number.length <= 2) return number;
  if (number.length <= 6) return `(${number.slice(0, 2)}) ${number.slice(2)}`;
  return `(${number.slice(0, 2)}) ${number.slice(2, -4)}-${number.slice(-4)}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export const readable = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

export function positiveId(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${field}: informe um número inteiro maior que zero.`);
  return value;
}

export function normalizeContemplation<
  T extends {
    origem: string;
    idExterno: string;
    nome: string;
    email: string;
    telefone?: string;
    cotaId: number;
    assembleiaId: number;
    dataContemplacao: string;
    valorCredito: number;
  },
>(payload: T): T {
  if (
    ![payload.origem, payload.idExterno, payload.nome, payload.email].every(
      (value) => value.trim(),
    )
  )
    throw new Error(
      "Preencha os campos obrigatórios, sem usar apenas espaços.",
    );
  if (
    [payload.origem, payload.idExterno, payload.nome, payload.email].some(
      (value) => value.trim().length > 255,
    )
  )
    throw new Error("Os campos de texto devem ter no máximo 255 caracteres.");
  positiveId(payload.cotaId, "Cota");
  positiveId(payload.assembleiaId, "Assembleia");
  if (
    !Number.isFinite(payload.valorCredito) ||
    payload.valorCredito <= 0 ||
    payload.valorCredito > 9999999999999.99
  )
    throw new Error(
      "Informe um crédito válido, maior que zero e com até 13 dígitos inteiros.",
    );
  if (
    Math.abs(
      payload.valorCredito * 100 - Math.round(payload.valorCredito * 100),
    ) > 0.01
  )
    throw new Error("O crédito deve ter no máximo duas casas decimais.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(payload.dataContemplacao) ||
    Number.isNaN(Date.parse(payload.dataContemplacao)) ||
    new Date(payload.dataContemplacao).toISOString().slice(0, 10) !==
      payload.dataContemplacao
  )
    throw new Error("Informe uma data de contemplação válida.");
  const telefone = digits(payload.telefone || "");
  if (telefone && (telefone.length < 10 || telefone.length > 15))
    throw new Error(
      "O telefone deve ter entre 10 e 15 dígitos, incluindo o código do país quando informado.",
    );
  return {
    ...payload,
    origem: payload.origem.trim(),
    idExterno: payload.idExterno.trim(),
    nome: payload.nome.trim(),
    email: payload.email.trim(),
    telefone: telefone || undefined,
  };
}
