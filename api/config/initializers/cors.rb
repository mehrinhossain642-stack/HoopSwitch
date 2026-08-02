# Be sure to restart your server when you modify this file.
#
# The Expo client calls this API cross-origin from the web target and from a LAN
# IP on device, so CORS has to be permissive in development. The Authorization
# header must be exposed for the client to read the issued JWT off /signup and
# /login responses.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins do |source, _env|
      if Rails.env.development? || Rails.env.test?
        true
      else
        ENV.fetch("ALLOWED_ORIGINS", "").split(",").map(&:strip).include?(source)
      end
    end

    resource "*",
             headers: :any,
             expose: [ "Authorization" ],
             methods: %i[get post put patch delete options head]
  end
end
