module Admin
  class UsersController < ApplicationController
    before_action :require_admin!

    def index
      users = User
              .includes(:team)
              .order(created_at: :desc)

      if params[:role].present?
        users = users.where(role: params[:role])
      end

      render json: {
        users: users.map do |user|
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            created_at: user.created_at.iso8601,
            team_name: user.team&.name
          }
        end
      }
    end

    private

    def require_admin!
      return if current_user.admin?

      render_error(
        "Admin account required",
        status: :forbidden
      )
    end
  end
end