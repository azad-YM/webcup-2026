export interface RequestSessionProvider { getToken(): Promise<string>; invalidate(): void }
