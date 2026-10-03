import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { CitizenAccounts } from "../../domain/citizen-account"
export const listCitizenAccounts: UseCase<string, CitizenAccounts> = async (_dispatch, _getState, dependencies, search) => dependencies.citizenAccountsGateway.list(search.trim())
export const setCitizenSuspension: UseCase<{ citizenId: string; suspended: boolean }, { id: string; status: string }> = async (_dispatch, _getState, dependencies, input) => dependencies.citizenAccountsGateway.setSuspension(input)
