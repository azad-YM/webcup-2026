export interface ContentSessionProvider { getToken(): Promise<string>; invalidate(): void }
