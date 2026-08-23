class ApplicationController < ActionController::API
  before_action :authenticate_user!

  rescue_from ActiveRecord::RecordNotFound do |error|
    render_error(error.message, status: :not_found)
  end

  rescue_from ActionController::ParameterMissing do |error|
    render_error(error.message, status: :bad_request)
  end

  rescue_from ActiveRecord::RecordInvalid do |error|
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  # --- role guards -------------------------------------------------------

  def require_player!
    render_error("Player account required", status: :forbidden) unless current_user.player?
  end

  def require_coach!
    render_error("Coach account required", status: :forbidden) unless current_user.coach?
  end

  def require_parent!
  render_error("Parent account required", status: :forbidden) unless current_user.parent?
end

  def current_player_profile
    @current_player_profile ||=
      current_user.player_profile ||
      raise(ActiveRecord::RecordNotFound, "No player profile for this account")
  end

  def current_team
    @current_team ||=
      current_user.team ||
      raise(ActiveRecord::RecordNotFound, "No team for this account")
  end

  def render_error(message, status:)
    render json: { errors: Array(message) }, status: status
  end
end
