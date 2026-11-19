import { type DiagnosticCode } from "../domain/draft-rules";

/** What each parser note means, worded for the person editing the file. */
export const DIAGNOSTIC_MESSAGES: Record<DiagnosticCode, string> = {
  section_other:
    "Not a recognised section: its rules reach the model as other guidance, with no category. Recognised: Security, Correctness, Performance, Concurrency, Style, Ignore.",
  rule_suspicious:
    "Dropped: the rule, or its section title, reads as an instruction to the model rather than a check on the code.",
  rule_over_limit:
    "Dropped: past the limit of 50 rules or 8000 characters of rule text.",
  ignore_invalid:
    "Dropped: an Ignore item is either `path: <glob>` (no spaces, no `!` negation) or `category: <name>`.",
  ignore_unknown_category:
    "Dropped: not a category that can be muted. Use correctness, concurrency, performance or maintainability.",
  ignore_security: "Dropped: security findings cannot be muted.",
  ignore_over_limit: "Dropped: past the limit of 100 Ignore directives.",
  unknown: "The parser left a note this console does not recognise.",
};
