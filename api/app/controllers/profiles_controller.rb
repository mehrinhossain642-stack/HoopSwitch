# GET/PATCH /profile — the player's own editable profile (proposal §5).
class ProfilesController < ApplicationController
  before_action :require_player!

  def show
    render json: PlayerSerializer.call(current_player_profile)
  end

  def update
    current_player_profile.update!(profile_params)
    render json: PlayerSerializer.call(current_player_profile)
  end

  private

  def profile_params
    params.require(:profile).permit(
      :name, :position, :height_cm, :weight_kg, :wingspan_cm, :age,
      :dominant_hand, :eligibility_years, :location, :bio,
      :ppg, :rpg, :apg, :fg_pct
    )
  end
end
