# intermediate_submission_2

## Push Notification Setup & Testing

- This project uses the Dicoding Story API for web push notifications.
- VAPID public key is set in `src/scripts/config.js` as `VAPID_PUBLIC_KEY`.
- The app calls `POST /notifications/subscribe` and `DELETE /notifications/subscribe` on the API with `Authorization: Bearer <token>`.

To test push notifications locally:

1. Run the preview server:

```powershell
npm run preview
```

2. Open `http://localhost:4173/intermediate_submission_2/` in Chrome/Edge.
3. Login to the app so the Authorization token is available.
4. Enable the push toggle (id `pushToggle`) — grant notification permission when prompted.
5. The client will subscribe and POST the subscription to the Dicoding API. If the API returns an error, the app will show a friendly alert with the server message.

Notes:
- Manifest icon/screenshot sizes were adjusted to match files in `public/images` to remove DevTools warnings.
- If you need demo push messages and the Dicoding API doesn't send them, consider requesting the instructor/test server or run a local push sender that targets the subscription endpoint.

