const requiredUrl = (name: string, value?: string) => {
  if (!value) {
    throw new Error(`La variable ${name} est obligatoire pour construire le site.`)
  }

  return value.replace(/\/$/, "")
}

export const siteEnv = {
  apiBaseUrl: requiredUrl("NEXT_PUBLIC_API_BASE_URL", process.env.NEXT_PUBLIC_API_BASE_URL),
  siteUrl: requiredUrl("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL),
  adminUrl: requiredUrl("NEXT_PUBLIC_ADMIN_URL", process.env.NEXT_PUBLIC_ADMIN_URL),
}
