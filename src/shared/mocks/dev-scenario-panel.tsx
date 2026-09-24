import { SCENARIOS, currentScenarioName, setScenario } from "./scenario";

/**
 * Dev-only control for switching the mock scenario: which role is signed in and whether
 * any runs are in flight. It ships only with the mocks, never with the real app.
 */
export function DevScenarioPanel() {
  const active = currentScenarioName();

  return (
    <div className="fixed right-3 bottom-3 z-50 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <span className="text-content-muted">Mock</span>
      <select
        aria-label="Mock scenario"
        className="rounded-sm border border-border bg-surface px-1 py-0.5"
        value={active}
        onChange={(event) => {
          setScenario(event.target.value);
        }}
      >
        {Object.keys(SCENARIOS).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
