# The two scored feeds (proposal §5). Both are ranked by descending match score
# and both go through the same MatchScorer.
#
# Scoring runs on the fly per request — the dataset is tiny, so no caching. If
# feeds grow, precompute into a match_scores table on write (proposal §4).
class FeedsController < ApplicationController
  # GET /feed/postings — player-facing. Every visible posting, scored against
  # the current player.
  def postings
    require_player!
    return if performed?

    player = current_player_profile
    scored = Posting.visible
                    .includes(:team, :connections)
                    .map { |posting| [ posting, MatchScorer.call(player, posting) ] }

    applied_ids = player.connections.pluck(:posting_id).to_set

    render json: {
      player_id: player.id,
      postings: rank(scored) { |posting, _match| posting.team.name }.map do |posting, match|
        PostingSerializer.call(posting, match: match)
          .merge(connected: applied_ids.include?(posting.id))
      end
    }
  end

  # GET /feed/players?posting_id= — coach-facing. Every player, scored against
  # the selected slot. Defaults to the team's first posting so the feed is never
  # unscoped.
  def players
    require_coach!
    return if performed?

    posting = selected_posting
    return render_error("This team has no postings yet", status: :not_found) if posting.nil?

    scored = PlayerProfile.includes(:career_stats, :highlights, :connections)
                          .map { |player| [ player, MatchScorer.call(player, posting) ] }

    invited_ids = posting.connections.pluck(:player_profile_id).to_set

    render json: {
      posting: PostingSerializer.call(posting, include_team: false),
      players: rank(scored) { |player, _match| player.name }.map do |player, match|
        PlayerSerializer.call(player, match: match)
          .merge(connected: invited_ids.include?(player.id))
      end
    }
  end

  private

  def selected_posting
    if params[:posting_id].present?
      current_team.postings.find(params[:posting_id])
    else
      current_team.postings.order(:created_at).first
    end
  end

  # Descending score, ties broken by the given label so ordering is stable.
  def rank(scored)
    scored.sort_by do |record, match|
      [ -match.score, yield(record, match) ]
    end
  end
end
