module Auth
  # POST /signup -> creates the account and (via devise-jwt dispatch) returns a
  # JWT in the Authorization header.
  #
  # Creating the role-appropriate record here means a client is never left with
  # an authenticated user that has no profile to edit.
  class RegistrationsController < Devise::RegistrationsController
    respond_to :json

    private

    # API-only apps have no session store. Signing in with `store: false` keeps
    # Warden from writing to one, while still firing the hook devise-jwt uses to
    # dispatch the token — i.e. genuinely stateless, no cookie middleware added
    # back just to satisfy Devise.
    def sign_up(resource_name, resource)
      sign_in(resource_name, resource, store: false)
    end

    def sign_up_params
      params.require(:user).permit(:email, :password, :password_confirmation, :role)
    end

    def respond_with(resource, _opts = {})
      if resource.persisted?
        seed_role_record(resource)
        render json: {
          user: user_payload(resource),
          message: "Signed up successfully"
        }, status: :created
      else
        render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # A brand-new account needs somewhere to put profile edits. Name is derived
    # from the email local-part so the record is valid immediately; the client
    # PATCHes real values from the profile screen.
    def seed_role_record(user)
      placeholder = user.email.split("@").first.to_s.tr("._-", "  ").squish.presence || "New user"

      if user.player?
        user.create_player_profile!(
          name: placeholder.titleize, position: "PG", height_cm: 185, weight_kg: 80,
          wingspan_cm: 190, age: 20, dominant_hand: "Right", eligibility_years: 1
        )
      else
        user.create_team!(name: "#{placeholder.titleize} Program", coach_name: placeholder.titleize)
      end
    end

    def user_payload(user)
      {
        id: user.id,
        email: user.email,
        role: user.role,
        player_profile_id: user.player_profile&.id,
        team_id: user.team&.id
      }
    end
  end
end
