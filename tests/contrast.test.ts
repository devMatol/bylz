import test from "node:test";
import assert from "node:assert/strict";
import { runRenderedContrastAudit } from "../scripts/check-contrast.mjs";

test("Vérification automatique des contrastes WCAG AA (>= 4.5:1) en conditions réelles Playwright (4 combinaisons)", async () => {
  const results = await runRenderedContrastAudit();

  assert.equal(results.length, 4, "Les 4 combinaisons OS/App doivent être testées");

  for (const comb of results) {
    if (comb.totalFailed > 0) {
      const details = comb.failures
        .slice(0, 5)
        .map(
          (f: any) =>
            `[${f.page}] "${f.text}" fg=rgb(${f.fgRgb}) bg=rgb(${f.bgRgb}) ratio=${f.ratio}:1 (seuil ${f.threshold}:1)`
        )
        .join("\n");
      assert.fail(
        `Échec de contraste pour ${comb.combination} (${comb.totalFailed} échecs) :\n${details}`
      );
    }

    assert.equal(comb.totalFailed, 0, `Aucun échec pour ${comb.combination}`);
    assert.ok(comb.totalChecked >= 50, `Au moins 50 éléments vérifiés pour ${comb.combination}`);
  }
});
