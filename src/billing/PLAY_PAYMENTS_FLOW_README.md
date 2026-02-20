# Google Play Payments Flow

This flow has two parts:

1. **Grant Pro access at purchase time**
2. **Keep Pro access correct over time with Google notifications**

---

## 1) Purchase Verification (grant access)

When a user buys a subscription in the app:

- The app sends `purchaseToken` and `subscriptionId` to the Supabase Edge Function `play-verify-purchase`.
- `play-verify-purchase` calls the Google Android Publisher API using `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Google response is validated to confirm the subscription is:
  - active
  - paid
  - acknowledged
  - not expired
- If valid:
  - user metadata is updated to `is_pro=true`
  - token-to-user mapping is stored in `play_subscription_user`

This is what gives the user Pro access initially.

---

## 2) RTDN Updates (maintain access)

After purchase, subscription status can change (cancelled, expired, revoked, refunded, etc.).

- Google Play sends RTDN (Real-time Developer Notifications) events via Pub/Sub.
- Pub/Sub pushes those events to your `play-rtdn` endpoint.
- The endpoint is protected with `RTDN_SHARED_SECRET`.
- `play-rtdn` processes the event and checks `play_subscription_user` to find the related user.
- For cancel/revoke/expire/voided events, Pro access is removed.

This keeps entitlement accurate even when status changes happen outside the app.

---

## Required Configuration

- `GOOGLE_SERVICE_ACCOUNT_JSON` (for purchase verification API calls)
- `RTDN_SHARED_SECRET` (for securing RTDN endpoint)
- Pub/Sub topic permissions allowing:
  - `google-play-developer-notifications@system.gserviceaccount.com`

---

## Quick Summary

- **Source of truth at checkout:** `play-verify-purchase`
- **Source of truth after checkout:** `play-rtdn` notifications

Together, these ensure users get Pro access quickly and lose it when subscriptions are no longer valid.

---

## Diagram

![Google Play Billing Flow](../assets/playstore_billing_flow.png)
