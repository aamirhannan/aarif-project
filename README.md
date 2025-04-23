# Authentication API

A simple Express API for user authentication with JWT.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:

   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/aarif-project
   JWT_SECRET=your_jwt_secret_key_change_in_production
   FRONTEND_URL=http://localhost:3000
   ```

3. Start the server:

   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- **Register User**
  - URL: `/api/v1/register`
  - Method: `POST`
  - Body:

    ```json
    {
      "name": "John Doe",
      "mobNumber": "9876543210",
      "email": "testuser@example.com",
      "password": "Password123",
      "role": "causePoster" // or "sponsor" or "public"
    }
    ```

  - Response:

    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "_id": "60c72b2f9b1d2c3d4e5f6g7h",
        "userID": "550e8400-e29b-41d4-a716-446655440000", // UUID format
        "name": "John Doe",
        "mobNumber": "1234567890",
        "email": "john@example.com",
        "role": "CAUSE_POSTER",
        "loginComplete": true,
        "aadhaarVerified": false,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

- **Login User**
  - URL: `/api/v1/login`
  - Method: `POST`
  - Body:

    ```json
    {
      "email": "testuser@example.com",
      "password": "Password123"
    }
    ```

  - Response:

    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "_id": "60c72b2f9b1d2c3d4e5f6g7h",
        "userID": "550e8400-e29b-41d4-a716-446655440000", // UUID format
        "name": "John Doe",
        "mobNumber": "1234567890",
        "email": "john@example.com",
        "role": "CAUSE_POSTER",
        "loginComplete": true,
        "aadhaarVerified": false,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

- **Get Current User**
  - URL: `/api/v1/me`
  - Method: `GET`
  - Headers:

    ```
    Authorization: Bearer <token>
    ```

### Causes

- **Create Cause**
  - URL: `/api/v1/causes`
  - Method: `POST`
  - Access: Private (CAUSE_POSTER role only)
  - Headers:

    ```
    Authorization: Bearer <token>
    ```

  - Body:

    ```json
    {
      "title": "Clean Water Initiative",
      "description": "Providing clean water to rural communities",
      "qty": 100,
      "singleItemPrice": 25,
      "category": "Environment",
      "impactLevel": "High"
    }
    ```

  - Response:

    ```json
    {
      "success": true,
      "message": "Cause created successfully. It will be reviewed by an admin.",
      "data": {
        "_id": "60c72b2f9b1d2c3d4e5f6g7h",
        "causeID": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Clean Water Initiative",
        "description": "Providing clean water to rural communities",
        "qty": 100,
        "claimed": 0,
        "singleItemPrice": 25,
        "totalAmount": 2500,
        "currentPrice": 0,
        "category": "Environment",
        "impactLevel": "High",
        "status": "pending",
        "createdBy": "60c72b2f9b1d2c3d4e5f6g7h",
        "createdAt": "2023-07-15T12:00:00.000Z",
        "updatedAt": "2023-07-15T12:00:00.000Z",
        "progressPercentage": "0.00",
        "isFullyFunded": false
      }
    }
    ```

- **Get User Causes**
  - URL: `/api/v1/causes/:userId`
  - Method: `GET`
  - Access: Private
  - Headers:

    ```
    Authorization: Bearer <token>
    ```

  - Response:

    ```json
    {
      "success": true,
      "message": "User causes retrieved successfully",
      "data": [
        {
          "_id": "60c72b2f9b1d2c3d4e5f6g7h",
          "causeID": "550e8400-e29b-41d4-a716-446655440000",
          "title": "Clean Water Initiative",
          "description": "Providing clean water to rural communities",
          "qty": 100,
          "claimed": 0,
          "singleItemPrice": 25,
          "totalAmount": 2500,
          "currentPrice": 0,
          "category": "Environment",
          "impactLevel": "High",
          "status": "pending",
          "createdBy": {
            "_id": "60c72b2f9b1d2c3d4e5f6g7h",
            "name": "John Doe",
            "email": "john@example.com",
            "userID": "550e8400-e29b-41d4-a716-446655440000"
          },
          "createdAt": "2023-07-15T12:00:00.000Z",
          "updatedAt": "2023-07-15T12:00:00.000Z",
          "progressPercentage": "0.00",
          "isFullyFunded": false
        }
      ]
    }
    ```

- **Get All Approved Causes**
  - URL: `/api/v1/causes`
  - Method: `GET`
  - Access: Public
  - Query Parameters:
    - `category` (optional): Filter by category
    - `sort` (optional): Sort field (default: `-createdAt`)
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Results per page (default: 10)
  - Response:

    ```json
    {
      "success": true,
      "message": "Approved causes retrieved successfully",
      "data": {
        "causes": [
          {
            "_id": "60c72b2f9b1d2c3d4e5f6g7h",
            "causeID": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Clean Water Initiative",
            "description": "Providing clean water to rural communities",
            "qty": 100,
            "claimed": 0,
            "singleItemPrice": 25,
            "totalAmount": 2500,
            "currentPrice": 0,
            "category": "Environment",
            "impactLevel": "High",
            "status": "approved",
            "createdBy": {
              "_id": "60c72b2f9b1d2c3d4e5f6g7h",
              "name": "John Doe",
              "email": "john@example.com",
              "userID": "550e8400-e29b-41d4-a716-446655440000"
            },
            "createdAt": "2023-07-15T12:00:00.000Z",
            "updatedAt": "2023-07-15T12:00:00.000Z",
            "progressPercentage": "0.00",
            "isFullyFunded": false
          }
        ],
        "pagination": {
          "total": 1,
          "page": 1,
          "pages": 1,
          "limit": 10
        }
      }
    }
    ```

- **Get Shareable Cause**
  - URL: `/api/v1/cause/share/:causeId`
  - Method: `GET`
  - Access: Public
  - Response:

    ```json
    {
      "success": true,
      "message": "Share link and QR code generated",
      "data": {
        "cause": {
          // Cause data
        },
        "shareLink": "https://yourdomain.com/cause/550e8400-e29b-41d4-a716-446655440000",
        "qrCode": "data:image/png;base64,iVBOR...",
        "socialShares": {
          "twitter": "https://twitter.com/intent/tweet?url=...",
          "facebook": "https://www.facebook.com/sharer/sharer.php?u=...",
          "whatsapp": "https://wa.me/?text=..."
        }
      }
    }
    ```

## User Roles

- **CAUSE_POSTER**: Can post causes (input as 'causePoster')
- **SPONSOR**: Can sponsor causes (input as 'sponsor')
- **PUBLIC**: General public user (input as 'public')

## Authorization

- Authentication is handled using JWT tokens
- Protected routes require the token in the Authorization header
  - Format: `Bearer <token>`

## Models

### User Model

The user model includes the following fields:

- `userID`: A unique UUID automatically generated for each user
- `name`: User's full name
- `mobNumber`: User's mobile number
- `email`: User's email (required for causePoster and sponsor roles)
- `password`: Hashed password
- `role`: User's role (CAUSE_POSTER, SPONSOR, or PUBLIC)
- `loginComplete`: Whether user has completed login process
- `aadhaarVerified`: Whether user has verified their Aadhaar card

### Cause Model

The cause model includes the following fields:

- `causeID`: A unique UUID automatically generated for each cause
- `createdBy`: Reference to the user who created the cause
- `title`: Title of the cause
- `description`: Detailed description of the cause
- `qty`: Total quantity of tote bags requested
- `claimed`: Number of bags that have been claimed/sponsored (default: 0)
- `totalAmount`: Total amount needed for all bags
- `currentPrice`: Current amount that has been sponsored (default: 0)
- `singleItemPrice`: Price of a single tote bag
- `category`: Optional category for the cause
- `impactLevel`: Optional impact level of the cause
- `status`: Status of the cause (pending, approved, rejected)
- `progressPercentage`: Virtual field showing funding progress as percentage
- `isFullyFunded`: Virtual field indicating if cause is fully funded

## Testing the API

Here are sample requests to test the API using tools like Postman or curl:

### Register Request

```bash
curl -X POST http://localhost:5000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "mobNumber": "9876543210",
    "email": "testuser@example.com",
    "password": "Password123",
    "role": "causePoster"
  }'
```

### Login Request

```bash
curl -X POST http://localhost:5000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Password123"
  }'
```

### Create Cause Request

```bash
curl -X POST http://localhost:5000/api/v1/causes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Clean Water Initiative",
    "description": "Providing clean water to rural communities",
    "qty": 100,
    "singleItemPrice": 25,
    "category": "Environment",
    "impactLevel": "High"
  }'
```
