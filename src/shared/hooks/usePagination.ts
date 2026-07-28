import { useState } from 'react';

export interface PaginationMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

const usePagination = (initialPage = 1) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [dataMeta, setDataMeta] = useState<PaginationMeta | null>(null);

  const nextPage = (): void => {
    if (!dataMeta) return;

    const { page, pageCount } = dataMeta.pagination;

    if (page >= pageCount) {
      setHasMore(false);
      return;
    }

    setCurrentPage(previousPage => previousPage + 1);
  };

  const prevPage = (): void => {
    if (currentPage <= 1) return;

    setCurrentPage(previousPage => previousPage - 1);
    setHasMore(true);
  };

  const resetPagination = (): void => {
    setCurrentPage(initialPage);
    setHasMore(true);
    setDataMeta(null);
  };

  return {
    currentPage,
    nextPage,
    prevPage,
    hasMore,
    setHasMore,
    setDataMeta,
    dataMeta,
    resetPagination,
  };
};

export default usePagination;
