Run the SQL in `supabase/migrations/20260424_initial_schema.sql` inside the Supabase SQL Editor.

Supabase dashboard setup:

1. SQL Editor -> run `supabase/migrations/20260424_initial_schema.sql`.
2. Authentication -> Providers -> Email -> enable Email if you want password sign-in and OTP.
3. Authentication -> Providers -> Google -> enable Google.
4. Authentication -> URL Configuration:
5. Keep `Site URL` as your actual web app URL when testing on web.
6. Add `waterhyacinth://auth/callback` to Additional Redirect URLs for native builds.
7. Add your web callback URL too when testing in the browser, for example `http://localhost:8081/auth/callback` or whatever origin Expo web is running on.

Google Cloud setup:

1. In Google Cloud create a `Web application` OAuth client.
2. Add `https://vejazwelilonndcsreop.supabase.co` as an authorized JavaScript origin.
3. Add `https://vejazwelilonndcsreop.supabase.co/auth/v1/callback` as an authorized redirect URI.
4. Paste that Web client ID and client secret into the Supabase Google provider settings.
5. Use a development build or release build for native OAuth testing so the app can receive the `waterhyacinth://auth/callback` deep link reliably.

Mobile app configuration:

1. `app.json` must keep `scheme` set to `waterhyacinth`.
2. `expo.extra.supabaseUrl` and `expo.extra.supabasePublishableKey` must point to your project.
3. Add `expo.extra.modelApiUrl` when your inference API is ready. If left empty, the app uses the local fallback flow.
4. The model API should accept a `POST` multipart request with an `image` file field and a `source` text field.
5. The model API response should be JSON with `label`, `confidence`, `isPositive`, `recommendation`, and `modelVersion`.

Notes:

- The React Native app uses the publishable key, not the secret key.
- The secret key must stay server-side only.
- Google OAuth uses Supabase PKCE.
- On web, the OAuth callback route is `/auth/callback`.
- On native, the OAuth callback is `waterhyacinth://auth/callback`.
- Guest history is kept on-device.
- Signed-in history is cached on-device and synced to Supabase when available.
- Existing guest history is migrated into the user's account after sign-in.
