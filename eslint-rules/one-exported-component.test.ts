import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { oneExportedComponent } from "./one-exported-component";

// RuleTester drives Vitest instead of looking for Mocha globals.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const FILE = "src/modules/auth/presentation/components/user-avatar.tsx";

ruleTester.run("one-exported-component", oneExportedComponent, {
  valid: [
    {
      name: "one exported component named after the file",
      filename: FILE,
      code: "export function UserAvatar() { return <span />; }",
    },
    {
      name: "a private helper next to the exported component",
      filename: FILE,
      code: `
        function Initials() { return <span />; }
        export function UserAvatar() { return <Initials />; }
      `,
    },
    {
      name: "exported functions, constants and types that are not components",
      filename: FILE,
      code: `
        export const SIZE_LIMIT = 8;
        export function initials(name: string) { return name; }
        export type Props = { name: string };
        export interface Other { id: string }
        export function UserAvatar() { return <span />; }
      `,
    },
    {
      name: "a PascalCase file name",
      filename: "src/app/App.tsx",
      code: "export function App() { return <div />; }",
    },
    {
      name: "a .ts file is not checked",
      filename: "src/modules/auth/index.ts",
      code: "export function A() {} export function B() {}",
    },
    {
      name: "a re-export from another module does not count",
      filename: FILE,
      code: `
        export { Other } from "./other";
        export function UserAvatar() { return <span />; }
      `,
    },
  ],
  invalid: [
    {
      name: "two exported function components",
      filename: FILE,
      code: `
        export function UserAvatar() { return <span />; }
        export function UserBadge() { return <span />; }
      `,
      errors: [{ messageId: "tooMany", data: { name: "UserBadge" } }],
    },
    {
      name: "an exported arrow component as the second one",
      filename: FILE,
      code: `
        export function UserAvatar() { return <span />; }
        export const UserBadge = () => <span />;
      `,
      errors: [{ messageId: "tooMany", data: { name: "UserBadge" } }],
    },
    {
      name: "two components exported through a list",
      filename: FILE,
      code: `
        function UserAvatar() { return <span />; }
        function UserBadge() { return <span />; }
        export { UserAvatar, UserBadge };
      `,
      errors: [{ messageId: "tooMany", data: { name: "UserBadge" } }],
    },
    {
      name: "a component named differently from its file",
      filename: FILE,
      code: "export function Avatar() { return <span />; }",
      errors: [
        {
          messageId: "wrongName",
          data: { name: "Avatar", expected: "UserAvatar" },
        },
      ],
    },
  ],
});
