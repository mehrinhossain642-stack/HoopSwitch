# GET/PATCH /team — the coach's own team, with its roster slots embedded
# (proposal §5).
class TeamsController < ApplicationController
  before_action :require_coach!

  def show
    render json: TeamSerializer.call(current_team)
  end

  def update
    current_team.update!(team_params)
    render json: TeamSerializer.call(current_team)
  end

  private

  def team_params
    params.require(:team).permit(
      :name, :league, :location, :wins, :losses, :roster_size, :coach_name, :about, :logo_url
    )
  end
end
