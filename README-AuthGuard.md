# Frontend Auth Guard

Implements centralized JWT-based route protection using a `ProtectedRoute` component and token helpers in `src/utils/auth.js`.

## Install

Run in `forntend` directory:

```
npm install jwt-decode
```

## Files

- `src/utils/auth.js`: token retrieval (localStorage/cookies), expiry check, logout, placeholders for refresh.
- `src/components/ProtectedRoute.jsx`: wrapper that blocks rendering and redirects to `'/sign-in'` when the token is missing or expired.
- `src/App.js`: protected pages wrapped with `ProtectedRoute`.

## Usage

Wrap any protected route element:

```jsx
import ProtectedRoute from "./components/ProtectedRoute";

<Route path="/orders" element={<ProtectedRoute><OrdersListPage/></ProtectedRoute>} />
```

Token is read from `localStorage` key `authToken` by default. To customize:

```jsx
<ProtectedRoute tokenKey="myAccessToken" loginPath="/login">
  <OrdersListPage/>
</ProtectedRoute>
```

## Helpers

- `getToken(key)`: read from `localStorage` then cookies.
- `isTokenExpired(token)`: checks `exp` claim via `jwt-decode`.
- `isAuthenticated(key)`: convenience boolean.
- `logout(navigate, key, loginPath)`: clears token and redirects.
- `refreshToken()`: stub to integrate with your backend.

## Notes

- Prevents route flicker by checking before rendering.
- Redirect state includes `{ from }` so you can return after login.
- If you want soft gating within a page, prefer a custom hook.

