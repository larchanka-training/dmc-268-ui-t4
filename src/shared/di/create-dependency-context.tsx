import { type ReactNode, createContext, use } from "react";

export interface DependencyContext<TDependencies> {
  Provider: (props: { value: TDependencies; children: ReactNode }) => ReactNode;
  useDependencies: () => TDependencies;
}

/**
 * Manual dependency injection: the composition root builds the adapters and hands them
 * down through React context, so presentation code never imports infrastructure.
 * Tests wrap a component in the same provider with in-memory implementations.
 */
export function createDependencyContext<TDependencies>(
  name: string,
): DependencyContext<TDependencies> {
  const Context = createContext<TDependencies | null>(null);
  Context.displayName = `${name}Dependencies`;

  return {
    Provider: ({ value, children }) => (
      <Context value={value}>{children}</Context>
    ),
    useDependencies: () => {
      const value = use(Context);

      if (value === null) {
        throw new Error(
          `${name} dependencies are missing: wrap the tree in its provider`,
        );
      }

      return value;
    },
  };
}
