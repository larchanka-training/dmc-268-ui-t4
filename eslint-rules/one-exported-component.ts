import { type Rule } from "eslint";

/**
 * The AST node type, taken from ESLint's own typings: `estree` is ESLint's dependency, not
 * this project's, so it is not importable here under pnpm.
 */
type ExportNamedDeclaration = Parameters<
  NonNullable<Rule.RuleListener["ExportNamedDeclaration"]>
>[0];

/** Components are PascalCase; SCREAMING_CASE constants and camelCase helpers are not. */
const COMPONENT_NAME = /^[A-Z][a-z0-9]/;

/** "sign-in-success-page.tsx" → "SignInSuccessPage"; "App.tsx" → "App". */
function expectedName(filename: string): string | null {
  const base = /([^/\\]+)\.tsx$/.exec(filename)?.[1];

  if (base === undefined) {
    return null;
  }

  return base
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface ExportedComponent {
  readonly name: string;
  /** The export statement, which is where the problem is reported. */
  readonly node: ExportNamedDeclaration;
}

/** The components a single `export …` statement adds to the file's public API. */
function exportedComponents(node: ExportNamedDeclaration): ExportedComponent[] {
  // `export { X } from "./x"` and `export type { … }` add nothing of this file's own.
  if (node.source || (node as { exportKind?: string }).exportKind === "type") {
    return [];
  }

  const declaration = node.declaration;

  if (declaration?.type === "FunctionDeclaration") {
    return COMPONENT_NAME.test(declaration.id.name)
      ? [{ name: declaration.id.name, node }]
      : [];
  }

  if (declaration?.type === "VariableDeclaration") {
    return declaration.declarations.flatMap((declarator) =>
      declarator.id.type === "Identifier" &&
      COMPONENT_NAME.test(declarator.id.name) &&
      (declarator.init?.type === "ArrowFunctionExpression" ||
        declarator.init?.type === "FunctionExpression")
        ? [{ name: declarator.id.name, node }]
        : [],
    );
  }

  return node.specifiers.flatMap((specifier) => {
    const exported = specifier.exported;
    const name =
      exported.type === "Identifier" ? exported.name : String(exported.value);

    return (specifier as { exportKind?: string }).exportKind !== "type" &&
      COMPONENT_NAME.test(name)
      ? [{ name, node }]
      : [];
  });
}

/**
 * Each .tsx file exports one component, named after the file. Private helpers may stay in
 * the same file; shared/ui (vendored shadcn compound components) is exempt in the config.
 */
export const oneExportedComponent: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Each .tsx file exports exactly one component, named after the file",
    },
    schema: [],
    messages: {
      tooMany:
        "{{name}} is a second exported component in this file. Move it to its own file: each .tsx file exports one component.",
      wrongName:
        "{{name}} does not match the file name; a .tsx file exports the component it is named after ({{expected}}).",
    },
  },

  create(context) {
    const expected = expectedName(context.filename);

    if (expected === null) {
      return {};
    }

    const components: ExportedComponent[] = [];

    return {
      ExportNamedDeclaration(node) {
        components.push(...exportedComponents(node));
      },

      "Program:exit"() {
        const [first, ...rest] = components;

        if (first !== undefined && first.name !== expected) {
          context.report({
            node: first.node,
            messageId: "wrongName",
            data: { name: first.name, expected },
          });
        }

        for (const extra of rest) {
          context.report({
            node: extra.node,
            messageId: "tooMany",
            data: { name: extra.name },
          });
        }
      },
    };
  },
};
