# API Endpoints Quick Reference

## Authentication Routes

| Endpoint | Method | Auth Required | Request Body | Description |
|----------|--------|---------------|--------------|-------------|
| `/api/v1/register` | POST | No | `{ "name": "John Doe", "mobNumber": "9876543210", "email": "user@example.com", "password": "Password123", "role": "causePoster" }` | Register a new user |
| `/api/v1/login` | POST | No | `{ "email": "user@example.com", "password": "Password123" }` | Login and get JWT token |
| `/api/v1/me` | GET | Yes | - | Get current user profile |

## Cause Routes

| Endpoint | Method | Auth Required | Request Body / Parameters | Description |
|----------|--------|---------------|---------------------------|-------------|
| `/api/v1/causes` | POST | Yes (CAUSE_POSTER only) | `{ "title": "Clean Water Initiative", "description": "Providing clean water", "qty": 100, "singleItemPrice": 25, "category": "Environment", "impactLevel": "High" }` | Create a new cause |
| `/api/v1/causes/:userId` | GET | Yes | Path Param: `userId` - MongoDB ObjectId | Get all causes by user |
| `/api/v1/causes` | GET | No | Query Params: `category`, `sort`, `page`, `limit` | Get all approved causes |
| `/api/v1/cause/share/:causeId` | GET | No | Path Param: `causeId` - UUID | Get shareable link and QR code |

## Headers for Authenticated Routes

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* Response data */ }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information (in development mode)"
}
```

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Server Error
