Rails.application.routes.draw do
  get   "parent/profile", to: "parent_profiles#show"
patch "parent/profile", to: "parent_profiles#update"
  # Health check for load balancers / uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  # --- Auth (proposal §5) ------------------------------------------------
  # POST /signup, POST /login -> JWT in the Authorization header
  # DELETE /logout -> rotates the user's jti
  #
  # `skip: :all` then an explicit devise_scope: the default devise_for would also
  # generate HTML-oriented routes this API has no use for (GET /login,
  # GET /signup/edit) plus a DELETE /signup account-deletion path nobody asked
  # for. Declaring the three endpoints by hand keeps the surface exactly §5.
  devise_for :users, skip: :all
  devise_scope :user do
    post   "signup" => "auth/registrations#create"
    post   "login"  => "auth/sessions#create"
    delete "logout" => "auth/sessions#destroy"
  end

  # --- Player ------------------------------------------------------------
  resource :profile, only: %i[show update], controller: "profiles" do
    post :complete_onboarding, on: :collection
  end
  resources :highlights, only: %i[create destroy]
  resources :career_stats, only: %i[create]

  # --- Coach -------------------------------------------------------------
  resource :team, only: %i[show update], controller: "teams"
  resources :postings, only: %i[create update destroy]

  # Game box scores. `preview` resolves rows and writes nothing; create persists
  # the game (pending when a coach uploads it); update is an admin's decision.
  resources :games, only: %i[index create update] do
    post :preview, on: :collection
  end

  # --- Admin -------------------------------------------------------------
  namespace :admin do
    resources :teams, only: %i[index create update] do
      post   :assign_coach, on: :member
      delete :assign_coach, on: :member, action: :unassign_coach
    end
  end

  # --- Feeds (both scored) -----------------------------------------------
  get "feed/postings", to: "feeds#postings"
  get "feed/players",  to: "feeds#players"

# --- Parent ------------------------------------------------------------
get   "parent/athletes/:id/profile", to: "parent_athletes#profile"
patch "parent/athletes/:id/profile", to: "parent_athletes#update_profile"
get  "parent/athletes",                     to: "parent_athletes#index"
post "parent/athletes/link",                to: "parent_athletes#link"
get  "parent/athletes/:id/opportunities",   to: "parent_athletes#opportunities"

  # --- Connections (apply / invite, accept / decline) --------------------
  resources :connections, only: %i[index create update]
end