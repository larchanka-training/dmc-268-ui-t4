/** Public API of the auth module. */

export { type AuthNotifier, type SessionRepository } from "./application/ports";
export {
  type AuthDependencies,
  type SignInOutcome,
  completeSignIn,
} from "./application/use-cases";
export { type Action, can } from "./domain/permissions";
export {
  type Organization,
  type Session,
  type User,
  currentOrganization,
} from "./domain/session";
export {
  SIGN_IN_SUCCESS_PATH,
  type SignInError,
  type SignInResult,
  signInDestination,
} from "./domain/sign-in";
export { createBroadcastChannelNotifier } from "./infrastructure/broadcast-channel-notifier";
export { createHttpSessionRepository } from "./infrastructure/http-session-repository";
export { SignOutButton } from "./presentation/components/sign-out-button";
export { UserAvatar } from "./presentation/components/user-avatar";
export { AuthDependenciesProvider } from "./presentation/dependencies";
export { AuthCallbackPage } from "./presentation/pages/auth-callback-page";
export { LoginPage } from "./presentation/pages/login-page";
export { SignInSuccessPage } from "./presentation/pages/sign-in-success-page";
export {
  clearSessionCache,
  sessionQueryKey,
  sessionQueryOptions,
  useSession,
  useSignOut,
} from "./presentation/queries";
