import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import { createContext, useContext, type PropsWithChildren } from "react"

const DependenciesContext = createContext<Dependencies | null>(null)

type Props = {
  dependencies: Dependencies
}

export const DependenciesProvider = ({ dependencies, children }: PropsWithChildren<Props>) => {
  return (
    <DependenciesContext.Provider value={dependencies}>
      {children}
    </DependenciesContext.Provider>
  )
}

export const useDependencies = () => {
  const dependencies = useContext(DependenciesContext)

  if (!dependencies) {
    throw new Error("DependenciesProvider is missing")
  }

  return dependencies
}
