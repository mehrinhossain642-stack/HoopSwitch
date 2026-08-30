module Auth
  # POST /signup -> creates the account and returns a JWT in the
  # Authorization header via devise-jwt.
  class RegistrationsController < Devise::RegistrationsController
    respond_to :json

    # Roles anyone may sign up as. `admin` is deliberately absent: it can create
    # teams, reassign coaches and approve stat changes, so a public endpoint that
    # accepted it would let anyone grant themselves those powers. Admins come from
    # db/seeds.rb or a deliberate promotion with database access.
    SELF_SERVE_ROLES = %w[player coach parent].freeze

    before_action :reject_privileged_role, only: :create

    private

    def reject_privileged_role
      role = params.dig(:user, :role).to_s
      return if role.empty? || SELF_SERVE_ROLES.include?(role)

      render json: { errors: [ "#{role} accounts can't be created here" ] },
             status: :forbidden
    end

    def sign_up(resource_name, resource)
      sign_in(resource_name, resource, store: false)
    end

    def sign_up_params
  params.require(:user).permit(
    :email,
    :password,
    :password_confirmation,
    :role,
    :name,
    :avatar_url
  )
end

    def respond_with(resource, _opts = {})
      if resource.persisted?
        seed_role_record(resource)

        render json: {
          user: user_payload(resource),
          message: "Signed up successfully"
        }, status: :created
      else
        render json: {
          errors: resource.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    def seed_role_record(user)
      placeholder =
        user.email
            .split("@")
            .first
            .to_s
            .tr("._-", "  ")
            .squish
            .presence || "New user"

      if user.player?
        user.create_player_profile!(
          name: placeholder.titleize,
          position: "PG",
          height_cm: 185,
          weight_kg: 80,
          wingspan_cm: 190,
          age: 20,
          dominant_hand: "Right",
          eligibility_years: 1
        )
      elsif user.coach?
        user.create_team!(
          name: "#{placeholder.titleize} Program",
          coach_name: placeholder.titleize
        )
      end
    end

    def user_payload(user)
  {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    avatar_url: user.avatar_url,
    player_profile_id: user.player_profile&.id,
    team_id: user.team&.id
  }
end
  end
end
