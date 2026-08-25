export interface ApiRequest { method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE"; url: string; body?: unknown; headers?: Record<string,string>; }
export interface ApiResponse<T = unknown> { status: number; data: T; }
export interface ApiClient { request<T = unknown>(req: ApiRequest): Promise<ApiResponse<T>>; }
export class NoopApiClient implements ApiClient {
  async request<T = unknown>(): Promise<ApiResponse<T>> { return { status: 204, data: undefined as unknown as T }; }
}
