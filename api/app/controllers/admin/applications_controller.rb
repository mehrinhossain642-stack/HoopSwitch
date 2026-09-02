module Admin
  class ApplicationsController < ApplicationController
    before_action :require_admin!

    def index
      applications = Connection
               .applications
               .includes(
                 :player_profile,
                 posting: :team
               )
               .order(created_at: :desc)

      if params[:status].present?
        applications = applications.where(
          status: params[:status]
        )
      end

      render json: {
        applications: applications.map do |application|
          ConnectionSerializer.call(application)
        end
      }
    end

    def update
      application = Connection.applications.find(params[:id])
      status = params.require(:connection).require(:status)

      allowed_statuses = %w[
        under_review
        shared_with_coach
        coach_interested
        tryout_offered
        confirmed
        declined
        not_selected
        closed
      ]

      unless allowed_statuses.include?(status)
        return render_error(
          "Invalid application status",
          status: :unprocessable_entity
        )
      end

      application.update!(status: status)

      render json: ConnectionSerializer.call(application)
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