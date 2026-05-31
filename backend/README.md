# PulseCheck Backend

Spring Boot 3 backend application for monitoring services and applications.

## Tech Stack

- **Java 21**
- **Spring Boot 3.x**
- **Spring Security + JWT** (jjwt library)
- **Spring Data JPA + PostgreSQL**
- **Redis** (Spring Data Redis)
- **Quartz Scheduler**
- **Flyway** (DB migration)
- **MapStruct** (DTO mapping)
- **Maven**

## Project Structure

```
com.pulsecheck
├── auth/           # Authentication & authorization
├── monitor/        # Service monitoring functionality
├── checker/        # Health check services
├── notification/   # Notification services
└── common/         # Shared components
```

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.8+
- PostgreSQL 14+
- Redis 6+

### Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE pulsecheck;
```

2. Create user (optional):
```sql
CREATE USER pulsecheck WITH PASSWORD 'pulsecheck';
GRANT ALL PRIVILEGES ON DATABASE pulsecheck TO pulsecheck;
```

### Redis Setup

Install and start Redis server:
```bash
# On Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# On macOS with Homebrew
brew install redis
brew services start redis

# On Windows
# Download and install Redis from https://redis.io/download
```

### Running the Application

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### Profiles

#### Local Profile (default)
- PostgreSQL: `localhost:5432/pulsecheck`
- Redis: `localhost:6379`
- CORS: Allows all origins for development

#### Production Profile
- Environment variables for database and Redis connections
- Stricter CORS configuration
- Production logging configuration

To run with production profile:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Health Check
- `GET /api/health` - Application health status

### Monitoring
- `GET /api/monitors` - List all monitors (authenticated)
- `POST /api/monitors` - Create new monitor (authenticated)
- `GET /api/monitors/{id}` - Get monitor details (authenticated)
- `PUT /api/monitors/{id}` - Update monitor (authenticated)
- `DELETE /api/monitors/{id}` - Delete monitor (authenticated)

## Configuration

### Environment Variables

#### Database
- `DATABASE_URL` - PostgreSQL connection URL
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password

#### Redis
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (if required)

#### JWT
- `JWT_SECRET` - JWT signing secret key
- `JWT_EXPIRATION` - Token expiration time in milliseconds (default: 86400000)
- `JWT_REFRESH_EXPIRATION` - Refresh token expiration time (default: 604800000)

#### CORS
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins

## Database Migrations

Flyway is used for database migrations. Migration files are located in:
```
src/main/resources/db/migration/
```

To run migrations manually:
```bash
mvn flyway:migrate
```

## Development

### Code Style

The project uses Lombok for reducing boilerplate code and MapStruct for DTO mapping.

### Testing

Run tests:
```bash
mvn test
```

### Building

Create executable JAR:
```bash
mvn clean package
```

The JAR will be located in `target/pulsecheck-backend-1.0.0.jar`

## Monitoring Features

- **Service Monitoring**: Monitor HTTP endpoints with configurable intervals
- **Health Checks**: Automatic health status checking with response times
- **Notifications**: Configurable notifications for service failures
- **History**: Track monitoring results over time
- **User Management**: Role-based access control

## Security

- JWT-based authentication
- Role-based authorization
- CORS configuration
- Password encryption with BCrypt
- Secure endpoint configuration
