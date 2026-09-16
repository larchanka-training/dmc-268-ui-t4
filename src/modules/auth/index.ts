/** Public API of the auth module. */

export { type SessionRepository } from "./application/ports";
export { type AuthDependencies } from "./application/use-cases";
export { type Action, can } from "./domain/permissions";
export {
  type Organization,
  type Session,
  type User,
  currentOrganization,
} from "./domain/session";
export { createHttpSessionRepository } from "./infrastructure/http-session-repository";
export { AuthDependenciesProvider } from "./presentation/dependencies";
export { LoginPage } from "./presentation/pages/login-page";
export {
  sessionQueryKey,
  sessionQueryOptions,
  useSession,
} from "./presentation/queries";
