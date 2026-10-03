import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import {
  CitizenErrorCode,
  type CitizenGateway,
  type CitizenRegistration
} from "../../application/ports/gateway/citizen.gateway"
import {
  isProfileCompleted,
  type CitizenProfile,
  type CitizenProfileUpdate
} from "../../domain/citizen-profile"

/**
 * Double de test du contrat Citizen. Les jetons sont de la forme `token:<email>`,
 * comme ceux délivrés par le double d’authentification des tests.
 */
export class InMemoryCitizenGateway implements CitizenGateway {
  readonly citizens = new Map<string, CitizenProfile>()
  readonly registrations: CitizenRegistration[] = []
  readonly updates: CitizenProfileUpdate[] = []
  failNextWith: AppError | null = null

  seed(email: string, profile: Partial<CitizenProfile> = {}) {
    const citizen: CitizenProfile = {
      id: `citizen-${this.citizens.size + 1}`,
      firstName: null, lastName: null, phone: null, address: null, district: null, preferredLanguage: null,
      registeredAt: "2026-10-03T14:30:00+00:00",
      ...profile,
      profileCompleted: false
    }
    citizen.profileCompleted = isProfileCompleted(citizen)
    this.citizens.set(email, citizen)
    return citizen
  }

  private consumeFailure() {
    const failure = this.failNextWith
    this.failNextWith = null
    if (failure) throw failure
  }

  private citizenFor(token: string) {
    const email = token.startsWith("token:") ? token.slice("token:".length) : null
    if (!email) throw new AppError(401, "Votre session a expiré. Veuillez vous reconnecter.")
    const citizen = this.citizens.get(email)
    if (!citizen) throw new AppError(404, "Ce compte n’est pas un compte citoyen.", { code: CitizenErrorCode.notCitizen })
    return { email, citizen }
  }

  async listDistricts() {
    return ["Nord", "Sud", "Est", "Ouest", "Centre", "Port"]
  }

  async register(payload: CitizenRegistration) {
    this.consumeFailure()
    this.registrations.push(payload)
    if (this.citizens.has(payload.email)) {
      throw new AppError(409, "Un compte existe déjà avec cet e-mail.", { code: CitizenErrorCode.emailAlreadyUsed })
    }
    return { citizenId: this.seed(payload.email).id }
  }

  async getMyProfile(token: string) {
    this.consumeFailure()
    return { ...this.citizenFor(token).citizen }
  }

  readonly activations: string[] = []

  async activateMyCitizenAccount(token: string) {
    this.consumeFailure()
    const email = token.startsWith("token:") ? token.slice("token:".length) : null
    if (!email) throw new AppError(401, "Votre session a expiré. Veuillez vous reconnecter.")
    this.activations.push(email)
    return { ...(this.citizens.get(email) ?? this.seed(email)) }
  }

  async updateMyProfile(token: string, update: CitizenProfileUpdate) {
    this.consumeFailure()
    const { email, citizen } = this.citizenFor(token)
    this.updates.push(update)
    const next = { ...citizen, ...update }
    next.profileCompleted = isProfileCompleted(next)
    this.citizens.set(email, next)
    return { ...next }
  }
}
