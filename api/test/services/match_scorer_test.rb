require "test_helper"

# MatchScorer is the differentiator (proposal §4) and is duplicated in the React
# Native client's lib/match.ts. These tests pin the exact numbers so the two
# implementations can't silently drift apart.
class MatchScorerTest < ActiveSupport::TestCase
  # Unsaved records are enough — MatchScorer only reads attributes.
  def player(position:, height_cm:, weight_kg:, ppg:, name: "Test Player")
    PlayerProfile.new(name: name, position: position, height_cm: height_cm,
                      weight_kg: weight_kg, ppg: ppg, wingspan_cm: 200, age: 21)
  end

  def posting(position:, ideal_height_cm:, ideal_weight_kg:, expected_minutes: 24)
    Posting.new(position: position, ideal_height_cm: ideal_height_cm,
                ideal_weight_kg: ideal_weight_kg, expected_minutes: expected_minutes)
  end

  # --- component behaviour ------------------------------------------------

  test "position scores 1.0 exact, 0.5 adjacent, 0 otherwise" do
    slot = posting(position: "SG", ideal_height_cm: 150, ideal_weight_kg: 80)

    assert_equal 1.0, MatchScorer.call(player(position: "SG", height_cm: 200, weight_kg: 80, ppg: 12), slot).breakdown[:position]
    assert_equal 0.5, MatchScorer.call(player(position: "PG", height_cm: 200, weight_kg: 80, ppg: 12), slot).breakdown[:position]
    assert_equal 0.5, MatchScorer.call(player(position: "SF", height_cm: 200, weight_kg: 80, ppg: 12), slot).breakdown[:position]
    assert_equal 0.0, MatchScorer.call(player(position: "C", height_cm: 200, weight_kg: 80, ppg: 12), slot).breakdown[:position]
  end

  test "height is one-sided: taller than ideal is never penalised" do
    slot = posting(position: "PG", ideal_height_cm: 190, ideal_weight_kg: 80)

    assert_equal 1.0, MatchScorer.call(player(position: "PG", height_cm: 190, weight_kg: 80, ppg: 12), slot).breakdown[:height]
    assert_equal 1.0, MatchScorer.call(player(position: "PG", height_cm: 205, weight_kg: 80, ppg: 12), slot).breakdown[:height]
    # 5cm under, 10cm tolerance -> 0.5
    assert_in_delta 0.5, MatchScorer.call(player(position: "PG", height_cm: 185, weight_kg: 80, ppg: 12), slot).breakdown[:height], 0.0001
    # Beyond tolerance floors at 0
    assert_equal 0.0, MatchScorer.call(player(position: "PG", height_cm: 170, weight_kg: 80, ppg: 12), slot).breakdown[:height]
  end

  test "weight is symmetric around ideal" do
    slot = posting(position: "PG", ideal_height_cm: 150, ideal_weight_kg: 80)

    over = MatchScorer.call(player(position: "PG", height_cm: 200, weight_kg: 84, ppg: 12), slot)
    under = MatchScorer.call(player(position: "PG", height_cm: 200, weight_kg: 76, ppg: 12), slot)

    assert_in_delta 0.5, over.breakdown[:weight], 0.0001
    assert_in_delta 0.5, under.breakdown[:weight], 0.0001
    assert_equal 0.0, MatchScorer.call(player(position: "PG", height_cm: 200, weight_kg: 100, ppg: 12), slot).breakdown[:weight]
  end

  test "production saturates at the 12 PPG reference" do
    slot = posting(position: "PG", ideal_height_cm: 150, ideal_weight_kg: 80)

    assert_equal 1.0, MatchScorer.call(player(position: "PG", height_cm: 200, weight_kg: 80, ppg: 12), slot).breakdown[:production]
    assert_equal 1.0, MatchScorer.call(player(position: "PG", height_cm: 200, weight_kg: 80, ppg: 30), slot).breakdown[:production]
    assert_in_delta 0.5, MatchScorer.call(player(position: "PG", height_cm: 200, weight_kg: 80, ppg: 6), slot).breakdown[:production], 0.0001
  end

  # --- tiering and reasons ------------------------------------------------

  test "tier flips to good at exactly 78" do
    # Constructed to land on the threshold from either side:
    #   position 1.0 (.35) + height 1.0 (.25) + weight 0.2 (.03) + production p (.25p)
    slot = posting(position: "PG", ideal_height_cm: 180, ideal_weight_kg: 90)

    # 7.2 ppg -> production 0.6 -> total 0.78 -> 78 -> good
    good = MatchScorer.call(player(position: "PG", height_cm: 190, weight_kg: 83.6, ppg: 7.2), slot)
    assert_equal 78, good.score
    assert_equal "good", good.tier
    assert_equal "Fits you well", good.reason

    # 6.8 ppg -> total 0.7717 -> 77 -> partial
    partial = MatchScorer.call(player(position: "PG", height_cm: 190, weight_kg: 83.6, ppg: 6.8), slot)
    assert_equal 77, partial.score
    assert_equal "partial", partial.tier
    refute_equal "Fits you well", partial.reason
  end

  test "reason names the weakest component" do
    tall_slot = posting(position: "PG", ideal_height_cm: 200, ideal_weight_kg: 82)
    short_guard = player(position: "PG", height_cm: 178, weight_kg: 82, ppg: 24)
    assert_equal "more height would help", MatchScorer.call(short_guard, tall_slot).reason

    pg_slot = posting(position: "PG", ideal_height_cm: 180, ideal_weight_kg: 82)
    centre = player(position: "C", height_cm: 210, weight_kg: 82, ppg: 24)
    assert_equal "different position than the slot", MatchScorer.call(centre, pg_slot).reason

    # Weight carries only 0.15, so a weight miss alone can't drop a player out
    # of the good tier — production has to be middling too for weight to surface
    # as the weakest component of a *partial*.
    heavy_slot = posting(position: "PG", ideal_height_cm: 180, ideal_weight_kg: 90)
    light_guard = player(position: "PG", height_cm: 190, weight_kg: 82.8, ppg: 6)
    weight_result = MatchScorer.call(light_guard, heavy_slot)
    assert_equal "partial", weight_result.tier
    assert_equal "add strength to match the role", weight_result.reason

    easy_slot = posting(position: "PG", ideal_height_cm: 170, ideal_weight_kg: 80)
    no_scoring = player(position: "PG", height_cm: 190, weight_kg: 80, ppg: 0)
    production_result = MatchScorer.call(no_scoring, easy_slot)
    assert_equal "partial", production_result.tier
    assert_equal "add scoring to stand out", production_result.reason
  end

  test "component ties resolve deterministically in declaration order" do
    # Position 0 and weight 0 both bottom out; position wins the tie.
    slot = posting(position: "C", ideal_height_cm: 150, ideal_weight_kg: 130)
    guard = player(position: "PG", height_cm: 200, weight_kg: 80, ppg: 24)

    result = MatchScorer.call(guard, slot)
    assert_equal 0.0, result.breakdown[:position]
    assert_equal 0.0, result.breakdown[:weight]
    assert_equal "different position than the slot", result.reason
  end

  # --- the seeded matrix, mirroring the client ----------------------------

  # Every posting must have a clear great fit and a close-but-undersized
  # partial. These exact numbers also appear in the client's data/seed.ts docs.
  SEED_MATRIX = {
    "Looking for a starting Point Guard" => {
      "Marcus Webb" => [ 96, "good", "Fits you well" ],
      "Deshawn Price" => [ 77, "partial", "different position than the slot" ],
      "Elijah Carter" => [ 74, "partial", "more height would help" ],
      "Andre Boucher" => [ 50, "partial", "different position than the slot" ],
      "Tyrell Nkemdi" => [ 50, "partial", "different position than the slot" ],
      "Jordan Ellis" => [ 49, "partial", "different position than the slot" ]
    },
    "Wing scorer with size wanted" => {
      "Deshawn Price" => [ 94, "good", "Fits you well" ],
      "Jordan Ellis" => [ 76, "partial", "different position than the slot" ],
      "Marcus Webb" => [ 55, "partial", "more height would help" ],
      "Andre Boucher" => [ 50, "partial", "different position than the slot" ],
      "Tyrell Nkemdi" => [ 50, "partial", "different position than the slot" ],
      "Elijah Carter" => [ 43, "partial", "more height would help" ]
    },
    "Rim-protecting Centre needed" => {
      "Andre Boucher" => [ 88, "good", "Fits you well" ],
      "Tyrell Nkemdi" => [ 63, "partial", "more height would help" ],
      "Marcus Webb" => [ 25, "partial", "different position than the slot" ],
      "Elijah Carter" => [ 25, "partial", "different position than the slot" ],
      "Deshawn Price" => [ 25, "partial", "different position than the slot" ],
      "Jordan Ellis" => [ 24, "partial", "different position than the slot" ]
    },
    "Backup PG needed for rotation" => {
      "Marcus Webb" => [ 95, "good", "Fits you well" ],
      "Deshawn Price" => [ 81, "good", "Fits you well" ],
      "Elijah Carter" => [ 66, "partial", "more height would help" ],
      "Jordan Ellis" => [ 51, "partial", "different position than the slot" ],
      "Andre Boucher" => [ 50, "partial", "different position than the slot" ],
      "Tyrell Nkemdi" => [ 50, "partial", "different position than the slot" ]
    }
  }.freeze

  test "seeded score matrix matches the client implementation exactly" do
    SEED_MATRIX.each do |headline, expectations|
      slot = Posting.find_by!(headline: headline)

      expectations.each do |player_name, (score, tier, reason)|
        profile = PlayerProfile.find_by!(name: player_name)
        result = MatchScorer.call(profile, slot)

        assert_equal score, result.score, "#{player_name} vs #{headline}: score"
        assert_equal tier, result.tier, "#{player_name} vs #{headline}: tier"
        assert_equal reason, result.reason, "#{player_name} vs #{headline}: reason"
      end
    end
  end

  test "every posting has a great fit and an undersized partial" do
    Posting.find_each do |slot|
      results = PlayerProfile.all.map { |p| MatchScorer.call(p, slot) }

      assert results.any? { |r| r.tier == "good" },
             "#{slot.headline} has no clear great fit"
      assert results.any? { |r| r.reason == "more height would help" },
             "#{slot.headline} has no close-but-undersized case"
    end
  end
end
