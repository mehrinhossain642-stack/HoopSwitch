# Deterministic fit scoring (proposal §4). No ML, no extra infra.
#
#   MatchScorer.call(player, posting) # => Result(score:, tier:, reason:, breakdown:)
#
# The same function powers both feeds: the player feed ranks postings for a
# player, the coach feed ranks players for a selected posting.
#
# Kept numerically identical to the React Native client's lib/match.ts so the
# prototype and the API never disagree about a score.
#
# NOTE — deviation from the proposal, deliberate: §4 writes height fit as
#   1 - min(|player - ideal| / tolerance, 1)
# which is symmetric and would penalise a player for being *taller* than the
# slot's ideal. `ideal_height_cm` is a floor, not a target (the UI renders it as
# "Ideal ht 6'1"+"), so height is scored one-sided here: at or above ideal is a
# full 1.0. Weight stays symmetric as specified, since being far off the target
# playing weight in either direction is a real fit concern.
class MatchScorer
  WEIGHTS = {
    position: 0.35,
    height: 0.25,
    weight: 0.15,
    production: 0.25
  }.freeze

  # Within this delta a component degrades linearly to 0.
  HEIGHT_TOLERANCE_CM = 10.0
  WEIGHT_TOLERANCE_KG = 8.0
  # PPG that saturates the production component.
  PRODUCTION_REFERENCE_PPG = 12.0

  GOOD_TIER_THRESHOLD = 78

  ADJACENT = {
    "PG" => %w[SG],
    "SG" => %w[PG SF],
    "SF" => %w[SG PF],
    "PF" => %w[SF C],
    "C" => %w[PF]
  }.freeze

  REASONS = {
    position: "different position than the slot",
    height: "more height would help",
    weight: "add strength to match the role",
    production: "add scoring to stand out"
  }.freeze

  GOOD_REASON = "Fits you well"

  # Ties resolve in this order so reasons stay deterministic.
  COMPONENT_ORDER = %i[position height weight production].freeze

  Result = Struct.new(:score, :tier, :reason, :breakdown, keyword_init: true) do
    def good?
      tier == "good"
    end

    def as_json(*)
      { "score" => score, "tier" => tier, "reason" => reason,
        "breakdown" => breakdown.transform_keys(&:to_s) }
    end
  end

  def self.call(player, posting)
    new(player, posting).call
  end

  def initialize(player, posting)
    @player = player
    @posting = posting
  end

  def call
    breakdown = {
      position: position_score,
      height: height_score,
      weight: weight_score,
      production: production_score
    }

    weighted = breakdown.sum { |component, sub_score| sub_score * WEIGHTS[component] }
    score = (100 * weighted).round
    tier = score >= GOOD_TIER_THRESHOLD ? "good" : "partial"

    Result.new(
      score: score,
      tier: tier,
      reason: tier == "good" ? GOOD_REASON : REASONS[weakest_component(breakdown)],
      breakdown: breakdown
    )
  end

  private

  attr_reader :player, :posting

  # Exact 1.0, adjacent 0.5, otherwise 0.
  def position_score
    return 1.0 if player.position == posting.position

    ADJACENT.fetch(posting.position, []).include?(player.position) ? 0.5 : 0.0
  end

  # One-sided: taller than ideal is never penalised. See the note above.
  def height_score
    player_cm = player.height_cm.to_f
    ideal_cm = posting.ideal_height_cm.to_f
    return 1.0 if player_cm >= ideal_cm

    1.0 - [ (ideal_cm - player_cm) / HEIGHT_TOLERANCE_CM, 1.0 ].min
  end

  # Symmetric: both lighter and heavier than ideal are penalised.
  def weight_score
    delta = (player.weight_kg.to_f - posting.ideal_weight_kg.to_f).abs
    1.0 - [ delta / WEIGHT_TOLERANCE_KG, 1.0 ].min
  end

  # Flat PPG reference for the MVP. §4 hints at a per-position threshold
  # ("PPG for a scoring wing"); that refinement is post-MVP.
  def production_score
    [ player.ppg.to_f / PRODUCTION_REFERENCE_PPG, 1.0 ].min
  end

  # Lowest raw sub-score, ties broken by COMPONENT_ORDER.
  def weakest_component(breakdown)
    COMPONENT_ORDER.min_by { |component| [ breakdown[component], COMPONENT_ORDER.index(component) ] }
  end
end
