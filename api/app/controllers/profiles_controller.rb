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

  # POST /profile/complete_onboarding — stamps the flow as finished so the
  # client stops routing into it. Separate from #update so finishing is an
  # explicit action rather than a magic field in a PATCH body.
  def complete_onboarding
    current_player_profile.update!(onboarding_completed_at: Time.current)
    render json: PlayerSerializer.call(current_player_profile)
  end

  private

  def profile_params
    params.require(:profile).permit(
      :name, :position, :height_cm, :weight_kg, :wingspan_cm, :age,
      :dominant_hand, :eligibility_years, :location, :bio,
      :ppg, :rpg, :apg, :fg_pct,
      # Onboarding
      :school, :graduation_year, :grade, :city, :province,
      :secondary_position, :current_team, :short_term_goal,
      goals: []
    )
  end
end
