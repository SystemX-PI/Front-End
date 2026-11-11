import { useState } from "react";

export function usePagination<T>(items: T[], size = 8) {
  const [requestedPage, setPage] = useState(1);
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(items.length / size)),
  );
  return {
    page,
    setPage,
    pageItems: items.slice((page - 1) * size, page * size),
    size,
  };
}
