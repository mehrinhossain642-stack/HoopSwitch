module GameSerializer
  def self.call(game, include_stats: false)
    payload = {
      id: game.id,
      team_id: game.team_id,
      team_name: game.team&.name,
      played_on: game.played_on.to_s,
      opponent: game.opponent,
      status: game.status,
      uploaded_by_email: game.created_by&.email,
      uploaded_by_role: game.created_by&.role,
      reviewed_by_email: game.reviewed_by&.email,
      reviewed_at: game.reviewed_at,
      review_note: game.review_note,
      player_count: game.game_stats.size
    }

    if include_stats
      payload[:stats] = game.game_stats.includes(:player_profile).map do |stat|
        GameStatSerializer.call(stat)
      end
    end

    payload
  end
end
