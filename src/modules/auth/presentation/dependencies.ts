import { createDependencyContext } from "@/shared/di/create-dependency-context";

import { type AuthDependencies } from "../application/use-cases";

const context = createDependencyContext<AuthDependencies>("Auth");

export const AuthDependenciesProvider = context.Provider;
export const useAuthDependencies = context.useDependencies;
