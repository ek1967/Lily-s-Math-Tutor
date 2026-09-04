import type { KatexOptions } from 'katex';

/**
 * `trust: false` is the important one. KaTeX renders to HTML that we inject
 * directly, and with trust disabled it refuses \href, \htmlClass and friends —
 * which matters because some of the TeX we render will come from model output.
 */
export const KATEX_OPTIONS: KatexOptions = {
  throwOnError: false,
  // Renders unknown commands in a visible colour rather than blanking the line,
  // so a broken formula is obvious in the dev gallery instead of silent.
  errorColor: 'rgb(201 130 47)',
  trust: false,
  strict: 'ignore',
  output: 'html',
};
