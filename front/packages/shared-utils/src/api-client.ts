import { announceDegradedMode } from "./platform-status"
import { activeSubmission, recordSubmissionResponse, type SubmissionContext } from "./submission-guard"

export type ApiErrorPayload = {
  code?: string
  error?: string
  message?: string
  path?: string
}

export class ApiHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorPayload
  ) {
    super(message)
    this.name = "ApiHttpError"
  }
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    protected readonly authTokenProvider?: () => Promise<string>
  ) {}

  static authHeaders(jwt: string): Record<string, string> {
    return {
      Authorization: `Bearer ${jwt}`,
    }
  }

  async get<TResponse>(path: string, headers: Record<string, string> = {}): Promise<TResponse> {
    return this.request<TResponse>("GET", path, { headers })
  }

  async post<TResponse>(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    return this.request<TResponse>("POST", path, { headers, body })
  }

  async patch<TResponse>(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    return this.request<TResponse>("PATCH", path, { headers, body })
  }

  async put<TResponse>(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    return this.request<TResponse>("PUT", path, { headers, body })
  }

  async delete<TResponse>(
    path: string,
    headers: Record<string, string> = {},
    body?: unknown
  ): Promise<TResponse> {
    return this.request<TResponse>("DELETE", path, { headers, body })
  }

  protected async getAuth<TResponse>(
    path: string,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    return this.get<TResponse>(path, {
      ...(await this.authHeaders()),
      ...headers,
    })
  }

  protected async postAuth<TResponse>(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    return this.post<TResponse>(path, body, {
      ...(await this.authHeaders()),
      ...headers,
    })
  }

  protected async patchAuth<TResponse>(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    return this.patch<TResponse>(path, body, {
      ...(await this.authHeaders()),
      ...headers,
    })
  }

  protected async putAuth<TResponse>(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<TResponse> {
    return this.put<TResponse>(path, body, {
      ...(await this.authHeaders()),
      ...headers,
    })
  }

  protected async deleteAuth<TResponse>(
    path: string,
    headers: Record<string, string> = {},
    body?: unknown
  ): Promise<TResponse> {
    return this.delete<TResponse>(path, {
      ...(await this.authHeaders()),
      ...headers,
    }, body)
  }

  protected async postFormDataAuth<TResponse>(
    path: string,
    body: FormData
  ): Promise<TResponse> {
    const response = await fetch(this.buildUrl(path), {
      method: "POST",
      headers: await this.authHeaders(),
      body,
    })

    return this.parseResponse<TResponse>(response)
  }

  protected async getBlobAuth(path: string): Promise<Blob> {
    const response = await fetch(this.buildUrl(path), {
      headers: await this.authHeaders(),
    })

    if (!response.ok) {
      await this.parseResponse<never>(response)
    }

    return response.blob()
  }

  protected async request<TResponse>(
    method: string,
    path: string,
    options: { headers?: Record<string, string>; body?: unknown }
  ): Promise<TResponse> {
    // L25 (ADR 012) : pendant un envoi protégé, la première écriture porte la clé d’idempotence et la preuve anti-robot.
    const submission = method !== "GET" ? activeSubmission() : null
    const headers = { ...(options.headers ?? {}), ...(submission?.headers ?? {}) }
    const hasBody = options.body !== undefined

    if (hasBody && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetch(this.buildUrl(path), {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    })

    return this.parseResponse<TResponse>(response, submission)
  }

  private async parseResponse<TResponse>(response: Response, submission?: SubmissionContext | null): Promise<TResponse> {
    const rawText = await response.text()
    const parsedData = this.safeJsonParse(rawText)
    if (submission) recordSubmissionResponse(submission, response, parsedData)
    // F77 : l’API annonce le mode allégé sur chaque réponse (en-tête exposé par CORS).
    if (response.headers.get("X-Platform-Mode") === "degraded") announceDegradedMode()

    if (!response.ok) {
      const payload = this.isApiErrorPayload(parsedData) ? parsedData : undefined
      const message =
        payload?.error ??
        payload?.message ??
        response.statusText
      throw new ApiHttpError(message, response.status, payload)
    }

    if (parsedData !== undefined) {
      return parsedData as TResponse
    }

    return undefined as TResponse
  }

  private isApiErrorPayload(value: unknown): value is ApiErrorPayload {
    return value !== null && typeof value === "object"
  }

  private safeJsonParse(text: string): unknown | undefined {
    if (!text) {
      return undefined
    }

    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  }

  protected buildUrl(path: string): string {
    if (!this.baseUrl) {
      return path
    }

    const base = this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl
    return `${base}${path}`
  }

  protected async authHeaders(jwt?: string): Promise<Record<string, string>> {
    if (jwt) {
      return ApiClient.authHeaders(jwt)
    }

    if (!this.authTokenProvider) {
      throw new Error("Auth token provider non configure")
    }

    const token = await this.authTokenProvider()
    return ApiClient.authHeaders(token)
  }
}
