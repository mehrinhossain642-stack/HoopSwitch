module Auth
  # POST /login   -> JWT in the Authorization header
  # DELETE /logout -> rotates the user's jti, invalidating issued tokens
  class SessionsController < Devise::SessionsController
    respond_to :json

    # Devise guards #destroy with verify_signed_out_user, which looks for an
    # existing session via `warden.user(run_callbacks: false)` — deliberately
    # skipping strategies, so the JWT is never consulted and logout always 401s
    # in a stateless API. Authenticate from the bearer token instead.
    skip_before_action :verify_signed_out_user, only: :destroy
    before_action :authenticate_user!, only: :destroy

    private

    # See the note in RegistrationsController: no session store exists, so
    # authentication must not try to populate one.
    def auth_options
      super.merge(store: false)
    end

    def respond_with(resource, _opts = {})
      render json: {
        user: {
          id: resource.id,
          email: resource.email,
          role: resource.role,
          player_profile_id: resource.player_profile&.id,
          team_id: resource.team&.id
        },
        message: "Logged in successfully"
      }, status: :ok
    end

    # Signature mirrors Devise 5's, which passes :unauthorized when there was no
    # session to destroy and :no_content otherwise.
    def respond_to_on_destroy(non_navigational_status: :no_content)
      if non_navigational_status == :unauthorized
        render json: { errors: [ "No active session" ] }, status: :unauthorized
      else
        render json: { message: "Logged out successfully" }, status: :ok
      end
    end
  end
end
