require "test_helper"

# PPG/RPG/APG/FG% are what MatchScorer ranks on, and they are now derived. If this
# maths is wrong every ranking in the app is quietly wrong with it.
class PlayerAveragesTest < ActiveSupport::TestCase
  setup do
    @team = Team.find_by!(name: "Western Mustangs")
    @admin = User.find_by!(role: "admin")
    # A player with no seeded games, so each test starts from self-reported only.
    @player = PlayerProfile.find_by!(name: "Tyrell Nkemdi")
  end

  def add_game(status:, played_on: Date.new(2026, 1, 1), **line)
    game = Game.create!(team: @team, played_on: played_on, opponent: "Test U",
                        status: status, created_by: @admin)
    game.game_stats.create!({ player_profile: @player }.merge(line))
    game
  end

  test "averages come from approved games" do
    add_game(status: "approved", played_on: Date.new(2026, 1, 1), pts: 20, reb: 10, ast: 4, fgm: 8, fga: 16)
    add_game(status: "approved", played_on: Date.new(2026, 1, 8), pts: 10, reb: 4, ast: 2, fgm: 2, fga: 4)

    PlayerAverages.recompute!(@player)
    @player.reload

    assert_equal 2, @player.games_played
    assert_equal 15.0, @player.ppg.to_f
    assert_equal 7.0, @player.rpg.to_f
    assert_equal 3.0, @player.apg.to_f
    assert @player.stats_from_games?
  end

  test "FG% is total makes over total attempts, not the mean of per-game rates" do
    # 1-for-1 (100%) and 5-for-20 (25%). Averaging the rates gives 62.5%, which
    # would flatter a player for one lucky attempt. The true rate is 6/21 = 28.6%.
    add_game(status: "approved", played_on: Date.new(2026, 2, 1), pts: 2, fgm: 1, fga: 1)
    add_game(status: "approved", played_on: Date.new(2026, 2, 8), pts: 10, fgm: 5, fga: 20)

    PlayerAverages.recompute!(@player)

    assert_equal 28.6, @player.reload.fg_pct.to_f
    assert_not_equal 62.5, @player.fg_pct.to_f
  end

  test "no attempts is 0%, not a division by zero" do
    add_game(status: "approved", pts: 4, fgm: 0, fga: 0, ftm: 4, fta: 4)

    PlayerAverages.recompute!(@player)

    assert_equal 0.0, @player.reload.fg_pct.to_f
  end

  test "pending games are excluded until approved" do
    self_reported = @player.ppg.to_f
    game = add_game(status: "pending", pts: 60, reb: 20, ast: 20, fgm: 20, fga: 20)

    PlayerAverages.recompute!(@player)
    @player.reload
    assert_equal 0, @player.games_played, "a pending game must not count"
    assert_equal self_reported, @player.ppg.to_f, "averages must not move before review"

    game.update!(status: "approved")
    PlayerAverages.recompute_for_game!(game)

    assert_equal 1, @player.reload.games_played
    assert_equal 60.0, @player.ppg.to_f
  end

  test "rejecting a previously approved game takes it back out" do
    keep = add_game(status: "approved", played_on: Date.new(2026, 3, 1), pts: 10, reb: 2, ast: 2, fgm: 4, fga: 8)
    drop = add_game(status: "approved", played_on: Date.new(2026, 3, 8), pts: 30, reb: 6, ast: 6, fgm: 12, fga: 24)

    PlayerAverages.recompute!(@player)
    assert_equal 20.0, @player.reload.ppg.to_f

    drop.update!(status: "rejected")
    PlayerAverages.recompute_for_game!(drop)

    assert_equal 1, @player.reload.games_played
    assert_equal 10.0, @player.ppg.to_f
    assert keep.reload.approved?
  end

  test "losing every game restores what the player reported themselves" do
    original = @player.ppg.to_f
    assert original.positive?, "fixture should have self-reported stats to restore"

    game = add_game(status: "approved", pts: 2, reb: 1, ast: 1, fgm: 1, fga: 5)
    PlayerAverages.recompute!(@player)
    assert_equal 2.0, @player.reload.ppg.to_f

    game.update!(status: "rejected")
    PlayerAverages.recompute_for_game!(game)
    @player.reload

    assert_equal 0, @player.games_played
    assert_equal original, @player.ppg.to_f, "self-reported figures should come back"
    assert_not @player.stats_from_games?
  end

  test "the self-reported snapshot is taken once, not overwritten by derived values" do
    original = @player.ppg.to_f

    add_game(status: "approved", played_on: Date.new(2026, 4, 1), pts: 40, fgm: 10, fga: 20)
    PlayerAverages.recompute!(@player)
    add_game(status: "approved", played_on: Date.new(2026, 4, 8), pts: 40, fgm: 10, fga: 20)
    PlayerAverages.recompute!(@player)

    assert_equal original, @player.reload.self_reported_ppg.to_f,
                 "a second recompute must not snapshot the derived value"
  end

  test "recompute_for_game touches every player in that game" do
    other = PlayerProfile.find_by!(name: "Jordan Ellis")
    game = Game.create!(team: @team, played_on: Date.new(2026, 5, 1), opponent: "Test U",
                        status: "approved", created_by: @admin)
    game.game_stats.create!(player_profile: @player, pts: 12, fgm: 5, fga: 10)
    game.game_stats.create!(player_profile: other, pts: 8, fgm: 4, fga: 10)

    PlayerAverages.recompute_for_game!(game)

    assert_equal 12.0, @player.reload.ppg.to_f
    assert_equal 8.0, other.reload.ppg.to_f
  end
end
