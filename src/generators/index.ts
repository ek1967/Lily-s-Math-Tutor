import { registerGenerator } from './registry';
import { fractionsAddSubGenerators } from './topics/num-fractions-add-sub.gen';
import { integersAddSubGenerators } from './topics/num-integers-add-sub.gen';
import { linearEqBasicGenerators } from './topics/alg-linear-eq-basic.gen';

/**
 * Every generator file is imported and registered here by hand. Explicit beats
 * import.meta.glob: renames fail at compile time and registration order is
 * deterministic. registry.test.ts reads this directory from disk and fails if a
 * file was added without a line appearing here.
 */
let registered = false;

export function registerAllGenerators(): void {
  if (registered) return;
  registered = true;
  for (const gen of [
    ...integersAddSubGenerators,
    ...fractionsAddSubGenerators,
    ...linearEqBasicGenerators,
  ]) {
    registerGenerator(gen);
  }
}

export * from './registry';
