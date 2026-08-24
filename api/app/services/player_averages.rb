# Recomputes a player's averages from their approved games.
#
# `ppg/rpg/apg/fg_pct` on player_profiles stay the *effective* figures — the ones
# MatchScorer, both feeds and every card already read — so nothing downstream has
# to learn about games. This service is what keeps them true.
#
# The player's own onboarding numbers are snapshotted into `self_reported_*` the
# first time games take over, so rejecting or deleting every game restores what
# they entered rather than leaving zeroes behind.
class PlayerAverages
  def self.recompute!(player_profile)
    new(player_profile).recompute!
  end

  # Recomputes everyone with a line in this game. Used after an approve/reject, so
  # a decision immediately reflects in rankings.
  def self.recompute_for_game!(game)
    PlayerProfile.where(id: game.game_stats.select(:player_profile_id)).find_each do |profile|
      recompute!(profile)
    end
  end

  def initialize(player_profile)
    @profile = player_profile
  end

  def recompute!
    snapshot_self_reported

    totals = approved_totals

    if totals["games"].to_i.zero?
      restore_self_reported
      return @profile
    end

    games = totals["games"].to_i
    fga = totals["fga"].to_i

    @profile.update!(
      games_played: games,
      ppg: average(totals["pts"], games),
      rpg: average(totals["reb"], games),
      apg: average(totals["ast"], games),
      # Rate, not an average of rates. Zero attempts stays 0 rather than dividing
      # by zero — a player can genuinely take no shots.
      fg_pct: fga.zero? ? 0.0 : ((totals["fgm"].to_f / fga) * 100).round(1)
    )

    @profile
  end

  private

  SUMMED = %w[pts reb ast fgm fga].freeze

  # One aggregate query. Returns totals across the player's approved games.
  def approved_totals
    columns = [ Arel.sql("COUNT(*)") ] +
              SUMMED.map { |field| Arel.sql("COALESCE(SUM(#{field}), 0)") }

    values = GameStat
             .joins(:game)
             .where(player_profile_id: @profile.id, games: { status: "approved" })
             .pick(*columns)

    ([ "games" ] + SUMMED).zip(Array(values)).to_h
  end

  def average(total, games)
    (total.to_f / games).round(1)
  end

  # Only ever written once. Doing it on every recompute would overwrite the real
  # self-reported values with derived ones on the second game.
  def snapshot_self_reported
    return if @profile.self_reported_ppg.present?
    return if @profile.games_played.positive?

    @profile.update_columns(
      self_reported_ppg: @profile.ppg,
      self_reported_rpg: @profile.rpg,
      self_reported_apg: @profile.apg,
      self_reported_fg_pct: @profile.fg_pct
    )
    @profile.reload
  end

  def restore_self_reported
    @profile.update!(
      games_played: 0,
      ppg: @profile.self_reported_ppg || 0,
      rpg: @profile.self_reported_rpg || 0,
      apg: @profile.self_reported_apg || 0,
      fg_pct: @profile.self_reported_fg_pct || 0
    )
  end
end
