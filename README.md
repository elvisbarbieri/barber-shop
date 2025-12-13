# Distrito Barbearia API

A RESTful API built with Azure Functions for managing barbers, services, appointments, and sending confirmation emails for a barbershop.

## Features

- **Barbers Management**: Get list of available barbers with their specialties and information
- **Services Management**: Get available services (haircuts, beard services, combos)
- **Appointment Booking**: Create appointments with validation and availability checking
- **Time Slots**: Get available time slots for a specific date and barber
- **Email Confirmation**: Send confirmation emails to customers with appointment details

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Azure Functions v4
- **Database**: Azure Cosmos DB (MongoDB API)
- **Email Service**: Nodemailer with Gmail SMTP
- **API Documentation**: OpenAPI 3.0.3 (Swagger)
- **Environment Management**: dotenv

## Project Structure

```
distrito-barbearia/
├── src/
│   ├── functions/          # Azure Functions HTTP triggers
│   ├── handlers/           # Request handlers (business logic orchestration)
│   ├── services/           # Business logic services
│   ├── mappers/            # Data transformation mappers
│   ├── utils/              # Utility classes (Logger, EmailService, etc.)
│   └── resources/          # Static JSON data (barbers, services)
├── swagger.yaml            # API documentation
├── host.json              # Azure Functions host configuration
├── package.json           # Dependencies
├── .env.example           # Environment variables template
└── .env                   # Local environment variables (gitignored - copy from .env.example)
```

## Prerequisites

- Node.js (v18 or higher)
- Azure Functions Core Tools
- Azure account (for Cosmos DB)
- Gmail account (for email sending)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd distrito-barbearia
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your credentials:
- `COSMOS_CONNECTION_STRING`: Your Azure Cosmos DB connection string
- `GMAIL_USER`: Your Gmail address
- `GMAIL_APP_PASSWORD`: Your Gmail app password (generate from Google Account settings)
- `DATABASE`: Database name (default: distrito-barber)
- `COLLECTION_CHECKIN`: Collection name (default: distritobarber)

## Getting Gmail App Password

1. Enable 2-Step Verification on your Google Account
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Copy the 16-character password and use it as `GMAIL_APP_PASSWORD`

## Running Locally

Start the Azure Functions runtime:
```bash
npm start
```

The API will be available at: `http://localhost:7071/api`

## API Endpoints

### GET /barbers
Returns a list of available barbers.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Guilherme",
      "specialty": "Cortes Clássicos & Barba Tradicional",
      "bio": "...",
      "imageUrl": "..."
    }
  ]
}
```

### GET /services
Returns available services (Combos, "Apenas Cabelo", "Apenas Barba").

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Apenas Barba",
      "price": 45,
      "duration": 30,
      "category": "Barba"
    }
  ]
}
```

### POST /time-slots
Get available time slots for a specific date and barber.

**Request:**
```json
{
  "date": "2025-01-15",
  "barberId": 4,
  "serviceId": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "availableSlots": [
      "09:00 AM",
      "09:45 AM",
      "11:15 AM"
    ]
  }
}
```

### POST /appointments
Create a new appointment.

**Request:**
```json
{
  "barberId": 4,
  "serviceId": 7,
  "date": "2025-01-15",
  "time": "10:30 AM",
  "customerName": "João Silva",
  "customerEmail": "joao.silva@email.com",
  "customerWhatsapp": "(11) 98765-4321",
  "paymentMethod": "later"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "barber": { ... },
    "service": { ... },
    "date": "2025-01-15",
    "time": "10:30 AM",
    "customerName": "João Silva",
    "customerEmail": "joao.silva@email.com",
    "customerWhatsapp": "(11) 98765-4321",
    "paymentMethod": "later",
    "status": "confirmed",
    "createdAt": "2025-01-10T14:30:00Z",
    "confirmationCode": "ABC123"
  },
  "message": "Appointment created successfully"
}
```

### POST /appointment/confirmation
Send confirmation email to the customer.

**Request:**
```json
{
  "appointmentId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "appointmentId": "507f1f77bcf86cd799439011",
    "emailSent": true,
    "sentAt": "2025-01-10T14:30:00.000Z",
    "messageId": "<message-id-from-gmail>"
  },
  "message": "Confirmation email sent successfully"
}
```

## Business Rules

- **Business Hours**: 9:00 AM - 6:00 PM
- **Buffer Between Appointments**: 15 minutes
- **Time Slot Calculation**: Based on service duration + buffer
- **Date Validation**: Appointments must be scheduled for future dates
- **Overlap Prevention**: System prevents overlapping appointments with buffer consideration

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input data
- `BARBERS_NOT_FOUND`: No barbers available
- `SERVICES_NOT_FOUND`: No services available
- `APPOINTMENT_NOT_FOUND`: Appointment not found
- `TIME_SLOT_UNAVAILABLE`: Selected time slot is not available
- `BARBER_UNAVAILABLE`: Barber is not available at selected time
- `EMAIL_SEND_FAILED`: Failed to send confirmation email

## API Documentation

Full API documentation is available in `swagger.yaml`. You can view it using Swagger UI or import it into tools like Postman.

## Testing

Example curl requests:

```bash
# Get barbers
curl http://localhost:7071/api/barbers

# Get services
curl http://localhost:7071/api/services

# Get time slots
curl -X POST http://localhost:7071/api/time-slots \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-15","barberId":4,"serviceId":7}'

# Create appointment
curl -X POST http://localhost:7071/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "barberId": 4,
    "serviceId": 7,
    "date": "2025-01-15",
    "time": "10:30 AM",
    "customerName": "João Silva",
    "customerEmail": "joao.silva@email.com",
    "customerWhatsapp": "(11) 98765-4321",
    "paymentMethod": "later"
  }'

# Send confirmation email
curl -X POST http://localhost:7071/api/appointment/confirmation \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":"507f1f77bcf86cd799439011"}'
```

## Deployment

1. Create an Azure Function App
2. Configure application settings with environment variables
3. Deploy using Azure Functions Core Tools:
```bash
func azure functionapp publish <your-function-app-name>
```

## Environment Variables

Required environment variables:

**For Local Development:**
Create a `.env` file in the root directory (copy from `.env.example`):
```env
COSMOS_CONNECTION_STRING=your-connection-string
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
DATABASE=distrito-barber
COLLECTION_CHECKIN=distritobarber
```

**For Azure Functions:**
Configure in Azure Portal → Function App → Configuration → Application settings:
- `COSMOS_CONNECTION_STRING`: Azure Cosmos DB connection string
- `GMAIL_USER`: Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Gmail app password
- `DATABASE`: Database name
- `COLLECTION_CHECKIN`: Collection name
- `AzureWebJobsStorage`: Azure Storage connection string (for Azure Functions)
- `FUNCTIONS_WORKER_RUNTIME`: Set to "node"

**Note:** The `.env` file is gitignored and will not be committed to the repository. Always use `.env.example` as a template.

## Logging

The application uses structured logging through the `Logger` class:
- Logs include request metadata (invocation ID, function name, timestamp)
- Sensitive data is automatically sanitized
- Logs are integrated with Azure Functions context logging

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]

