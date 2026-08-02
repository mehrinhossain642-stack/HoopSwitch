# POST/PATCH/DELETE /postings — roster slot CRUD, scoped to the coach's own
# team (proposal §5).
class PostingsController < ApplicationController
  before_action :require_coach!

  def create
    posting = current_team.postings.create!(posting_params)
    render json: PostingSerializer.call(posting, include_team: false), status: :created
  end

  def update
    posting = current_team.postings.find(params[:id])
    posting.update!(posting_params)
    render json: PostingSerializer.call(posting, include_team: false)
  end

  def destroy
    posting = current_team.postings.find(params[:id])
    posting.destroy!
    head :no_content
  end

  private

  def posting_params
    params.require(:posting).permit(
      :position, :ideal_height_cm, :ideal_weight_kg, :expected_minutes,
      :status, :notes, :headline
    )
  end
end
