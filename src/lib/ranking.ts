/**
 * Ranking score computation.
 *
 * The ranking formula is:
 *   30% review average    (normalised 0–5 → 0–1)
 *   25% review count      (capped at 500, normalised 0–1)
 *   25% editorial score   (0–10 → 0–1)
 *   10% category fit      (0–10 → 0–1)
 *   10% completeness      (0–100 → 0–1)
 *
 * Result: 0–100 float. Higher = ranked first.
 *
 * This same formula is implemented as a Postgres trigger in the migration
 * (update_ranking_score). The TypeScript version here is used:
 *  - when computing score server-side before an insert/update
 *  - in tests
 *  - as the canonical readable spec for the formula
 *
 * If you change the formula, update BOTH this file and the SQL trigger.
 */

export interface RankingInputs {
  reviewScore:      number | null  // 0.00–5.00
  reviewCount:      number         // integer ≥ 0
  editorialScore:   number         // 0–10
  categoryFitScore: number         // 0–10
  completenessScore: number        // 0–100
}

/** Cap applied to reviewCount before normalising. Prevents large chains from dominating. */
export const REVIEW_COUNT_CAP = 500

/** Weights must sum to 100. */
export const RANKING_WEIGHTS = {
  reviewAverage:    30,
  reviewCount:      25,
  editorialScore:   25,
  categoryFitScore: 10,
  completeness:     10,
} as const

export function computeRankingScore(inputs: RankingInputs): number {
  const {
    reviewScore,
    reviewCount,
    editorialScore,
    categoryFitScore,
    completenessScore,
  } = inputs

  const normReviewAverage = reviewScore != null
    ? Math.min(reviewScore / 5.0, 1.0)
    : 0

  const normReviewCount = Math.min(reviewCount / REVIEW_COUNT_CAP, 1.0)
  const normEditorial   = editorialScore   / 10.0
  const normCategoryFit = categoryFitScore / 10.0
  const normCompleteness = completenessScore / 100.0

  return (
    normReviewAverage * RANKING_WEIGHTS.reviewAverage   +
    normReviewCount   * RANKING_WEIGHTS.reviewCount     +
    normEditorial     * RANKING_WEIGHTS.editorialScore  +
    normCategoryFit   * RANKING_WEIGHTS.categoryFitScore +
    normCompleteness  * RANKING_WEIGHTS.completeness
  )
}
