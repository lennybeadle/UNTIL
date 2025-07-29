# User Profile Service

A simple user profile service built with Fastify, PostgreSQL, and Docker, focusing on development best practices and code quality.

## 🚀 Features

- **RESTful API** with four endpoints for user profile management
- **PostgreSQL** database with proper indexing and triggers
- **Structured logging** with Pino
- **Comprehensive testing** with Vitest
- **Code quality tools** (ESLint, Prettier)
- **Docker** containerization
- **Graceful shutdown** handling
- **Input validation** and error handling

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/profiles` | Retrieve all user profiles |
| `GET` | `/api/v1/profiles/:id` | Retrieve a single profile by ID |
| `POST` | `/api/v1/profiles` | Create a new user profile |
| `PUT` | `/api/v1/profiles/:id` | Update an existing profile |

### Request/Response Examples

#### Create Profile
```bash
POST /api/v1/profiles
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01"
}
```

#### Get All Profiles
```bash
GET /api/v1/profiles
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-01",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (if running locally)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd user-profile-service
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations and seed data**
   ```bash
   # Run migrations
   docker-compose exec app npm run db:migrate
   
   # Seed with sample data
   docker-compose exec app npm run db:seed
   ```

4. **Access the API**
   - API: http://localhost:3000
   - Health check: http://localhost:3000/health
   - API documentation: http://localhost:3000

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   export DATABASE_URL="postgresql://postgres:password@localhost:5432/user_profiles"
   export LOG_LEVEL="debug"
   ```

3. **Start PostgreSQL** (if not using Docker)
   ```bash
   # Using Docker for database only
   docker run -d \
     --name postgres \
     -e POSTGRES_DB=user_profiles \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     postgres:15-alpine
   ```

4. **Run migrations and seed data**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage
The project includes comprehensive test coverage for:
- Model validation and database operations
- API route handlers
- Error scenarios
- Input validation

## 🔧 Development Tools

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## 🏗️ Architecture Decisions

### HTTP Method and Route Design

I chose the following HTTP methods and route structure based on RESTful principles:

1. **GET /api/v1/profiles** - Retrieve all profiles
   - Uses GET as it's a safe, idempotent operation for reading data
   - Returns a list with count for better API usability

2. **GET /api/v1/profiles/:id** - Retrieve a single profile
   - Uses GET with resource identifier in URL path
   - Returns 404 for non-existent resources

3. **POST /api/v1/profiles** - Create a new profile
   - Uses POST as it creates a new resource
   - Returns 201 status code for successful creation
   - Includes validation before database operation

4. **PUT /api/v1/profiles/:id** - Update an existing profile
   - Uses PUT for complete resource updates
   - Returns 404 if resource doesn't exist
   - Includes validation and proper error handling

### Trade-offs and Assumptions

1. **Database Design**
   - Used snake_case for database columns (PostgreSQL convention)
   - Added indexes on commonly queried fields (name, created_at)
   - Implemented automatic updated_at timestamp updates via triggers
   - Used SERIAL for auto-incrementing IDs

2. **API Design**
   - Chose PUT over PATCH for updates (simpler implementation)
   - Used camelCase for API request/response fields (JavaScript convention)
   - Implemented consistent error response format
   - Added success flag to all responses for easier client handling

3. **Validation**
   - Server-side validation only (no client-side validation)
   - Comprehensive validation including future date checks
   - Trim whitespace from string inputs
   - Return detailed validation error messages

4. **Error Handling**
   - Global error handler for consistent error responses
   - Proper HTTP status codes (400, 404, 500)
   - Structured logging for debugging
   - Graceful shutdown handling

5. **Testing Strategy**
   - Unit tests for model logic
   - Integration tests for API endpoints
   - Mocked database for isolated testing
   - High test coverage for critical paths

## 📊 Database Schema

```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Observability

- **Structured Logging**: Uses Pino with pretty printing for development
- **Health Check**: `/health` endpoint for monitoring
- **Request Logging**: All API requests are logged with relevant context
- **Error Logging**: Comprehensive error logging with stack traces

## 🚀 Deployment

The service is containerized and ready for deployment:

```bash
# Build production image
docker build --target production -t user-profile-service .

# Run production container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e LOG_LEVEL="info" \
  user-profile-service
```

## 📝 License

MIT License - see LICENSE file for details. 