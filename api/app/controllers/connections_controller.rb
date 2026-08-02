# POST /connections      — apply (player) or invite (coach)
# PATCH /connections/:id — accept / decline
#
# One endpoint pair covers both directions; initiated_by is derived from the
# caller's role rather than trusted from the request body (proposal §3).
class ConnectionsController < ApplicationController
  def index
    render json: { connections: visible_connections.map { |c| ConnectionSerializer.call(c) } }
  end

  def create
    connection = build_connection
    connection.save!
    render json: ConnectionSerializer.call(connection), status: :created
  end

  def update
    connection = visible_connections.find(params[:id])

    unless connection.respondable_by?(current_user)
      return render_error("You can't respond to this connection", status: :forbidden)
    end

    connection.update!(status: response_status)
    render json: ConnectionSerializer.call(connection)
  end

  private

  def build_connection
    if current_user.player?
      posting = Posting.visible.find(params.require(:connection)[:posting_id])
      Connection.new(posting: posting, player_profile: current_player_profile,
                     initiated_by: "player")
    else
      posting = current_team.postings.find(params.require(:connection)[:posting_id])
      player = PlayerProfile.find(params.require(:connection)[:player_profile_id])
      Connection.new(posting: posting, player_profile: player, initiated_by: "coach")
    end
  end

  def visible_connections
    if current_user.player?
      Connection.where(player_profile: current_player_profile)
    else
      Connection.where(posting: current_team.postings)
    end
  end

  def response_status
    status = params.require(:connection)[:status]
    unless %w[accepted declined].include?(status)
      raise ActionController::ParameterMissing, "status must be accepted or declined"
    end

    status
  end
end
