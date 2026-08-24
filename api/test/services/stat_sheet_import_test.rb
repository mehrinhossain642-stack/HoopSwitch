require "test_helper"

# The resolver decides which player a spreadsheet row overwrites, so a mistake
# here writes someone else's numbers onto a profile and silently re-ranks them for
# every team. Tested per outcome rather than end to end.
class StatSheetImportTest < ActiveSupport::TestCase
  setup do
    @team = Team.first
    @player = PlayerProfile.joins(:user).find_by!(users: { email: "marcus.webb@example.com" })
  end

  def import(rows)
    StatSheetImport.new(rows: rows, team: @team)
  end

  # --- matching -----------------------------------------------------------

  test "matches on email, case-insensitively" do
    result = import([ { "identifier" => "MARCUS.WEBB@EXAMPLE.COM", "ppg" => "21.5" } ]).results.first

    assert_equal "matched", result.status
    assert_equal @player.id, result.player_profile.id
    assert_equal({ "ppg" => 21.5 }, result.changes)
  end

  test "matches on jersey number when it identifies exactly one player" do
    @player.update!(jersey_number: 7)

    result = import([ { "identifier" => "7", "ppg" => "12.0" } ]).results.first

    assert_equal "matched", result.status
    assert_equal @player.id, result.player_profile.id
  end

  test "reports a jersey number shared by several players as ambiguous, and writes nothing" do
    others = PlayerProfile.where.not(id: @player.id).limit(1).to_a
    @player.update!(jersey_number: 23)
    others.each { |p| p.update!(jersey_number: 23) }

    importer = import([ { "identifier" => "23", "ppg" => "30.0" } ])
    result = importer.results.first

    assert_equal "ambiguous", result.status
    assert_match(/use their email instead/, result.message)
    assert_includes result.message, @player.name
    assert_empty importer.matched, "an ambiguous row must not be applied"
  end

  test "unknown identifier is unmatched" do
    result = import([ { "identifier" => "nobody@nowhere.test", "ppg" => "9" } ]).results.first
    assert_equal "unmatched", result.status
  end

  test "a bare name is not treated as an identifier" do
    result = import([ { "identifier" => "Marcus Webb", "ppg" => "9" } ]).results.first

    assert_equal "unmatched", result.status,
                 "only an email or a numeric jersey should resolve"
  end

  # --- parsing and validation ---------------------------------------------

  test "tolerates spreadsheet formatting" do
    result = import([
      { "identifier" => " marcus.webb@example.com ", "fg_pct" => "47%", "ppg" => " 18.4 " }
    ]).results.first

    assert_equal "matched", result.status
    assert_equal({ "ppg" => 18.4, "fg_pct" => 47.0 }, result.changes)
  end

  test "rejects a non-numeric stat rather than coercing it to zero" do
    result = import([ { "identifier" => "marcus.webb@example.com", "ppg" => "n/a" } ]).results.first

    assert_equal "invalid", result.status
    assert_match(/isn't a number/, result.message)
  end

  test "rejects out-of-range values" do
    result = import([ { "identifier" => "marcus.webb@example.com", "fg_pct" => "470" } ]).results.first

    assert_equal "invalid", result.status
    assert_match(/outside/, result.message)
  end

  test "a row with an identifier but no stat columns is invalid" do
    result = import([ { "identifier" => "marcus.webb@example.com" } ]).results.first

    assert_equal "invalid", result.status
    assert_match(/No stat columns/, result.message)
  end

  test "blank identifier is invalid" do
    assert_equal "invalid", import([ { "identifier" => "", "ppg" => "5" } ]).results.first.status
  end

  test "only supplied columns are written" do
    before_rpg = @player.rpg

    import([ { "identifier" => "marcus.webb@example.com", "ppg" => "25.0" } ]).commit!

    assert_equal 25.0, @player.reload.ppg.to_f
    assert_equal before_rpg.to_f, @player.rpg.to_f, "an absent column must not zero the stat"
  end

  # --- commit -------------------------------------------------------------

  test "commit records who overwrote the stats and when" do
    import([ { "identifier" => "marcus.webb@example.com", "ppg" => "19.9" } ]).commit!
    @player.reload

    assert_equal @team.id, @player.stats_updated_by_team_id
    assert_not_nil @player.stats_updated_at
  end

  test "commit applies only resolved rows and leaves the rest alone" do
    importer = import([
      { "identifier" => "marcus.webb@example.com", "ppg" => "14.2" },
      # Valid number, unknown player — otherwise the range check would classify
      # this as invalid before matching ever runs.
      { "identifier" => "nobody@nowhere.test", "ppg" => "9.0" },
      { "identifier" => "marcus.webb@example.com", "ppg" => "bogus" }
    ])

    assert_equal 1, importer.commit!
    assert_equal 14.2, @player.reload.ppg.to_f

    summary = importer.summary
    assert_equal 3, summary[:total]
    assert_equal 1, summary[:matched]
    assert_equal 1, summary[:unmatched]
    assert_equal 1, summary[:invalid]
  end

  test "a row failing model validation rolls the whole commit back" do
    importer = import([ { "identifier" => "marcus.webb@example.com", "ppg" => "20.0" } ])
    before = @player.ppg.to_f

    # Force the save to fail the way a concurrently-invalidated profile would.
    @player.update_columns(height_cm: 10)

    assert_raises(ActiveRecord::RecordInvalid) { importer.commit! }
    assert_equal before, @player.reload.ppg.to_f, "a failed commit must not leave partial writes"
  ensure
    @player.update_columns(height_cm: 188)
  end
end
