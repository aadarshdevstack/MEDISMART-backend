# MEDISMART Backend

A scalable backend API for MEDISMART, a hyperlocal medicine delivery platform supporting consumers, sellers, and admins with role-based access and order management.


## Tech Stack

Backend Framework:

- Node.js
- Express.js

Database:

- MongoDB
- Mongoose

Authentication & Security:

- JSON Web Tokens (JWT)
- bcrypt

Middleware & Utilities:

- CORS
- cookie-parser
- dotenv

File Handling & Media:

- Multer
- Cloudinary

Additional Tools:

- mongoose-aggregate-paginate-v2 (Pagination)

Development Tools:

- Nodemon
- Prettier

## Features

- User authentication (JWT-based login & registration)
- Role-based access control (Consumer, Seller, Admin)
- Medicine management (CRUD operations)
- Order placement & management system
- Inventory tracking for sellers
- Prescription image upload (Multer + Cloudinary)
- Secure password hashing (bcrypt)
- RESTful API architecture


## Folder Structure

```
medismart-backend/
├── public/
│   └── temp/
│       └── .gitkeep
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   ├── constants.js
│   └── index.js
├── .env
├── .gitignore
├── .prettierrc
├── .prettierignore
├── README.md
└── package.json
```
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file
```
PORT=8000

MONGODB_URI=

CORS_ORIGIN=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Installation



Clone the repository:

```bash
git clone https://github.com/your-username/medismart-backend.git
cd medismart-backend
```

Install dependencies:

```bash
npm install
```
## Run Locally

Clone the project

```bash
  git clone https://github.com/aadarshdevstack/MEDISMART-backend.git
```

Go to the project directory

```bash
  cd MEDISMART-backend
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```


## Authors

- [@Aadarsh Garhewal](https://github.com/aadarshdevstack)

