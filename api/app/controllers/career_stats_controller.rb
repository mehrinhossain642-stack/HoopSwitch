# POST /career_stats (proposal §5).
class CareerStatsController < ApplicationController
  before_action :require_player!

  def create
    stat = current_player_profile.career_stats.create!(career_stat_params)
    render json: CareerStatSerializer.call(stat), status: :created
  end

  private

  def career_stat_params
    params.require(:career_stat).permit(:season, :team_name, :gp, :ppg, :rpg, :apg)
  end
end
