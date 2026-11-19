import {
  type ParsedDraft,
  toDiagnosticCode,
  toRuleCategory,
} from "../domain/draft-rules";

import { type ParsedRulesDto } from "./dto";

export function toParsedDraft(dto: ParsedRulesDto): ParsedDraft {
  return {
    rules: dto.rules.map((rule) => ({
      id: rule.id,
      section: rule.section,
      category: toRuleCategory(rule.category),
      text: rule.text,
      lineStart: rule.line_start,
      lineEnd: rule.line_end,
    })),
    ignore: dto.ignore.map((directive) => ({
      kind: directive.kind,
      value: directive.value,
      lineStart: directive.line_start,
      lineEnd: directive.line_end,
    })),
    diagnostics: dto.diagnostics.map((diagnostic) => ({
      code: toDiagnosticCode(diagnostic.code),
      dropped: diagnostic.dropped,
      lineStart: diagnostic.line_start,
      lineEnd: diagnostic.line_end,
    })),
    limits: {
      bytes: dto.limits.bytes,
      rules: dto.limits.rules,
      ruleChars: dto.limits.rule_chars,
      ignore: dto.limits.ignore,
    },
  };
}
