require "test_helper"

class Admin::TeamsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = login(email: "admin@hoopswitch.example.com")
    @coach = login(email: "mike.bradley@westernmustangs.example.com")
  end

  test "only admins may administer teams" do
    get "/admin/teams", headers: @coach, as: :json
    assert_response :forbidden

    post "/admin/teams", params: { team: { name: "Nope" } }, headers: @coach, as: :json
    assert_response :forbidden
  end

  test "admin creates a team with no coach attached" do
    assert_difference -> { Team.count }, 1 do
      post "/admin/teams",
           params: { team: { name: "Brock Badgers", league: "U SPORTS · OUA",
                             location: "St. Catharines, ON", roster_size: 14 } },
           headers: @admin, as: :json
    end

    assert_response :created
    assert_equal "Brock Badgers", json["team"]["name"]
    assert_equal false, json["team"]["coach_assigned"]
    assert_nil json["team"]["coach_email"]
  end

  test "admin assigns a coach to a team by email" do
    post "/admin/teams", params: { team: { name: "Guelph Gryphons" } },
                         headers: @admin, as: :json
    team_id = json["team"]["id"]

    # A coach account with no team of its own.
    email = "unassigned-#{SecureRandom.hex(3)}@example.com"
    post "/signup", params: { user: { email: email, password: "password123",
                                      password_confirmation: "password123", role: "coach" } },
                    as: :json
    # /signup seeds a team for a coach, so detach it first to model a fresh hire.
    User.find_by!(email: email).team.update!(user: nil)

    post "/admin/teams/#{team_id}/assign_coach", params: { email: email },
                                                 headers: @admin, as: :json

    assert_response :success
    assert_equal email, json["team"]["coach_email"]
    assert_equal true, json["team"]["coach_assigned"]
  end

  test "assigning a non-coach account is refused" do
    post "/admin/teams", params: { team: { name: "Ryerson Rams" } }, headers: @admin, as: :json
    team_id = json["team"]["id"]

    post "/admin/teams/#{team_id}/assign_coach",
         params: { email: "marcus.webb@example.com" }, headers: @admin, as: :json

    assert_response :unprocessable_entity
    assert_match(/not a coach/, json["errors"].join)
  end

  test "a coach already running another team is refused rather than silently moved" do
    post "/admin/teams", params: { team: { name: "York Lions" } }, headers: @admin, as: :json
    team_id = json["team"]["id"]

    post "/admin/teams/#{team_id}/assign_coach",
         params: { email: "mike.bradley@westernmustangs.example.com" },
         headers: @admin, as: :json

    assert_response :unprocessable_entity
    assert_match(/already coaches/, json["errors"].join)
  end

  test "unassigning leaves the team in place" do
    team = Team.find_by!(name: "Western Mustangs")

    delete "/admin/teams/#{team.id}/assign_coach", headers: @admin, as: :json

    assert_response :success
    assert_equal false, json["team"]["coach_assigned"]
    assert Team.exists?(team.id), "unassigning must not delete the team"
  ensure
    team.update!(user: User.find_by!(email: "mike.bradley@westernmustangs.example.com"))
  end

  test "index lists coaches available for assignment" do
    get "/admin/teams", headers: @admin, as: :json

    assert_response :success
    assert json.key?("unassigned_coaches")
    assert json["teams"].any?
  end

  test "admin accounts cannot be created through signup" do
    post "/signup",
         params: { user: { email: "sneaky@example.com", password: "password123",
                           password_confirmation: "password123", role: "admin" } },
         as: :json

    assert_response :forbidden
    assert_nil User.find_by(email: "sneaky@example.com")
  end
end
