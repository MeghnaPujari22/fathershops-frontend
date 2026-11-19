# FatherShops frontend

Next.js storefront for the FatherShops Laravel catalog API. It displays categories and products, supports searching within a category, and loads full 
product details on selection.

## Run locally

1. Start the Laravel API from `fathershops-backend`:

   ```powershell
   php artisan serve
   ```

2. In `fathershops-frontend`, create `.env.local` from `.env.example` if the backend is not at `http://127.0.0.1:8000/api`.
3. Install and start the frontend:

   ```powershell
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Next.js proxies catalog
requests to Laravel, so browser CORS configuration is not needed.

## Laravel endpoints used

- `GET /api/categories`
- `GET /api/categories/{categoryId}/products`
- `GET /api/products/{productId}`
# fathershops-frontend
# fathershops-frontend
# fathershops-frontend
