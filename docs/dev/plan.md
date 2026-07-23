 GET / 200 in 4.6s (next.js: 1026ms, application-code: 3.6s)
[browser] Image with src "/images/slide-mars9.png" has "fill" but is missing "sizes" prop. Please add it to improve page performance. Read more: https://nextjs.org/docs/api-reference/next/image#sizes
 GET /login 200 in 401ms (next.js: 195ms, application-code: 206ms)
 GET /register 200 in 417ms (next.js: 200ms, application-code: 217ms)
 POST /register 200 in 1536ms (next.js: 30ms, application-code: 1506ms)
  └─ ƒ registerAction(null, {}) in 1199ms features/auth/actions.ts


{
  "id": "357270f1-a82d-4196-8c29-89a4f7cae2d7",
  "email": "admin.kartjis@gmail.com",
  "banned_until": null,
  "created_at": "2026-07-21 15:00:52.400747+00",
  "confirmed_at": "2026-07-21 15:00:52.400747+00",
  "confirmation_sent_at": null,
  "is_anonymous": false,
  "is_sso_user": false,
  "invited_at": null,
  "last_sign_in_at": null,
  "phone": null,
  "raw_app_meta_data": {
    "provider": "email",
    "providers": [
      "email"
    ]
  },
  "raw_user_meta_data": {
    "name": "Admin Kartjis",
    "role": "SUPER_ADMIN"
  },
  "updated_at": "2026-07-21 15:00:52.400747+00",
  "providers": []
}

{
  "id": "832d4654-110b-472d-83aa-a59e09853c76",
  "email": "user.kartjis@gmail.com",
  "banned_until": null,
  "created_at": "2026-07-21 15:00:52.582471+00",
  "confirmed_at": "2026-07-21 15:00:52.582471+00",
  "confirmation_sent_at": null,
  "is_anonymous": false,
  "is_sso_user": false,
  "invited_at": null,
  "last_sign_in_at": null,
  "phone": null,
  "raw_app_meta_data": {
    "provider": "email",
    "providers": [
      "email"
    ]
  },
  "raw_user_meta_data": {
    "name": "User Kartjis",
    "role": "USER"
  },
  "updated_at": "2026-07-21 15:00:52.582471+00",
  "providers": []
}
Total: 4 users