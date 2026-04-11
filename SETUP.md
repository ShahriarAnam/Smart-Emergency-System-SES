# Setup & Deployment Guide

## Quick Start (Development)

### Windows Users

1. **Backend Setup**
   ```cmd
   cd smart-emergency\backend
   start.bat
   ```

2. **Frontend Setup (new terminal)**
   ```cmd
   cd smart-emergency\frontend
   start.bat
   ```

### Mac/Linux Users

1. **Backend Setup**
   ```bash
   cd smart-emergency/backend
   chmod +x start.sh
   ./start.sh
   ```

2. **Frontend Setup (new terminal)**
   ```bash
   cd smart-emergency/frontend
   chmod +x start.sh
   ./start.sh
   ```

## Docker Setup (Recommended for Production)

### Prerequisites
- Docker
- Docker Compose

### Start Services

```bash
cd smart-emergency

# Create .env file from example
cp .env.example .env

# Update .env with your API keys
# Edit .env and add:
# - GOOGLE_MAPS_API_KEY
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN
# - TWILIO_PHONE_NUMBER

# Start all services
docker-compose up -d
```

### Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Manual Setup

### Backend Setup (Windows)

1. **Python Installation**
   - Download Python 3.11+ from python.org
   - Add Python to PATH
   - Verify: `python --version`

2. **Backend Setup**
   ```cmd
   cd smart-emergency\backend
   
   # Create virtual environment
   python -m venv venv
   venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Configure environment
   copy ..\env.example .env
   # Edit .env with your settings. DATABASE_URL now defaults to SQLite.
   
   # Start server
   python app.py
   ```

### Backend Setup (Mac/Linux)

```bash
cd smart-emergency/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../env.example .env
# Edit .env with your settings. DATABASE_URL now defaults to SQLite.

# Start server
python app.py
```

### Frontend Setup (Windows)

1. **Node.js Installation**
   - Download from nodejs.org
   - Verify: `node --version` and `npm --version`

2. **Frontend Setup**
   ```cmd
   cd smart-emergency\frontend
   
   # Install dependencies
   npm install
   
   # Configure environment
   copy .env.example .env
   # Edit .env with:
   # VITE_API_URL=http://localhost:5000
   # VITE_GOOGLE_MAPS_API_KEY=your_key
   
   # Start development server
   npm run dev
   ```

### Frontend Setup (Mac/Linux)

```bash
cd smart-emergency/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

## Configuration

### Backend (.env)

```env
FLASK_ENV=development
DATABASE_URL=sqlite:///smart_emergency.db
JWT_SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:5173
GOOGLE_MAPS_API_KEY=your_google_maps_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## API Integration

### Google Maps Setup
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Maps JavaScript API
4. Create API key
5. Add to .env files

### Twilio Setup
1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Get a Twilio phone number
4. Add to .env

## Database Setup (Manual)

No manual database setup is required for local SQLite development. Tables are auto-created by SQLAlchemy on first run.

## Production Deployment

### Using Heroku

**Backend**
```bash
cd backend

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set JWT_SECRET_KEY=your-production-secret
# ... add other required env vars

# Deploy
git push heroku main
```

**Frontend (Vercel)**
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Using Docker on VPS

1. **SSH into server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone repository**
   ```bash
   git clone your-repo
   cd smart-emergency
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your settings
   ```

4. **Start with Docker**
   ```bash
   docker-compose up -d
   
   # Setup Nginx reverse proxy (optional)
   # Configure SSL with Let's Encrypt
   ```

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process using port 5000 and kill it
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows
```

**Database connection error:**
- Verify SQLite file permissions in the backend folder
- Check DATABASE_URL in .env
- Ensure the backend folder is writable so `smart_emergency.db` can be created

**Module import errors:**
- Activate virtual environment
- Reinstall requirements: `pip install -r requirements.txt`

### Frontend Issues

**Port already in use:**
```bash
# Kill process using port 5173
lsof -i :5173  # Mac/Linux
netstr -ano | findstr :5173  # Windows
```

**Dependencies issues:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

**CORS errors:**
- Check FRONTEND_URL in backend .env
- Verify CORS configuration in app.py

## Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov=.  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Monitoring

### Backend Logs
```bash
# With Gunicorn
gunicorn --log-level debug app:app

# With Flask
python app.py  # Automatically shows debug logs
```

### Frontend Logs
- Open browser DevTools (F12)
- Check Console tab for errors

## Security Checklist

- [ ] Change JWT_SECRET_KEY in production
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted origins
- [ ] Setup firewall rules
- [ ] Regular backups of database
- [ ] Monitor application logs
- [ ] Use strong passwords for admin

## Performance Optimization

### Backend
- Use connection pooling (configured in config.py)
- Cache frequent queries
- Use pagination for large datasets
- Monitor database query performance

### Frontend
- Code splitting with React.lazy
- Image optimization
- Use production build: `npm run build`
- Enable gzip compression on server
- Use CDN for static assets

## Support & Documentation

- Backend API docs: http://localhost:5000/api/health
- Frontend development: http://localhost:5173
- PostgreSQL docs: https://www.postgresql.org/docs/
- Flask docs: https://flask.palletsprojects.com/
- React docs: https://react.dev/

---

**Happy Coding! 🚀**
