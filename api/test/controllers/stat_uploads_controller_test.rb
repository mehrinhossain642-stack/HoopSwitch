require "test_helper"

class StatUploadsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @coach = login(email: "mike.bradley@westernmustangs.example.com")
    @player_email = "marcus.webb@example.com"
  end

  def rows(*entries)
    { rows: entries }
  end

  test "preview resolves rows without writing anything" do
    before = PlayerProfile.joins(:user).find_by!(users: { email: @player_email }).ppg.to_f

    post "/stat_uploads/preview",
         params: rows({ identifier: @player_email, ppg: "27.3" }),
         headers: @coach, as: :json

    assert_response :success
    assert_equal 1, json["summary"]["matched"]
    assert_equal "matched", json["rows"].first["status"]
    assert_equal "Marcus Webb", json["rows"].first["player_name"]

    reloaded = PlayerProfile.joins(:user).find_by!(users: { email: @player_email }).ppg.to_f
    assert_equal before, reloaded, "preview must not persist"
  end

  test "create applies the matched rows" do
    post "/stat_uploads",
         params: rows({ identifier: @player_email, ppg: "22.1", apg: "6.4" }),
         headers: @coach, as: :json

    assert_response :success
    assert_equal 1, json["applied"]

    player = PlayerProfile.joins(:user).find_by!(users: { email: @player_email })
    assert_equal 22.1, player.ppg.to_f
    assert_equal 6.4, player.apg.to_f
  end

  test "create refuses a sheet where nothing matched" do
    post "/stat_uploads",
         params: rows({ identifier: "nobody@nowhere.test", ppg: "10" }),
         headers: @coach, as: :json

    assert_response :unprocessable_entity
    assert_match(/nothing was saved/, json["errors"].first)
  end

  test "players cannot upload statsheets" do
    player = login(email: @player_email)

    post "/stat_uploads", params: rows({ identifier: @player_email, ppg: "50" }),
                          headers: player, as: :json

    assert_response :forbidden
  end

  test "requires authentication" do
    post "/stat_uploads", params: rows({ identifier: @player_email, ppg: "50" }), as: :json
    assert_response :unauthorized
  end

  test "missing rows is a bad request rather than a 500" do
    post "/stat_uploads", params: {}, headers: @coach, as: :json
    assert_response :bad_request
  end
end
