class ParentProfilesController < ApplicationController
  before_action :require_parent!

  def show
    render json: parent_payload(current_user)
  end

  def update
    current_user.update!(parent_profile_params)
    render json: parent_payload(current_user)
  end

  private

  def parent_profile_params
    params.require(:user).permit(
      :name,
      :avatar_url
    )
  end

  def parent_payload(user)
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar_url: user.avatar_url
    }
  end
end