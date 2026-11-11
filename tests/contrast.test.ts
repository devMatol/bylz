import test from "node:test";
import assert from "node:assert/strict";
import { runContrastAudit } from "../scripts/check-contrast.mjs";

test("Vérification automatique des contrastes WCAG AA (>= 4.5:1) en clair et en sombre", () => {
  const result = runContrastAudit();

  const failedItems = result.rows.filter((r) => r.status === "FAIL");

  if (failedItems.length > 0) {
    const errorDetails = failedItems
      .map(
        (f) =>
          `[${f.page}] [${f.theme}] ${f.component} ratio=${f.ratio}:1 (attendu >= 4.5:1)`
      )
      .join("\n");
    assert.fail(
      `${failedItems.length} élément(s) ont un contraste inférieur au seuil WCAG AA de 4.5:1 :\n${errorDetails}`
    );
  }

  assert.equal(result.failed, 0, "Aucun échec de contraste ne doit être présent");
  assert.ok(result.totalChecked >= 30, "Au moins 30 vérifications de contraste doivent être exécutées");
});
