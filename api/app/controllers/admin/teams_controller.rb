module Admin
  # Team administration: create a team, then attach a coach to it.
  #
  #   GET   /admin/teams              every team, with its coach if assigned
  #   POST  /admin/teams              create a team (no coach yet)
  #   PATCH /admin/teams/:id          edit team details
  #   POST  /admin/teams/:id/assign_coach   attach a coach account by email
  #   DELETE /admin/teams/:id/assign_coach  detach the coach, leaving the team
  class TeamsController < ApplicationController
    before_action :require_admin!

    def index
      render json: {
        teams: Team.includes(:user, :postings).order(:name).map { |team| serialize(team) },
        # Coaches with no team yet, so the UI can offer them for assignment
        # instead of making an admin remember who's unassigned.
        unassigned_coaches: User.where(role: "coach").where.missing(:team).map do |user|
          { id: user.id, email: user.email }
        end
      }
    end

    def create
      team = Team.create!(team_params)
      render json: { team: serialize(team) }, status: :created
    end

    def update
      team = Team.find(params[:id])
      team.update!(team_params)
      render json: { team: serialize(team) }
    end

    def assign_coach
      team = Team.find(params[:id])
      coach = User.find_by!(email: params.require(:email).to_s.strip.downcase)

      unless coach.coach?
        return render_error("#{coach.email} is a #{coach.role} account, not a coach",
                            status: :unprocessable_entity)
      end

      # One team per coach is enforced by a unique index; saying so is friendlier
      # than surfacing the constraint violation.
      if coach.team.present? && coach.team.id != team.id
        return render_error("#{coach.email} already coaches #{coach.team.name}",
                            status: :unprocessable_entity)
      end

      team.update!(user: coach)
      render json: { team: serialize(team) }
    end

    def unassign_coach
      team = Team.find(params[:id])
      team.update!(user: nil)
      render json: { team: serialize(team) }
    end

    private

    def require_admin!
      render_error("Admin account required", status: :forbidden) unless current_user.admin?
    end

    def team_params
      params.require(:team).permit(
        :name, :league, :location, :wins, :losses, :roster_size, :coach_name, :about
      )
    end

    def serialize(team)
      TeamSerializer.call(team).merge(
        coach_email: team.user&.email,
        coach_assigned: team.coach_assigned?,
        pending_games: team.games.pending.count
      )
    end
  end
end
