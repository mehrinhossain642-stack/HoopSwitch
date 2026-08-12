require "test_helper"

# Exercises the §5 API surface end to end over real HTTP with real JWTs.
class ApiFlowTest < ActionDispatch::IntegrationTest
  # --- auth ---------------------------------------------------------------

  test "signup issues a JWT and provisions the role-appropriate record" do
    user, headers = register(role: "player")

    assert_match(/\ABearer /, headers["Authorization"])
    assert user.player_profile.present?, "player signup should create a profile"
    assert_nil user.team

    coach, = register(role: "coach")
    assert coach.team.present?, "coach signup should create a team"
    assert_nil coach.player_profile
  end

  test "login returns a usable token and logout revokes it" do
    headers = login(email: "marcus.webb@example.com")

    get "/profile", headers: headers
    assert_response :success
    assert_equal "Marcus Webb", json["name"]

    delete "/logout", headers: headers
    assert_response :success

    # jti rotated, so the old token no longer authenticates.
    get "/profile", headers: headers
    assert_response :unauthorized
  end

  test "protected endpoints reject unauthenticated requests" do
    get "/profile"
    assert_response :unauthorized

    get "/feed/postings"
    assert_response :unauthorized
  end

  test "rejects a bad password" do
    post "/login",
         params: { user: { email: "marcus.webb@example.com", password: "wrong" } },
         as: :json
    assert_response :unauthorized
  end

  # --- role separation ----------------------------------------------------

  test "a coach cannot read the player profile endpoint and vice versa" do
    coach_headers = login(email: "mike.bradley@westernmustangs.example.com")
    get "/profile", headers: coach_headers
    assert_response :forbidden

    player_headers = login(email: "marcus.webb@example.com")
    get "/team", headers: player_headers
    assert_response :forbidden
  end

  # --- player surface -----------------------------------------------------

  test "profile update re-scores the player feed" do
    headers = login(email: "marcus.webb@example.com")

    get "/feed/postings", headers: headers
    assert_response :success
    before = json["postings"]
    assert_equal 4, before.length
    assert_equal "Looking for a starting Point Guard", before.first["headline"]
    assert_equal 96, before.first["match"]["score"]
    assert_equal "good", before.first["match"]["tier"]

    # Feed must be sorted by descending score.
    scores = before.map { |p| p["match"]["score"] }
    assert_equal scores.sort.reverse, scores

    # Shrink him to 5'8" (173cm) — the same edit verified in the client.
    patch "/profile", params: { profile: { height_cm: 173 } }, headers: headers, as: :json
    assert_response :success
    assert_equal 173, json["height_cm"]

    get "/feed/postings", headers: headers
    after = json["postings"]
    assert_equal "Backup PG needed for rotation", after.first["headline"],
                 "top two postings should swap after the height edit"
    assert_equal 75, after.first["match"]["score"]
    assert_equal 71, after.second["match"]["score"]
    assert_equal "more height would help", after.first["match"]["reason"]
  end

  # --- onboarding ---------------------------------------------------------

  test "a new player starts un-onboarded and seeded players are onboarded" do
    _user, headers = register(role: "player")
    get "/profile", headers: headers
    assert_response :success
    refute json["onboarding_complete"], "a fresh signup should need onboarding"

    seeded = login(email: "marcus.webb@example.com")
    get "/profile", headers: seeded
    assert json["onboarding_complete"], "seeded players represent finished profiles"
  end

  test "onboarding fields save step by step and complete the flow" do
    _user, headers = register(role: "player")

    # Step 1 — basics. City/province drive the display `location`.
    patch "/profile",
          params: { profile: { name: "Sam Okafor", school: "Carleton University",
                               graduation_year: 2028, grade: "University Year 2",
                               city: "Ottawa", province: "ON" } },
          headers: headers, as: :json
    assert_response :success
    assert_equal "Ottawa", json["city"]
    assert_equal "Ottawa, ON", json["location"], "location should derive from city/province"

    # Step 2 — basketball info.
    patch "/profile",
          params: { profile: { position: "SG", secondary_position: "SF", height_cm: 193,
                               weight_kg: 86, wingspan_cm: 201, current_team: "Ottawa Elite" } },
          headers: headers, as: :json
    assert_response :success
    assert_equal "SF", json["secondary_position"]

    # Step 3 — goals.
    patch "/profile",
          params: { profile: { goals: %w[u_sports exposure],
                               short_term_goal: "Earn a starting spot" } },
          headers: headers, as: :json
    assert_response :success
    assert_equal %w[u_sports exposure], json["goals"]

    # Step 4 — a highlight link, then finish.
    post "/highlights",
         params: { highlight: { title: "Summer Elite Run",
                                url: "https://www.youtube.com/watch?v=abc123" } },
         headers: headers, as: :json
    assert_response :created

    post "/profile/complete_onboarding", headers: headers, as: :json
    assert_response :success
    assert json["onboarding_complete"]
    assert_equal 1, json["highlights"].length
  end

  test "onboarding rejects invalid selections" do
    _user, headers = register(role: "player")

    patch "/profile", params: { profile: { goals: %w[u_sports moon_landing] } },
          headers: headers, as: :json
    assert_response :unprocessable_entity
    assert json["errors"].any? { |e| e.match?(/moon_landing/) }

    patch "/profile", params: { profile: { province: "XX" } }, headers: headers, as: :json
    assert_response :unprocessable_entity

    patch "/profile", params: { profile: { grade: "Grade 47" } }, headers: headers, as: :json
    assert_response :unprocessable_entity

    # Secondary position must differ from primary.
    patch "/profile", params: { profile: { position: "PG", secondary_position: "PG" } },
          headers: headers, as: :json
    assert_response :unprocessable_entity
    assert json["errors"].any? { |e| e.match?(/differ/i) }
  end

  test "a coach has no onboarding profile endpoint" do
    coach_headers = login(email: "mike.bradley@westernmustangs.example.com")
    post "/profile/complete_onboarding", headers: coach_headers, as: :json
    assert_response :forbidden
  end

  test "profile update rejects out-of-range values" do
    headers = login(email: "marcus.webb@example.com")
    patch "/profile", params: { profile: { height_cm: 400 } }, headers: headers, as: :json

    assert_response :unprocessable_entity
    assert json["errors"].any? { |e| e.match?(/Height cm/i) }
  end

  test "highlights can be added and removed, uploads rejected" do
    headers = login(email: "marcus.webb@example.com")

    post "/highlights",
         params: { highlight: { title: "New clip", url: "https://youtube.com/watch?v=abc",
                                duration_seconds: 90 } },
         headers: headers, as: :json
    assert_response :created
    assert_equal "external", json["source_type"]
    highlight_id = json["id"]

    delete "/highlights/#{highlight_id}", headers: headers
    assert_response :no_content

    # Media hosting is explicitly out of scope for the MVP (§6).
    post "/highlights",
         params: { highlight: { title: "Upload", url: "s3://bucket/clip.mp4",
                                source_type: "uploaded" } },
         headers: headers, as: :json
    assert_response :unprocessable_entity
  end

  test "career stats can be appended" do
    headers = login(email: "marcus.webb@example.com")

    post "/career_stats",
         params: { career_stat: { season: "2025–26", team_name: "Western Mustangs",
                                  gp: 20, ppg: 21.0, rpg: 4.0, apg: 5.0 } },
         headers: headers, as: :json

    assert_response :created
    assert_equal "2025–26", json["season"]
  end

  # --- coach surface ------------------------------------------------------

  test "team endpoint embeds postings and open slot count" do
    headers = login(email: "mike.bradley@westernmustangs.example.com")

    get "/team", headers: headers
    assert_response :success
    assert_equal "Western Mustangs", json["name"]
    assert_equal "18–6", json["record"]
    assert_equal 3, json["postings"].length
    assert_equal 3, json["open_slots_count"]
  end

  test "coach feed scopes to the selected posting and ranks players" do
    headers = login(email: "mike.bradley@westernmustangs.example.com")

    # Default scoping: the team's first posting (starting PG).
    get "/feed/players", headers: headers
    assert_response :success
    assert_equal "PG", json["posting"]["position"]
    assert_equal "Marcus Webb", json["players"].first["name"]
    assert_equal 96, json["players"].first["match"]["score"]

    scores = json["players"].map { |p| p["match"]["score"] }
    assert_equal scores.sort.reverse, scores

    # Re-scope to the centre slot: a different player should lead.
    centre = Posting.find_by!(headline: "Rim-protecting Centre needed")
    get "/feed/players", params: { posting_id: centre.id }, headers: headers
    assert_response :success
    assert_equal "Andre Boucher", json["players"].first["name"]
    assert_equal 88, json["players"].first["match"]["score"]
    assert_equal "Tyrell Nkemdi", json["players"].second["name"]
    assert_equal "more height would help", json["players"].second["match"]["reason"]
  end

  test "posting CRUD is scoped to the coach's own team" do
    headers = login(email: "mike.bradley@westernmustangs.example.com")

    post "/postings",
         params: { posting: { position: "SF", ideal_height_cm: 198, ideal_weight_kg: 90,
                              expected_minutes: 20, headline: "Wing depth" } },
         headers: headers, as: :json
    assert_response :created
    posting_id = json["id"]

    patch "/postings/#{posting_id}",
          params: { posting: { expected_minutes: 30, status: "in_review" } },
          headers: headers, as: :json
    assert_response :success
    assert_equal 30, json["expected_minutes"]
    assert_equal "in_review", json["status"]

    # Another coach must not be able to touch it.
    other = login(email: "dana.whitfield@carletonravens.example.com")
    patch "/postings/#{posting_id}", params: { posting: { status: "closed" } },
          headers: other, as: :json
    assert_response :not_found

    delete "/postings/#{posting_id}", headers: headers
    assert_response :no_content
  end

  test "editing a slot re-scores the coach feed" do
    headers = login(email: "mike.bradley@westernmustangs.example.com")
    centre = Posting.find_by!(headline: "Rim-protecting Centre needed")

    # Drop the height requirement to 203cm — Tyrell now meets it outright.
    patch "/postings/#{centre.id}", params: { posting: { ideal_height_cm: 203 } },
          headers: headers, as: :json
    assert_response :success

    get "/feed/players", params: { posting_id: centre.id }, headers: headers
    tyrell = json["players"].find { |p| p["name"] == "Tyrell Nkemdi" }
    assert_equal 1.0, tyrell["match"]["breakdown"]["height"]
  end

  # --- connections --------------------------------------------------------

  test "a player applies and the coach accepts" do
    player_headers = login(email: "deshawn.price@example.com")
    slot = Posting.find_by!(headline: "Wing scorer with size wanted")

    post "/connections", params: { connection: { posting_id: slot.id } },
         headers: player_headers, as: :json
    assert_response :created
    assert_equal "player", json["initiated_by"]
    assert_equal "pending", json["status"]
    connection_id = json["id"]

    # Duplicate application is rejected by the unique index + validation.
    post "/connections", params: { connection: { posting_id: slot.id } },
         headers: player_headers, as: :json
    assert_response :unprocessable_entity

    # The player can't accept their own application.
    patch "/connections/#{connection_id}", params: { connection: { status: "accepted" } },
          headers: player_headers, as: :json
    assert_response :forbidden

    coach_headers = login(email: "mike.bradley@westernmustangs.example.com")
    patch "/connections/#{connection_id}", params: { connection: { status: "accepted" } },
          headers: coach_headers, as: :json
    assert_response :success
    assert_equal "accepted", json["status"]
  end

  test "a coach invites and the player declines" do
    coach_headers = login(email: "mike.bradley@westernmustangs.example.com")
    slot = Posting.find_by!(headline: "Rim-protecting Centre needed")
    andre = PlayerProfile.find_by!(name: "Andre Boucher")

    post "/connections",
         params: { connection: { posting_id: slot.id, player_profile_id: andre.id } },
         headers: coach_headers, as: :json
    assert_response :created
    assert_equal "coach", json["initiated_by"]
    connection_id = json["id"]

    player_headers = login(email: "andre.boucher@example.com")
    patch "/connections/#{connection_id}", params: { connection: { status: "declined" } },
          headers: player_headers, as: :json
    assert_response :success
    assert_equal "declined", json["status"]
  end

  test "feed marks postings the player is already connected to" do
    headers = login(email: "marcus.webb@example.com")

    get "/feed/postings", headers: headers
    starting_pg = json["postings"].find { |p| p["headline"] == "Looking for a starting Point Guard" }
    # Seeded: the Mustangs invited Marcus to this slot.
    assert starting_pg["connected"], "seeded connection should be reflected in the feed"
  end

  test "applicant_count is derived from connections" do
    headers = login(email: "mike.bradley@westernmustangs.example.com")
    get "/team", headers: headers

    starting_pg = json["postings"].find { |p| p["headline"] == "Looking for a starting Point Guard" }
    assert_equal 1, starting_pg["applicant_count"]
  end
end
