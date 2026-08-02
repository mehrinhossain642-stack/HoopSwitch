ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Parallel workers each get their own database, so seeds are loaded per
    # worker after the schema is in place.
    parallelize(workers: :number_of_processors)

    parallelize_setup do
      HoopSwitchSeeds.load!
    end

    fixtures :all

    # --- JWT auth helpers ---------------------------------------------------

    # Signs up a fresh account and returns [user, auth_headers]. Uses the real
    # /signup endpoint so the token is issued by devise-jwt exactly as in
    # production, rather than hand-forged.
    def register(role:, email: nil, password: "password123")
      email ||= "#{role}-#{SecureRandom.hex(4)}@example.com"
      post "/signup",
           params: { user: { email: email, password: password,
                             password_confirmation: password, role: role } },
           as: :json

      raise "signup failed: #{response.status} #{response.body}" unless response.status == 201

      [ User.find_by!(email: email), { "Authorization" => response.headers["Authorization"] } ]
    end

    # Logs in an existing (seeded) account and returns its auth headers.
    def login(email:, password: "password123")
      post "/login", params: { user: { email: email, password: password } }, as: :json
      raise "login failed: #{response.status} #{response.body}" unless response.status == 200

      { "Authorization" => response.headers["Authorization"] }
    end

    def json
      # Fully qualified: inside `module ActiveSupport`, a bare `JSON` would
      # resolve to ActiveSupport::JSON, which has no #parse.
      ::JSON.parse(response.body)
    end
  end
end

# Loads db/seeds.rb into the current database, quietly and only once per process.
module HoopSwitchSeeds
  def self.load!
    return if @loaded
    return if PlayerProfile.exists?

    silence_stream($stdout) { Rails.application.load_seed }
    @loaded = true
  end

  def self.silence_stream(stream)
    original = stream.dup
    stream.reopen(File::NULL)
    stream.sync = true
    yield
  ensure
    stream.reopen(original)
    original.close
  end
end

# Non-parallel runs (and the primary worker) still need seeds.
HoopSwitchSeeds.load!
