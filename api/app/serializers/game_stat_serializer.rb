module GameStatSerializer
  # `include_game` is what makes a player's box score renderable — the client needs
  # the date and opponent on each line to draw a game log.
  def self.call(stat, include_game: false)
    payload = {
      id: stat.id,
      player_profile_id: stat.player_profile_id,
      player_name: stat.player_profile&.name,
      minutes: stat.minutes,
      fgm: stat.fgm,
      fga: stat.fga,
      tpm: stat.tpm,
      tpa: stat.tpa,
      ftm: stat.ftm,
      fta: stat.fta,
      reb: stat.reb,
      ast: stat.ast,
      stl: stat.stl,
      blk: stat.blk,
      tov: stat.tov,
      pts: stat.pts
    }

    if include_game
      payload[:game_id] = stat.game_id
      payload[:played_on] = stat.game.played_on.to_s
      payload[:opponent] = stat.game.opponent
      payload[:team_name] = stat.game.team&.name
      payload[:status] = stat.game.status
    end

    payload
  end
end
