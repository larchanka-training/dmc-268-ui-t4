import { createDependencyContext } from "@/shared/di/create-dependency-context";

import { type PlaygroundDependencies } from "../application/use-cases";

const context = createDependencyContext<PlaygroundDependencies>("Playground");

export const PlaygroundDependenciesProvider = context.Provider;
export const usePlaygroundDependencies = context.useDependencies;
