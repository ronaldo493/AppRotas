export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiMeta {
  pagination: StrapiPagination;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: StrapiMeta;
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface StrapiErrorResponse {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface StrapiRequestError {
  response?: {
    status?: number;
    data?: {
      data?: null;
      error?: StrapiErrorResponse;
      message?: string;
    };
  };
}