module Admin
  class DashboardController < ApplicationController
    before_action :require_admin!

    def show
      render json: {
        pending_applications: Connection.applications
                                        .where(status: "under_review")
                                        .count,

        active_opportunities: Posting.where(status: "open").count,

        pending_stat_requests: Game.where(status: "pending").count,

        registered_athletes: User.where(role: "player").count,

        teams_without_accounts: Team.where(user_id: nil).count,

        waiting_for_parent: Connection.where(
          status: "pending_parent_approval"
        ).count
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