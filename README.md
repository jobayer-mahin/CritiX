# 🎬 Critix

> **Subtle Thoughts on Cinema**
> A full-stack movie review and discussion platform built with **React, Node.js, Express, and MySQL**.

Originally created as a static HTML/CSS/JavaScript project, **Critix** has been transformed into a modern full-stack web application with authentication, reviews, watchlists, and community discussions.

---

## 📸 Features

### 🎥 Movies & TV Shows

* Browse movies and TV series
* Search with filters and sorting
* Featured hero carousel
* Trending and top-rated sections
* Detailed movie pages with backdrop and poster

### ⭐ Reviews

* Create and edit reviews
* 1–5 star ratings
* Mood selection
* Spoiler protection
* Public/private visibility
* Like system

### 💬 Community Discussions

* Create discussion posts
* Tag system (up to 5 tags)
* Like discussions
* View counter
* Delete own posts

### 👤 User Features

* JWT authentication
* Profile page
* Personal watchlist
* Review history
* Redirect-back login flow

### ✨ UI Improvements

* Skeleton loading animations
* Toast notifications
* Responsive navbar
* Error boundaries
* Protected routes

---

# 🏗️ Tech Stack

## Frontend

* React 18
* Vite
* React Router
* Axios
* Context API

## Backend

* Node.js
* Express.js
* MySQL2
* JWT Authentication

## Database

* MySQL 8

---

# 📁 Project Structure

```text
critix/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       └── pages/
│
└── backend/
    ├── db/
    ├── middleware/
    ├── routes/
    └── server.js
```

---

# 🚀 Getting Started

## Prerequisites

* Node.js 18+
* npm 9+
* MySQL 8+

---

## 1. Setup Database

Run the schema file to create tables and insert seed data:

```bash
mysql -u root -p < backend/db/schema.sql
```

---

## 2. Start Backend

```bash
cd backend

npm install

cp .env.example .env
```

Update your `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=critix
JWT_SECRET=your_secret_key
```

Start the server:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

## 3. Start Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

Vite automatically proxies `/api/*` requests to the backend.

---

# 🔐 Demo Accounts

Password for all accounts:

```text
password123
```

| Username        | Email                                             |
| --------------- | ------------------------------------------------- |
| jobayer_mahin   | [jobayer@example.com](mailto:jobayer@example.com) |
| cinephile_sarah | [sarah@example.com](mailto:sarah@example.com)     |
| movie_buff_mike | [mike@example.com](mailto:mike@example.com)       |
| alex_reviews    | [alex@example.com](mailto:alex@example.com)       |
| emma_watches    | [emma@example.com](mailto:emma@example.com)       |

---

# 🔌 API Endpoints

## Authentication

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |
| GET    | `/api/auth/me`       |
| PATCH  | `/api/auth/me`       |

---

## Movies

| Method | Endpoint                     |
| ------ | ---------------------------- |
| GET    | `/api/movies`                |
| GET    | `/api/movies/featured`       |
| GET    | `/api/movies/:id`            |
| POST   | `/api/movies`                |
| POST   | `/api/movies/:id/watchlist`  |
| DELETE | `/api/movies/:id/watchlist`  |
| GET    | `/api/movies/user/watchlist` |

---

## Reviews

| Method | Endpoint                |
| ------ | ----------------------- |
| GET    | `/api/reviews`          |
| GET    | `/api/reviews/:id`      |
| POST   | `/api/reviews`          |
| PUT    | `/api/reviews/:id`      |
| DELETE | `/api/reviews/:id`      |
| POST   | `/api/reviews/:id/like` |

---

## Discussions

| Method | Endpoint                    |
| ------ | --------------------------- |
| GET    | `/api/discussions`          |
| GET    | `/api/discussions/:id`      |
| POST   | `/api/discussions`          |
| POST   | `/api/discussions/:id/like` |
| DELETE | `/api/discussions/:id`      |

---

# 🗄️ Database Tables

```text
users
movies
reviews
review_likes
watchlist
discussions
```

---

# 🎨 Pages

| Route         | Description     |
| ------------- | --------------- |
| `/`           | Home            |
| `/movies`     | Browse Movies   |
| `/tv`         | Browse TV Shows |
| `/movies/:id` | Movie Detail    |
| `/community`  | Community       |
| `/add-review` | Add Review      |
| `/profile`    | User Profile    |
| `/search`     | Search          |
| `/login`      | Login           |
| `/register`   | Register        |
| `*`           | 404 Page        |

---

# 🛡️ Key Implementations

### Authentication

* JWT stored in localStorage
* Axios interceptor
* Session restoration
* Redirect-back login flow

### Error Handling

* ErrorBoundary component
* Axios 401 handling
* Toast notifications

### Skeleton Loading

* HeroSkeleton
* MovieCardSkeleton
* ReviewCardSkeleton
* MovieDetailSkeleton

### Discussions

* Create, Like and Delete
* Server-side view counter
* Tag system

---

# 🚧 Future Improvements

* HTTP-only cookies
* Rate limiting
* Input validation
* Helmet security headers
* Pagination
* Cloudinary image uploads
* Redis caching
* Production deployment

---


Built using:

* React
* Node.js
* Express
* MySQL

---

## ⭐ If you like this project, consider giving it a star!
