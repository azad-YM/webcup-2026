import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import { messagesToSend, type OrientationReply, type OrientParams } from "../../domain/orientation"

/** F91, F92 : un tour de conversation ; seuls les derniers messages sont envoyés (contexte limité). */
export const orient: UseCase<OrientParams, OrientationReply> = async (dependencies, params) =>
  dependencies.orientationGateway.orient({ ...params, messages: messagesToSend(params.messages) })
