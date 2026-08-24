# Game box score uploads, and their review.
#
#   POST   /games/preview  coach|admin  resolve rows, write nothing
#   POST   /games          coach|admin  create the game (pending for a coach)
#   GET    /games          coach|admin  own team's games / everything awaiting review
#   PATCH  /games/:id      admin        approve or reject
#
# A coach's upload is inert until an admin approves it: averages, and therefore
# every team's ranking of that player, only move on approval.
class GamesController < ApplicationController
  before_action :require_uploader!, only: %i[preview create index]
  before_action :require_admin!, only: %i[update]

  def preview
    import = build_import
    render json: {
      summary: import.summary,
      rows: import.results.map(&:as_json),
      game_errors: import.game_errors,
      lands_as: import.status_for_actor
    }
  end

  def create
    import = build_import

    if import.game_errors.any?
      return render_error(import.game_errors, status: :unprocessable_entity)
    end

    if import.matched.empty?
      return render_error(
        "No row in this box score matched a player, so nothing was saved",
        status: :unprocessable_entity
      )
    end

    game = import.commit!

    render json: {
      game: GameSerializer.call(game, include_stats: true),
      summary: import.summary,
      rows: import.results.map(&:as_json)
    }, status: :created
  end

  # Coaches see their own team's uploads and where each one stands. Admins see
  # every team's, newest first, so the review queue is the default view.
  def index
    games =
      if current_user.admin?
        Game.all
      else
        current_team.games
      end

    games = games.where(status: params[:status]) if Game::STATUSES.include?(params[:status])

    render json: {
      # Stat lines ride along: reviewing a game without seeing its numbers is
      # rubber-stamping, and a separate show endpoint per row would be worse.
      games: games.includes(:team, :created_by, :reviewed_by, game_stats: :player_profile)
                  .recent_first
                  .map { |game| GameSerializer.call(game, include_stats: true) }
    }
  end

  def update
    game = Game.find(params[:id])
    decision = params.require(:game)[:status].to_s

    unless %w[approved rejected].include?(decision)
      return render_error("Decision must be approved or rejected", status: :bad_request)
    end

    game.update!(
      status: decision,
      reviewed_by: current_user,
      reviewed_at: Time.current,
      review_note: params.require(:game)[:review_note].presence
    )

    # Recompute either way: approving folds the game in, rejecting a previously
    # approved one has to take it back out.
    PlayerAverages.recompute_for_game!(game)

    render json: { game: GameSerializer.call(game, include_stats: true) }
  end

  private

  def require_uploader!
    return if current_user.coach? || current_user.admin?

    render_error("Coach or admin account required", status: :forbidden)
  end

  def require_admin!
    render_error("Admin account required", status: :forbidden) unless current_user.admin?
  end

  def build_import
    BoxScoreImport.new(
      rows: params.require(:rows),
      team: upload_team,
      actor: current_user,
      played_on: params[:played_on],
      opponent: params[:opponent]
    )
  end

  # An admin uploads on a team's behalf and must say which; a coach can only ever
  # upload for their own.
  def upload_team
    if current_user.admin?
      Team.find(params.require(:team_id))
    else
      current_team
    end
  end
end
