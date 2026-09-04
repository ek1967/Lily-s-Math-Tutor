import { registerGenerator } from './registry';
import { fractionsAddSubGenerators } from './topics/num-fractions-add-sub.gen';
import { fractionsCompareGenerators } from './topics/num-fractions-compare.gen';
import { fractionsMulDivGenerators } from './topics/num-fractions-mul-div.gen';
import { integersMulDivGenerators } from './topics/num-integers-mul-div.gen';
import { percentBasicsGenerators } from './topics/num-percent-basics.gen';
import { integersAddSubGenerators } from './topics/num-integers-add-sub.gen';
import { linearEqBasicGenerators } from './topics/alg-linear-eq-basic.gen';
import { expressionsSubstituteGenerators } from './topics/alg-expressions-substitute.gen';
import { collectLikeTermsGenerators } from './topics/alg-collect-like-terms.gen';
import { distributiveGenerators } from './topics/alg-distributive.gen';
import { coordinatePlaneGenerators } from './topics/fun-coordinate-plane.gen';
import { squareRootsGenerators } from './topics/num-square-roots.gen';
import { pythagorasGenerators } from './topics/geo-pythagoras.gen';
import { areaPerimeterGenerators } from './topics/geo-area-perimeter.gen';
import { meanMedianModeGenerators } from './topics/sta-mean-median-mode.gen';
import { decimalsOpsGenerators } from './topics/num-decimals-ops.gen';
import { fractionDecimalPercentGenerators } from './topics/num-fraction-decimal-percent.gen';
import { wordProblemsIntroGenerators } from './topics/alg-word-problems-intro.gen';
import { powersLawsGenerators } from './topics/num-powers-laws.gen';
import { multiplyBracketsGenerators } from './topics/alg-multiply-brackets.gen';
import { linearFunctionGenerators } from './topics/fun-linear-function.gen';

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
    ...integersMulDivGenerators,
    ...fractionsCompareGenerators,
    ...fractionsAddSubGenerators,
    ...fractionsMulDivGenerators,
    ...percentBasicsGenerators,
    ...squareRootsGenerators,
    ...expressionsSubstituteGenerators,
    ...collectLikeTermsGenerators,
    ...distributiveGenerators,
    ...linearEqBasicGenerators,
    ...coordinatePlaneGenerators,
    ...areaPerimeterGenerators,
    ...pythagorasGenerators,
    ...meanMedianModeGenerators,
    ...decimalsOpsGenerators,
    ...fractionDecimalPercentGenerators,
    ...wordProblemsIntroGenerators,
    ...powersLawsGenerators,
    ...multiplyBracketsGenerators,
    ...linearFunctionGenerators,
  ]) {
    registerGenerator(gen);
  }
}

export * from './registry';
