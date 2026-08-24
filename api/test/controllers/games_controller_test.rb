require "test_helper"

class GamesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @coach = login(email: "mike.bradley@westernmustangs.example.com")
    @admin = login(email: "admin@hoopswitch.example.com")
    @player_headers = login(email: "marcus.webb@example.com")
    @team = Team.find_by!(name: "Western Mustangs")
  end

  def box_score(**overrides)
    {
      played_on: "2026-02-14",
      opponent: "Queen's Gaels",
      rows: [ { identifier: "marcus.webb@example.com", pts: "18", reb: "5", ast: "6",
                fgm: "7", fga: "15", tpm: "2", tpa: "5", ftm: "2", fta: "2", minutes: "31" } ]
    }.merge(overrides)
  end

  # --- authorization ------------------------------------------------------

  test "players cannot upload box scores" do
    post "/games", params: box_score, headers: @player_headers, as: :json
    assert_response :forbidden
  end

  test "coaches cannot approve their own upload" do
    post "/games", params: box_score, headers: @coach, as: :json
    assert_response :created
    id = json["game"]["id"]

    patch "/games/#{id}", params: { game: { status: "approved" } }, headers: @coach, as: :json
    assert_response :forbidden
  end

  test "unauthenticated requests are rejected" do
    post "/games", params: box_score, as: :json
    assert_response :unauthorized
  end

  # --- the approval gate -------------------------------------------------

  test "a coach's upload lands pending and moves nobody's averages" do
    player = PlayerProfile.joins(:user).find_by!(users: { email: "marcus.webb@example.com" })
    before = player.ppg.to_f

    post "/games", params: box_score, headers: @coach, as: :json
    assert_response :created
    assert_equal "pending", json["game"]["status"]

    assert_equal before, player.reload.ppg.to_f,
                 "a pending upload must not change a player's averages"
  end

  test "an admin's own upload lands approved and applies immediately" do
    player = PlayerProfile.joins(:user).find_by!(users: { email: "marcus.webb@example.com" })
    before = player.reload.ppg.to_f

    post "/games",
         params: box_score(team_id: @team.id, played_on: "2026-03-01",
                           rows: [ { identifier: "marcus.webb@example.com", pts: "0", reb: "0",
                                     ast: "0", fgm: "0", fga: "9" } ]),
         headers: @admin, as: :json

    assert_response :created
    assert_equal "approved", json["game"]["status"]
    assert_not_equal before, player.reload.ppg.to_f, "an admin upload should apply at once"
  end

  test "an admin approving a coach's upload folds it into the averages" do
    player = PlayerProfile.joins(:user).find_by!(users: { email: "marcus.webb@example.com" })

    post "/games", params: box_score(played_on: "2026-04-04"), headers: @coach, as: :json
    id = json["game"]["id"]
    before = player.reload.ppg.to_f

    patch "/games/#{id}", params: { game: { status: "approved" } }, headers: @admin, as: :json
    assert_response :success
    assert_equal "approved", json["game"]["status"]

    assert_not_equal before, player.reload.ppg.to_f
    assert_equal 1, Game.find(id).game_stats.count
  end

  test "rejecting records the reviewer and leaves averages alone" do
    post "/games", params: box_score(played_on: "2026-04-11"), headers: @coach, as: :json
    id = json["game"]["id"]
    player = PlayerProfile.joins(:user).find_by!(users: { email: "marcus.webb@example.com" })
    before = player.reload.ppg.to_f

    patch "/games/#{id}",
          params: { game: { status: "rejected", review_note: "Wrong opponent" } },
          headers: @admin, as: :json

    assert_response :success
    assert_equal "rejected", json["game"]["status"]
    assert_equal "Wrong opponent", json["game"]["review_note"]
    assert_equal before, player.reload.ppg.to_f
  end

  test "a decision other than approved or rejected is refused" do
    post "/games", params: box_score(played_on: "2026-04-18"), headers: @coach, as: :json
    id = json["game"]["id"]

    patch "/games/#{id}", params: { game: { status: "pending" } }, headers: @admin, as: :json
    assert_response :bad_request
  end

  # --- validation ---------------------------------------------------------

  test "a game needs a date and an opponent" do
    post "/games", params: { rows: box_score[:rows] }, headers: @coach, as: :json
    assert_response :unprocessable_entity
    assert_match(/date/i, json["errors"].join)
  end

  test "makes exceeding attempts is caught in the preview" do
    post "/games/preview",
         params: box_score(rows: [ { identifier: "marcus.webb@example.com", pts: "20",
                                     fgm: "12", fga: "4" } ]),
         headers: @coach, as: :json

    assert_response :success
    assert_equal "invalid", json["rows"].first["status"]
    assert_match(/can't exceed/, json["rows"].first["message"])
  end

  test "preview writes nothing and reports where the upload would land" do
    assert_no_difference -> { Game.count } do
      post "/games/preview", params: box_score, headers: @coach, as: :json
    end

    assert_response :success
    assert_equal "pending", json["lands_as"]
    assert_equal 1, json["summary"]["matched"]
  end

  test "a box score where nothing matched is refused" do
    post "/games",
         params: box_score(rows: [ { identifier: "nobody@nowhere.test", pts: "10" } ]),
         headers: @coach, as: :json

    assert_response :unprocessable_entity
  end

  # --- listing ------------------------------------------------------------

  test "a coach sees only their own team's games" do
    get "/games", headers: @coach
    assert_response :success

    team_ids = json["games"].map { |g| g["team_id"] }.uniq
    assert_equal [ @team.id ], team_ids
  end

  test "an admin can filter to the pending review queue" do
    # Query string, not `as: :json` params: on a GET the JSON encoder puts them in
    # a request body, which isn't how any client filters a collection.
    get "/games?status=pending", headers: @admin
    assert_response :success
    assert json["games"].any?, "the seed leaves one game awaiting review"
    assert_equal [ "pending" ], json["games"].map { |g| g["status"] }.uniq
  end
end
