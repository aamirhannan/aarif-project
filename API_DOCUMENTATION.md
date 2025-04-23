# API Documentation

This document provides detailed information about all the API endpoints in the application.

## Table of Contents

- [Authentication](#authentication)
  - [Register User](#register-user)
  - [Login User](#login-user)
  - [Get Current User](#get-current-user)
- [Causes](#causes)
  - [Create Cause](#create-cause)
  - [Get User Causes](#get-user-causes)
  - [Get All Approved Causes](#get-all-approved-causes)
  - [Get Shareable Cause](#get-shareable-cause)

---

## Authentication

### Register User

Register a new user in the system.

- **URL**: `/api/v1/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:

  ```json
  {
    "name": "John Doe",
    "mobNumber": "9876543210",
    "email": "user@example.com",
    "password": "Password123",
    "role": "causePoster"  // or "sponsor" or "public"
  }
  ```

- **Success Response**:
  - **Code**: 201 Created
  - **Content**:

    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "_id": "60c72b2f9b1d2c3d4e5f6g7h",
        "userID": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "mobNumber": "9876543210",
        "email": "user@example.com",
        "role": "CAUSE_POSTER",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**:

    ```json
    {
      "success": false,
      "message": "User with this email already exists"
    }
    ```

  - OR
  - **Code**: 400 Bad Request
  - **Content**:

    ```json
    {
      "success": false,
      "message": "Invalid role. Must be one of: causePoster, sponsor, public"
    }
    ```

### Login User

Authenticate a user and get a token.

- **URL**: `/api/v1/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:

  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "_id": "60c72b2f9b1d2c3d4e5f6g7h",
        "userID": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "mobNumber": "9876543210",
        "email": "user@example.com",
        "role": "CAUSE_POSTER",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**:

    ```json
    {
      "success": false,
      "message": "Invalid credentials"
    }
    ```

### Get Current User

Get the profile of the currently authenticated user.

- **URL**: `/api/v1/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Headers**:

  ```
  Authorization: Bearer <token>
  ```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

    ```json
    {
      "success": true,
      "message": "User profile retrieved successfully",
      "data": {
        "_id": "60c72b2f9b1d2c3d4e5f6g7h",
        "userID": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "mobNumber": "9876543210",
        "email": "user@example.com",
        "role": "CAUSE_POSTER"
      }
    }
    ```

- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**:

    ```json
    {
      "success": false,
      "message": "Not authorized, no token provided"
    }
    ```

---

## Causes

### Create Cause

Create a new cause (only available to users with CAUSE_POSTER role).

- **URL**: `/api/v1/causes`
- **Method**: `POST`
- **Auth Required**: Yes (CAUSE_POSTER role only)
- **Headers**:

  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

- **Request Body**:

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

- **Success Response**:
  - **Code**: 201 Created
  - **Content**:

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
        "createdBy": "550e8400-e29b-41d4-a716-446655440000",
        "createdAt": "2023-07-15T12:00:00.000Z",
        "updatedAt": "2023-07-15T12:00:00.000Z",
        "progressPercentage": "0.00",
        "isFullyFunded": false
      }
    }
    ```

- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**:

    ```json
    {
      "success": false,
      "message": "Please provide a title for the cause"
    }
    ```

  - OR
  - **Code**: 403 Forbidden
  - **Content**:

    ```json
    {
      "success": false,
      "message": "User role 'SPONSOR' is not authorized to access this route"
    }
    ```

### Get User Causes

Get all causes created by a specific user.

- **URL**: `/api/v1/causes/:userId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Headers**:

  ```
  Authorization: Bearer <token>
  ```

- **Path Parameters**:
  - `userId`: UUID of the user
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

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
          "createdBy": "550e8400-e29b-41d4-a716-446655440000",
          "userInfo": {
            "name": "John Doe",
            "email": "user@example.com",
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

- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**:

    ```json
    {
      "success": false,
      "message": "Not authorized, token failed"
    }
    ```

### Get All Approved Causes

Get all approved causes for public browsing.

- **URL**: `/api/v1/causes`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `category` (optional): Filter by category
  - `sort` (optional): Sort field (default: `-createdAt`)
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Results per page (default: 10)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

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
            "createdBy": "550e8400-e29b-41d4-a716-446655440000",
            "userInfo": {
              "name": "John Doe",
              "email": "user@example.com",
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

### Get Shareable Cause

Get a shareable link and QR code for a specific cause.

- **URL**: `/api/v1/cause/share/:causeId`
- **Method**: `GET`
- **Auth Required**: No
- **Path Parameters**:
  - `causeId`: UUID of the cause
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

    ```json
    {
      "success": true,
      "message": "Share link and QR code generated",
      "data": {
        "cause": {
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
          "createdBy": "550e8400-e29b-41d4-a716-446655440000",
          "userInfo": {
            "name": "John Doe",
            "email": "user@example.com",
            "userID": "550e8400-e29b-41d4-a716-446655440000"
          },
          "createdAt": "2023-07-15T12:00:00.000Z",
          "updatedAt": "2023-07-15T12:00:00.000Z",
          "progressPercentage": "0.00",
          "isFullyFunded": false
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

- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:

    ```json
    {
      "success": false,
      "message": "Cause not found"
    }
    ```

  - OR
  - **Code**: 403 Forbidden
  - **Content**:

    ```json
    {
      "success": false,
      "message": "Cannot share cause that is not approved"
    }
    ```

## Common Status Codes

- **200 OK**: The request was successful
- **201 Created**: A new resource was successfully created
- **400 Bad Request**: The request was invalid or cannot be served
- **401 Unauthorized**: Authentication is required and has failed or not been provided
- **403 Forbidden**: The server understood the request but refuses to authorize it
- **404 Not Found**: The requested resource could not be found
- **500 Server Error**: An error occurred on the server

## Authentication Scheme

The API uses JWT (JSON Web Token) for authentication. To authenticate a request, provide the token in the Authorization header:

```
Authorization: Bearer <token>
```

The JWT token contains the userID (UUID) of the authenticated user, not the MongoDB ObjectId.

You can obtain a token by using the login or register endpoints.
