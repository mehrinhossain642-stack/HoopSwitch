module Admin
  class PostingsController < ApplicationController
    before_action :require_admin!

    def index
      postings = Posting
                  .includes(:connections, team: :user)
                  .order(created_at: :desc)

      render json: {
        postings: postings.map do |posting|
          PostingSerializer.call(posting)
        end
      }
    end

    def create
      team = Team.find(
        params.require(:posting).require(:team_id)
      )

      return missing_coach_name unless team.coach_name.present?

      posting = team.postings.create!(posting_params)

      render(
        json: PostingSerializer.call(posting),
        status: :created
      )
    end

    def update
      posting = Posting.find(params[:id])

      if params.dig(:posting, :team_id).present?
        posting.team = Team.find(
          params[:posting][:team_id]
        )
      end

      return missing_coach_name unless posting.team.coach_name.present?

      posting.update!(posting_params)

      render json: PostingSerializer.call(posting)
    end

    def destroy
      posting = Posting.find(params[:id])
      posting.destroy!

      head :no_content
    end

    private

    def posting_params
      params.require(:posting).permit(
        :position,
        :ideal_height_cm,
        :ideal_weight_kg,
        :expected_minutes,
        :status,
        :notes,
        :headline
      )
    end

    def missing_coach_name
      render_error(
        "Add the team's coach name before publishing an opportunity",
        status: :unprocessable_entity
      )
    end

    def require_admin!
      return if current_user.admin?

      render_error(
        "Admin account required",
        status: :forbidden
      )
    end
  end
end