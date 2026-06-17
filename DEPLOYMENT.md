# Deployment Guide: Simplified Inventory & Order Management System

This guide outlines how to deploy the application both locally and to production environments.

## Local Deployment (Docker)

1.  **Clone the repository.**
2.  **Create a `.env` file:**
    ```bash
    cp .env.example .env
    ```
3.  **Run the application:**
    ```bash
    docker-compose up --build
    ```
4.  **Access the applications:**
    - Frontend: [http://localhost:5173](http://localhost:5173)
    - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Production Deployment (Free Tiers)

### 1. Database (PostgreSQL)
- **Service:** [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
- **Steps:**
  - Create a new project.
  - Get the Connection String (DATABASE_URL).
  - Ensure the URL starts with `postgresql://` (SQLAlchemy 2.0+).

### 2. Backend (FastAPI)
- **Service:** [Render](https://render.com/) or [Railway](https://railway.app/).
- **Steps:**
  - Connect your GitHub repository.
  - Set the Build Command: `pip install -r backend/requirements.txt`
  - Set the Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
  - **Environment Variables:**
    - `DATABASE_URL`: Your production DB string.

### 3. Frontend (React)
- **Service:** [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
- **Steps:**
  - Connect your GitHub repository.
  - Set the Root Directory to `frontend`.
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - **Environment Variables:**
    - `VITE_API_URL`: Your production Backend URL (e.g., `https://your-api.onrender.com`).

---

## Docker Hub Deployment

To push your images to Docker Hub:

1.  **Login to Docker Hub:**
    ```bash
    docker login
    ```
2.  **Build and Tag Images:**
    ```bash
    docker build -t your-username/inventory-backend:latest ./backend
    docker build -t your-username/inventory-frontend:latest ./frontend
    ```
3.  **Push Images:**
    ```bash
    docker push your-username/inventory-backend:latest
    docker push your-username/inventory-frontend:latest
    ```

## Business Rules Verification
- **Unique Constraints:** Attempting to create a product with an existing SKU or a customer with an existing email will return a `400 Bad Request`.
- **Inventory Validation:** If an order quantity exceeds `stock_quantity`, the API returns an error and the database transaction is rolled back.
- **Atomic Deduction:** Successful orders automatically decrement the product's stock in the same transaction.
