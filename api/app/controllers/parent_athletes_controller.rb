class ParentAthletesController < ApplicationController
  before_action :require_parent!

  # GET /parent/athletes
  # Returns all athletes linked to the logged-in parent.
  def index
    athletes = current_user.athletes.includes(:player_profile)

    render json: athletes.map { |athlete| athlete_payload(athlete) }
  end

  # POST /parent/athletes/link
  # Links an existing player account to the logged-in parent by email.
  def link
    email = params.require(:email).to_s.strip.downcase

    athlete = User.find_by(email: email, role: "player")

    unless athlete
      return render_error(
        "No athlete account found with that email",
        status: :not_found
      )
    end

    if current_user.athletes.exists?(athlete.id)
      return render_error(
        "This athlete is already linked to your account",
        status: :unprocessable_entity
      )
    end

    ParentAthlete.create!(
      parent: current_user,
      athlete: athlete
    )

    render json: {
      message: "Athlete linked successfully",
      athlete: athlete_payload(athlete)
    }, status: :created
  end

  private

  def athlete_payload(athlete)
    profile = athlete.player_profile

    {
      id: athlete.id,
      email: athlete.email,
      player_profile_id: profile&.id,
      name: profile&.name,
      position: profile&.position
    }
  end
end