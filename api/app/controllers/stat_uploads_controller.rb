# Bulk stat import from a coach's statsheet (proposal §5 addition).
#
# Two endpoints over one resolver so the preview a coach confirms is computed the
# same way as the write:
#
#   POST /stat_uploads/preview  -> resolve rows, report per-row outcome, write nothing
#   POST /stat_uploads          -> resolve again and apply the matched rows
#
# The preview is not optional in the UI. These writes replace figures the player
# reported themselves, and those figures drive every other team's ranking, so a
# coach confirming a specific list of names is the only thing standing between a
# mis-keyed column and silently re-scoring the marketplace.
class StatUploadsController < ApplicationController
  before_action :require_coach!

  def preview
    render json: payload(build_import)
  end

  def create
    import = build_import

    if import.matched.empty?
      return render_error(
        "Nothing in this sheet matched a player, so nothing was saved",
        status: :unprocessable_entity
      )
    end

    applied = import.commit!
    render json: payload(import).merge(applied: applied), status: :ok
  end

  private

  def build_import
    StatSheetImport.new(rows: rows_param, team: current_team)
  end

  def payload(import)
    { summary: import.summary, rows: import.results.map(&:as_json) }
  end

  # Rows arrive already split into columns — parsing the paste/CSV happens in the
  # client, where the coach can see and correct the column mapping before sending.
  def rows_param
    params.require(:rows)
  end
end
