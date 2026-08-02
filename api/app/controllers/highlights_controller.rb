# POST/DELETE /highlights (proposal §5). External links only in the MVP — see
# the Highlight model.
class HighlightsController < ApplicationController
  before_action :require_player!

  def create
    highlight = current_player_profile.highlights.create!(highlight_params)
    render json: HighlightSerializer.call(highlight), status: :created
  end

  def destroy
    highlight = current_player_profile.highlights.find(params[:id])
    highlight.destroy!
    head :no_content
  end

  private

  def highlight_params
    params.require(:highlight)
          .permit(:title, :url, :duration_seconds, :thumbnail_url, :source_type)
          .with_defaults(source_type: "external")
  end
end
