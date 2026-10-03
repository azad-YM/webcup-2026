export type CityNotice = { id: string; title: string; summary: string; body: string[]; important: boolean; severity: "info" | "warning" | "critical" | null; audience: "all" | "district" | "health"; district: string | null; startsAt: string | null; endsAt: string | null; recommendations: string }
export type AlertPreference = { citizenId: string; district: string | null; healthConsent: boolean }
