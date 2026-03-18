# Real Estate API

## Project Overview
This Real Estate App is a property listing and booking platform that connects property agents with users searching for serviced apartments or properties for sale. Agents can list properties, while users can browse listings, book serviced apartments, and communicate with agents through a messaging system.

Why this project is unique:
- It combines property listing and booking functionalities in a single platform.
- It includes a real-time chat system for seamless communication between users and agents.
- It provides a dashboard for agents to manage their listings and bookings effectively.

## Features

## USER AUTHENTICATION:
- Users can register and log in to the system
- Authentication is done using JWT tokens
- Users can log out and refresh their tokens

### PROPERTY LISTINGS:
- Agents can create property listings
- Listing includes:
    - Title
    - Description
    - Price
    - Location
    - Images
    - Contact information

### BOOKING SYSTEM:
- Users can:
    - Book a property
    - Choose check-in and check-out dates
    - Upload payment receipts
    - Receive booking approval or rejection from agents
    - Verify or reject payment receipts

### CHAT SYSTEM:
- Users can chat with agents regarding properties
- Chat includes:
    - Sending messages
    - Receiving messages
    - Marking messages as read

### DASHBOARD:
- Agents can view a dashboard with:
    - Total properties listed
    - Total bookings
    - Total revenue generated   

### NOTIFICATIONS:
- Users receive notifications for:
    - Booking creating, approvals or rejections
    - Receipt verification results
    - New messages in chat conversations

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- Multer for file uploads
- Redis for caching and session management
- Socket.io for real-time chat functionality
- Cloudinary for image storage and management
- joi for input validation
- Postman for API testing

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>   
   ```  
2. Navigate to the project directory:
   ```bash
   cd <project-directory>
   ```  
3. Install dependencies:
   ```bash
   npm install
   ```  
4. Start the server:
   ```bash  
    npm start
    ``` 
## API Endpoints

1. Authentication:
- `POST /auth/register`: Register a new user
- `POST /auth/login`: Log in a user and receive a JWT token
- `POST /auth/logout`: Log out a user and invalidate the JWT token
- `POST /auth/refresh-token`: Refresh the JWT token for an authenticated user

2. User Management:
- `GET /users/:userId/status`: Retrieve the status of a specific user

3. Property Management:
- `POST /properties`: Create a new property listing
- `GET /properties`: Retrieve all property listings
- `GET /properties/:id`: Retrieve a specific property listing
- `PUT /properties/:id`: Update a specific property listing
- `DELETE /properties/:id`: Delete a specific property listing  

4. Booking Management:
- `POST /bookings`: Create a new booking for a property
- `POST /bookings/:bookingId/upload-receipt`: Upload a receipt for a specific booking    
- `POST /bookings/:bookingId/approve`: Approve a specific booking
- `POST /bookings/:bookingId/reject`: Reject a specific booking
- `POST /bookings/:bookingId/verify-receipt`: Verify the receipt for a specific booking
- `POST /bookings/:bookingId/reject-receipt`: Reject the receipt for a specific booking

5. Chat Management:
- `POST /chats/send`: Create a new chat between user and agent
- `GET /chats/inbox`: Retrieve all messages for the authenticated user
- `GET /chats/:conversationId`: Retrieve a specific chat conversation
- `POST /chats/:conversationId/read`: Mark messages in a conversation as read

6. Dashboard:
- `GET /dashboard/agent`: Retrieve dashboard data for agents

7. Notifications:
- `GET /notifications`: Retrieve all notifications for the authenticated user
- `POST /notifications/:notificationId/mark-as-read`: Mark a specific notification as read

## System Architecture
The system is built using a modular architecture, with separate modules for authentication, user management, property management, booking management, chat management, dashboard, and notifications. Each module has its own routes, controllers, and models to handle specific functionalities.

- Controllers: Handles HTTP requests and responses.
- Routes: Define the API endpoints and map them to the corresponding controller functions
- Models: Define the data schema and interact with the database
- Services: Contains business logic and interacts with models to perform operations
- Repositories: Handles data access and database operations

## Database Design
The database is designed using MongoDB, with the following collections:
- Users: Stores user information, including authentication details and status
- Properties: Stores property listings and their details
- Bookings: Stores booking information, including user, property, and booking status
- Chats: Stores chat conversations and messages between users and agents
- Notifications: Stores notifications for users regarding bookings, receipts, and chat messages

Example Collection:
- Users Collection:
```json
{
  "_id": "userId",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "hashedPassword",
  "role": "user || agent",
  "createdAt" : "timestamp",
}
``` 
- Properties Collection:
```json
{
    "_id": "propertyId",
    "title": "Beautiful Apartment",
    "description": "A spacious apartment in the city center",
    "price": 150000,
    "location": "Lagos, Nigeria",
    "images": ["image1.jpg", "image2.jpg"],
    "bedrooms": 5,
    "bathrooms": 0,
    "propertyType": "serviced",
    "dailyRate": 150000,
    "agentName": "agent user",
    "agentPhone": "09089765456",
    "agentEmail": "brown@yahoo.com",
    "postedBy": "6940160b02cd2576fab9270d",
    "createdAt": "2025-12-15T14:32:48.633Z",
    "updatedAt": "2025-12-15T14:32:48.633Z",  
}
```
- Bookings Collection:
```json
{
    "property": "694030a6ea531f9d4deebf62",
    "guestName": "agent brown",
    "guestEmail": "brown@yahoo.com",
    "guestPhone": "09089765456",
    "checkInDate": "2025-12-15T00:00:00.000Z",
    "checkOutDate": "2025-12-17T00:00:00.000Z",
    "totalPrice": 200000,
    "message": "Is this still available",
    "_id": "694030c3ea531f9d4deebf68",
    "createdAt": "2025-12-15T16:01:07.262Z",
    "updatedAt": "2025-12-15T16:01:07.262Z",
    "__v": 0
}
```
- Chats Collection:
```json
{
    "property": "694030a6ea531f9d4deebf62",
    "agent": "6940160b02cd2576fab9270d",
    "sender": "69402e71ea531f9d4deebf53",
    "senderName": "user mob",
    "senderEmail": "user@yahoo.com",
    "content": "Can you please provide me with   more information about it?",
    "reply": "",
    "isReply": false,
    "isRead": false,
    "deleted": false,
    "_id": "694a6ad7581438f2d10e27f4",
    "createdAt": "2025-12-23T10:11:35.342Z",
    "updatedAt": "2025-12-23T10:11:35.342Z",
}
```

## Booking system design
The booking system allows users to book properties by providing their details and selecting check-in and check-out dates. Users can also upload payment receipts for their bookings, which agents can verify or reject. The booking process includes the following steps:
1. User creates a booking by providing their name, email, phone number, check-in and check-out dates, and an optional message.
2. The booking is stored in the database with a status of "pending".
3. The agent receives a notification about the new booking and can choose to approve or reject it.
4. If the booking is approved, the user receives a notification and can proceed to upload a payment receipt.
5. The agent can verify the uploaded receipt and either approve or reject it.
6. If the payment receipt is approved, the payment status is updated to "verified" and on the check-in date, the booking status is updated to "active".
7. If the payment receipt is rejected, the user receives a notification and can upload a new receipt for verification.
8. Once the booking is active, the user can check out on the check-out date, and the booking status is updated to "completed".

- Booking Statuses: ["pending", "approved", "rejected", "cancelled", "expired", "active", "completed"].
- Payment Statuses: ["unpaid", "receiptUploaded", "verified", "rejected"].

### Other booking features:
- Users can cancel their bookings up to 24 hours before the check-in date, which updates the booking status to "cancelled".
- Bookings that are not approved or rejected within 48 hours of creation automatically expire, updating the booking status to "expired".
- Double booking prevention is implemented by checking for overlapping bookings for the same property and date range before allowing a new booking to be created.   

## Security Measures
- Passwords are hashed using bcrypt before being stored in the database.
- JWT tokens are used for authentication and authorization, with secure secret keys and expiration times.
- Input validation is implemented using joi to prevent invalid data from being processed.
- Rate limiting is applied to API endpoints to prevent abuse and brute-force attacks.
- CORS is configured to allow requests only from trusted origins.
- HTTPS is recommended for secure communication between clients and the server.

## Environment Variables
- `PORT`: The port on which the server will run (default: 3000)
- `MONGODB_URI`: The connection string for the MongoDB database
- `JWT_SECRET`: The secret key for signing JWT tokens
- `REFRESH_TOKEN_SECRET`: The secret key for signing refresh tokens
- `CLOUDINARY_CLOUD_NAME`: The cloud name for Cloudinary image storage
- `CLOUDINARY_API_KEY`: The API key for Cloudinary image storage
- `CLOUDINARY_API_SECRET`: The API secret for Cloudinary image storage
- `REDIS_URL`: The connection string for the Redis server

## Future Enhancements
- Implementing a review and rating system for properties and agents
- Adding support for multiple languages and localization
- Integrating with third-party services for payment processing and property listing syndication
- Implementing a recommendation system for users based on their preferences and booking history
- Implementing a more advanced search and filtering system for properties
- Implementing a more robust notification system with email and SMS notifications
- Google Maps integration for property location visualization

## Author 
- Mobolaji Adebola (Software Engineer)
- Email: mobolajiadebola@yahoo.com

## Conclusion
This Real Estate API provides a comprehensive platform for property listing and booking, connecting agents with users in a seamless and efficient manner. With its robust features, secure authentication, and user-friendly design. It aims to enhance the real estate experience for both agents and users. Future enhancements will continue to improve the functionality and user experience of the platform.