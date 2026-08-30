# POST /connections      — apply (player) or invite (coach)
# PATCH /connections/:id — accept / decline
#
# One endpoint pair covers both directions; initiated_by is derived from the
# caller's role rather than trusted from the request body (proposal §3).
class ConnectionsController < ApplicationController
  def index
  connections = visible_connections
                  .includes(:player_profile, posting: :team)
                  .order(created_at: :desc)

  render json: {
    connections: connections.map do |connection|
      ConnectionSerializer.call(connection)
    end
  }
end

  def create
    connection = build_connection
    connection.save!
    render json: ConnectionSerializer.call(connection), status: :created
  end

  def update
  connection = visible_connections.find(params[:id])

  # Parent reviewing an athlete application
  if current_user.parent?
    unless connection.status == "pending_parent_approval"
      return render_error(
        "This application no longer requires parent approval",
        status: :unprocessable_entity
      )
    end

    status = params.require(:connection)[:status]

    unless %w[under_review declined].include?(status)
      return render_error(
        "Parent can only approve or decline this application",
        status: :unprocessable_entity
      )
    end

    connection.update!(status: status)

    return render json: ConnectionSerializer.call(connection)
  end

  # Existing player / coach logic
  unless connection.respondable_by?(current_user)
    return render_error(
      "You can't respond to this connection",
      status: :forbidden
    )
  end

  connection.update!(status: response_status)

  render json: ConnectionSerializer.call(connection)
end

  private

  def build_connection
  if current_user.player?
    posting = Posting.visible.find(
      params.require(:connection)[:posting_id]
    )

    Connection.new(
      posting: posting,
      player_profile: current_player_profile,
      initiated_by: "player",
      status: "pending_parent_approval"
    )

  elsif current_user.parent?
    posting = Posting.visible.find(
      params.require(:connection)[:posting_id]
    )

    player_profile_id =
      params.require(:connection)[:player_profile_id]

    athlete = current_user.athletes
                          .includes(:player_profile)
                          .find_by(
                            player_profiles: {
                              id: player_profile_id
                            }
                          )

    unless athlete
      raise ActiveRecord::RecordNotFound,
            "Athlete is not linked to this parent"
    end

    Connection.new(
      posting: posting,
      player_profile: athlete.player_profile,
      initiated_by: "parent",
      status: "under_review"
    )

  else
    posting = current_team.postings.find(
      params.require(:connection)[:posting_id]
    )

    player = PlayerProfile.find(
      params.require(:connection)[:player_profile_id]
    )

    Connection.new(
      posting: posting,
      player_profile: player,
      initiated_by: "coach",
      status: "under_review"
    )
  end
end

  def visible_connections
  if current_user.player?
    Connection.where(
      player_profile: current_player_profile
    )

  elsif current_user.parent?
    player_profile_ids =
      current_user.athletes
                  .joins(:player_profile)
                  .pluck("player_profiles.id")

    Connection.where(
      player_profile_id: player_profile_ids
    )

  else
    Connection.where(
      posting: current_team.postings
    )
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
