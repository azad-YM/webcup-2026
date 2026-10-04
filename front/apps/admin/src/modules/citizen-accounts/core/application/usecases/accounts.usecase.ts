import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { CitizenAccounts, CitizenAccountsQuery } from "../../domain/citizen-account"
export const listCitizenAccounts: UseCase<CitizenAccountsQuery, CitizenAccounts> = async (_dispatch, _getState, dependencies, query) => dependencies.citizenAccountsGateway.list({ search: query.search.trim(), reveal: query.reveal })
export const setCitizenSuspension: UseCase<{ citizenId: string; suspended: boolean }, { id: string; status: string }> = async (_dispatch, _getState, dependencies, input) => dependencies.citizenAccountsGateway.setSuspension(input)
