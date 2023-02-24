export interface ApiResponse {
  code?: number;
  message: string | string[];
}

export interface ApiDataResponse<T> extends ApiResponse{
  data: T;
}