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

  # GET /parent/athletes/:id/opportunities
  def opportunities
    athlete = linked_athlete

    return unless athlete

    player = athlete.player_profile

    unless player
      return render_error(
        "This athlete does not have a player profile yet",
        status: :unprocessable_entity
      )
    end

    scored = Posting.visible
                    .includes(:team, :connections)
                    .map do |posting|
                      [posting, MatchScorer.call(player, posting)]
                    end

    applied_ids = player.connections.pluck(:posting_id).to_set

    ranked = scored.sort_by do |posting, match|
      [-match.score, posting.team.name]
    end

    render json: {
      athlete: athlete_payload(athlete),
      player_id: player.id,
      postings: ranked.map do |posting, match|
        PostingSerializer.call(posting, match: match)
          .merge(connected: applied_ids.include?(posting.id))
      end
    }
  end

  # GET /parent/athletes/:id/profile
  def profile
    athlete = linked_athlete

    return unless athlete

    player = athlete.player_profile

    unless player
      return render_error(
        "This athlete does not have a player profile yet",
        status: :unprocessable_entity
      )
    end

    render json: PlayerSerializer.call(player)
  end

  # PATCH /parent/athletes/:id/profile
  def update_profile
    athlete = linked_athlete

    return unless athlete

    player = athlete.player_profile

    unless player
      return render_error(
        "This athlete does not have a player profile yet",
        status: :unprocessable_entity
      )
    end

    player.update!(parent_profile_params)

    render json: PlayerSerializer.call(player)
  end

  private

  def linked_athlete
    athlete = current_user.athletes
                          .includes(:player_profile)
                          .find_by(id: params[:id])

    unless athlete
      render_error(
        "Athlete not found or not linked to this parent",
        status: :not_found
      )
    end

    athlete
  end

  def parent_profile_params
    params.require(:profile).permit(
      :name,
      :location,
      :age,
      :height_cm,
      :weight_kg,
      :wingspan_cm,
      :position,
      :dominant_hand,
      :eligibility_years,
      :bio,
      :school,
      :graduation_year,
      :grade,
      :city,
      :province,
      :secondary_position,
      :current_team,
      :short_term_goal,
      goals: []
    )
  end

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