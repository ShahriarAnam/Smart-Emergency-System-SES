# Smart Emergency System - Viva Presentation Guide

## Project Overview

This is a **group project** demonstrating **modular architecture** where each team member's contribution is clearly isolated and independently explainable. The system provides real-time emergency coordination with role-based access (requesters and helpers).

---

## Modular Architecture at a Glance

### The Key Principle
Each member owns specific features:
- **Backend**: Separate Flask Blueprint route files (member1_*.py, member2_*.py, etc.)
- **Frontend**: Separate component folders (member1/, member2/, etc.)
- **Models**: Separated into domain-specific files (user_model.py, request_model.py, message_model.py)

This allows each member to independently:
1. Explain their code without referencing others
2. Demonstrate their features in isolation
3. Show clear contribution boundaries
4. Test their module separately

---

## Pre-Viva Checklist

```bash
# Clone and setup
git clone <repo>
cd Smart Emergency System/smart-emergency

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database (if needed)
python -c "from app import create_app; app = create_app(); with app.app_context(): db.create_all()"

# Start backend
python app.py  # Runs on http://localhost:5000

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

---

## Viva Structure (Suggested 45-60 minutes)

### Opening (5 minutes)
1. Show the project running (both frontend and backend)
2. Give a 2-minute demo of core features
3. Explain the modular approach

### Member Presentations (10 minutes each, 40 minutes total)

---

## Member 1: Authentication & Emergency Creation

**Files to Show:**
- `backend/routes/member1_auth_routes.py`
- `backend/routes/member1_request_routes.py`
- `frontend/src/member1/index.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/CreateEmergency.jsx`

### Talking Points

1. **Authentication System**
   - Email validation with regex
   - Password strength enforcement (8 chars, uppercase, lowercase, digit)
   - JWT token generation with 24-hour expiry
   - Role-based registration (REQUESTER vs HELPER)
   - Login error handling (doesn't reveal if email exists)

2. **Emergency Request Creation**
   - Location-based emergency requests with coordinates
   - Emergency type enum (blood, ambulance, oxygen)
   - Urgency level (low, medium, high)
   - WebSocket broadcasting to all connected clients
   - Real-time helper notification

3. **Frontend Features**
   - React hooks for form state management
   - Google Maps integration for location detection
   - Toast notifications for user feedback
   - Responsive form validation
   - Smooth animations and transitions

### Live Demo Script
```
1. Go to /register page
2. Mark role as "helper"
3. Fill in form with password: "Test@1234"
4. Show error if password is weak
5. Successfully register
6. Go to /login page
7. Login with created credentials
8. Go to /create-emergency page (as requester)
9. Show map location picker
10. Create emergency with urgency level
11. Show WebSocket receives new_emergency_request event
```

### Key Code Sections to Highlight

**Backend - Email Validation**
```python
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
```

**Backend - JWT Token Generation**
```python
access_token = create_access_token(
    identity=str(user.id),
    expires_delta=timedelta(hours=24)
)
```

**Backend - Emergency Creation Route Decorator**
```python
@bp.route('/api/emergency/create', methods=['POST'])
@requester_required  # Only requesters can create
def create_emergency_request():
```

**Frontend - Location Detection**
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    setRequesterLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
  }
);
```

---

## Member 2: Role-Based Access & Search/Filtering

**Files to Show:**
- `backend/routes/member2_role_routes.py`
- `backend/routes/member2_filter_routes.py`
- `frontend/src/member2/index.jsx`
- `frontend/src/components/AvailabilityToggle.jsx`
- `frontend/src/pages/Dashboard.jsx` (filtering part)

### Talking Points

1. **Role-Based Access Control**
   - `@helper_required` decorator for protected endpoints
   - JWT identity extraction from token
   - Custom role validation
   - 403 Forbidden for unauthorized access
   - Clean error messages

2. **Availability Management**
   - Helper can toggle availability status
   - WebSocket broadcast to all clients (helper_availability_updated)
   - Profile update endpoint with field validation
   - Skills management (comma-separated)

3. **Search & Filtering**
   - Filter by emergency type (case-insensitive enum parsing)
   - Filter by status (PENDING, ACCEPTED, COMPLETED, CANCELLED)
   - Filter by date (YYYY-MM-DD format)
   - Role-specific views:
     - Requesters see: requests they created
     - Helpers see: requests assigned to them
   - Public endpoint for available helpers

4. **Frontend Features**
   - Availability toggle component with loading state
   - Filter dropdown selectors
   - Real-time helper list updates
   - Dashboard views for different roles

### Live Demo Script
```
1. Login as a helper
2. Show /dashboard → my assigned emergencies
3. Click toggle availability button
4. Show WebSocket receives helper_availability_updated
5. Go back to /login as requester
6. Login with requester account
7. Show filtering options on dashboard
8. Filter by "pending" emergencies
9. Filter by "blood" type
10. Show filtered results load correctly
11. Get all available helpers list
```

### Key Code Sections

**Backend - Role-Based Decorator**
```python
def helper_required(fn):
    @wraps(fn)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user: return jsonify({'error': 'User not found'}), 404
        if user.role != UserRole.HELPER: 
            return jsonify({'error': 'Helper role required'}), 403
        g.current_helper = user
        return fn(*args, **kwargs)
    return decorated
```

**Backend - Flexible Enum Parsing**
```python
def _parse_enum(enum_cls, raw_value):
    # Accepts "blood", "Blood", "BLOOD" → all parse correctly
    for member in enum_cls:
        if text.lower() == member.value.lower():
            return member
    return None
```

**Frontend - Availability Toggle**
```javascript
const toggleAvailability = async () => {
  const response = await axios.put('/api/helper/toggle-availability', {}, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setIsAvailable(response.data.is_available);
};
```

---

## Member 3: Emergency Management & Chat

**Files to Show:**
- `backend/routes/member3_management_routes.py`
- `backend/routes/member3_chat_routes.py`
- `backend/sockets/events.py` (WebSocket handlers)
- `frontend/src/member3/index.jsx`
- `frontend/src/pages/RequestDetails.jsx`
- `frontend/src/components/ChatBox.jsx`

### Talking Points

1. **Request Lifecycle Management**
   - Accept workflow: PENDING → ACCEPTED (helper assigned)
   - Reject workflow: PENDING → stays PENDING (for other helpers)
   - Complete workflow: ACCEPTED → COMPLETED
   - Cancel workflow (dual-role):
     - Requester: PENDING/ACCEPTED → CANCELLED
     - Helper: ACCEPTED → PENDING (reassign pool)
   - SMS notifications on state changes
   - Real-time WebSocket updates

2. **Chat System**
   - Real-time messaging via WebSocket
   - Message persistence in database
   - Chat history retrieval (oldest-first ordering)
   - Participant verification (only requester/helper can chat)
   - Sender identification (left/right bubble directions)

3. **State Machine Validation**
   - Only pending requests can be accepted
   - Only assigned helper can complete
   - Proper precondition checking on each operation

4. **Frontend Features**
   - Request detail page with full action suite
   - Accept/Reject buttons for pending requests
   - Complete/Cancel buttons for assigned requests
   - Real-time chat with message history
   - Status badges with animations
   - Two-column layout (details + chat)

### Live Demo Script
```
1. Login as helper
2. Go to /dashboard → see pending emergencies
3. Click "Accept" button on an emergency
4. Show WebSocket receives request_status_updated
5. Refresh page → status changed to "Accepted"
6. Go to /request/<id> (details page)
7. Show "Complete" and "Cancel" buttons
8. Open ChatBox component
9. Send a message as helper
10. Switch to requester account in another browser
11. Verify message received in real-time
12. Type response from requester
13. Show both messages in chat history
14. Go back to helper, click "Complete"
15. Show request marked as COMPLETED
16. Verify SMS was logged (check terminal)
```

### Key Code Sections

**Backend - Request Status Machine**
```python
@bp.route('/api/emergency/<int:request_id>/accept', methods=['PUT'])
@helper_required
def accept_emergency_request(request_id):
    emergency = EmergencyRequest.query.get(request_id)
    if emergency.status != EmergencyStatus.PENDING:
        return jsonify({'error': 'Only pending requests can be accepted'}), 400
    
    emergency.helper_id = helper.id
    emergency.status = EmergencyStatus.ACCEPTED
    emergency.accepted_at = datetime.utcnow()
    db.session.commit()
    
    # Broadcast to all connected clients
    socketio.emit('request_status_updated', {
        'request_id': emergency.id,
        'status': emergency.status.value,
        'helper_id': helper.id,
    })
```

**Backend - Dual-Role Cancel**
```python
if user.role == UserRole.REQUESTER:
    # Requester cancels own request
    emergency.status = EmergencyStatus.CANCELLED
elif user.role == UserRole.HELPER:
    # Helper reverts assignment back to pool
    emergency.status = EmergencyStatus.PENDING
    emergency.helper_id = None
```

**Frontend - WebSocket Chat Join**
```javascript
useEffect(() => {
  socket.emit('join_request', { request_id: requestId });
  socket.on('receive_message', (msg) => {
    setMessages(prev => [...prev, msg]);
  });
}, [socket, requestId]);
```

**Frontend - Accept Button Handler**
```javascript
const handleAccept = async () => {
  await axios.put(`/api/emergency/${request.id}/accept`, {}, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setRequest(prev => ({ ...prev, status: 'accepted' }));
};
```

---

## Member 4: Dashboard & History

**Files to Show:**
- `backend/routes/member4_misc_routes.py`
- `frontend/src/member4/index.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/NotificationHistory.jsx`
- `frontend/src/components/StatusTimeline.jsx`

### Talking Points

1. **Dashboard Analytics**
   - Dual views (Requester vs Helper)
   - Requester: Shows all requests they created with stats
   - Helper: Shows pending emergencies, assigned tasks, completed work
   - Statistics cards (counts by status)
   - Responsive grid layout
   - Filter options

2. **History Timeline**
   - View all emergencies user participated in
   - For each emergency:
     - Full request details
     - Complete message history
     - Status timeline (created → accepted → completed)
     - Elapsed time indicators
   - Chronologically ordered

3. **Real-Time Updates**
   - Dashboard refreshes when status changes
   - Message count updates
   - Availability changes reflected immediately

4. **Frontend Features**
   - Staggered animation reveals (70-280ms stagger)
   - Skeleton loading states
   - Status badges with color coding
     - Yellow: Pending
     - Blue: Accepted
     - Green: Completed
     - Red: Cancelled
   - Urgency level colors (red: high, orange: medium, green: low)
   - Responsive mobile layout

### Live Demo Script
```
1. Login as helper
2. Go to /dashboard
3. Show stats at top (Pending: 3, Assigned: 1, Completed: 5)
4. Show "Pending Emergencies" section with cards
5. Show "My Assigned Tasks" section
6. Go to /history
7. Show timeline view of all past emergencies
8. Click on an emergency to expand
9. Show messages thread inline
10. Show status timeline (Created → Accepted → Completed)
11. Switch to requester account
12. Go to /dashboard → see different stats
13. Go to /history → see all requester's requests
14. Explain how animations work (reduced-motion support)
```

### Key Code Sections

**Backend - User's Complete History**
```python
@bp.route('/api/notification/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    
    # Fetch requests where user is requester OR assigned helper
    requests = EmergencyRequest.query.filter(
        or_(
            EmergencyRequest.requester_id == user_id,
            EmergencyRequest.helper_id == user_id,
        )
    ).order_by(EmergencyRequest.created_at.desc()).all()
    
    # Return with messages and timeline
    return jsonify({'history': [
        {
            'request': req.to_dict(),
            'messages': [msg.to_dict() for msg in req.messages],
            'status_timeline': {
                'created_at': req.created_at.isoformat(),
                'accepted_at': req.accepted_at.isoformat() if req.accepted_at else None,
                'completed_at': req.completed_at.isoformat() if req.completed_at else None
            }
        }
        for req in requests
    ]})
```

**Frontend - Statistics Computation**
```javascript
const stats = {
  pending: emergencies.filter(r => r.status === 'pending').length,
  accepted: emergencies.filter(r => r.status === 'accepted').length,
  completed: emergencies.filter(r => r.status === 'completed').length,
};

return (
  <div className="grid grid-cols-3 gap-4">
    <StatsCard label="Pending" count={stats.pending} />
    <StatsCard label="Accepted" count={stats.accepted} />
    <StatsCard label="Completed" count={stats.completed} />
  </div>
);
```

**Frontend - Status Timeline**
```javascript
<StatusTimeline 
  createdAt={request.created_at}
  acceptedAt={request.accepted_at}
  completedAt={request.completed_at}
  status={request.status}
/>
```

---

## Project Structure Questions (Expected in Viva)

**Q: How is this project different from monolithic architecture?**
- A: Each member owns separate files with clear responsibility. No shared business logic between members. Changes in one member's code don't affect others.

**Q: Why separate models into different files?**
- A: Domain-driven design. User model (Member 1), Request model (Member 2), Message model (Member 3) are conceptually separate and can evolve independently.

**Q: How do blueprints ensure module isolation?**
- A: Each blueprint is a separate file that can be imported independently. Routes are self-contained with their own decorators and helpers.

**Q: Show me where Member X's code is?**
- A: All in `backend/routes/memberX_*.py` and `frontend/src/memberX/`. Clear file naming makes it obvious.

**Q: Can you test Member 2's features without Member 3?**
- A: Yes. Member 2 routes (filtering, role management) have no dependency on Member 3 (chat, request management). They can be tested independently.

**Q: Walk me through a complete emergency lifecycle?**
- A: 
  1. Requester (Member 1): Registers, logs in, creates emergency
  2. System: Broadcasts via WebSocket (Member 1)
  3. Helper (Member 2): Sees available emergencies, toggles availability
  4. Helper (Member 3): Accepts emergency
  5. System: Broadcasts status update, sends SMS
  6. Chat (Member 3): Helper and requester chat in real-time
  7. Helper (Member 3): Completes emergency
  8. History (Member 4): Both users can view in timeline

---

## Technology Stack

**Backend:**
- Flask 3.1.3 (Python web framework)
- Flask-SQLAlchemy 2.0.20 (ORM)
- Flask-JWT-Extended 4.5.2 (JWT authentication)
- Flask-SocketIO 5.3.4 (WebSocket support)
- Flask-CORS 4.0.0 (Cross-origin requests)
- Twilio 8.10.0 (SMS notifications)
- Gunicorn (Production server)

**Frontend:**
- React 18 (UI library)
- Vite 4.5 (Build tool)
- TailwindCSS 3.x (Styling)
- Axios (HTTP client)
- Socket.io-client (WebSocket client)
- React Router (Routing)
- React Hot Toast (Notifications)
- Lucide React (Icons)
- Google Maps API

**Database:**
- SQLite (Development)
- PostgreSQL (Production)

---

## Running Individual Tests

```bash
# Test Member 1 (Auth)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test@123","role":"requester","phone":"1234567890"}'

# Test Member 2 (Filters)
curl -X GET "http://localhost:5000/api/emergency/all?type=blood&status=pending" \
  -H "Authorization: Bearer <TOKEN>"

# Test Member 3 (Accept)
curl -X PUT http://localhost:5000/api/emergency/123/accept \
  -H "Authorization: Bearer <TOKEN>"

# Test Member 4 (History)
curl -X GET http://localhost:5000/api/notification/history \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Final Notes

- **Total API Endpoints**: 20+
- **Backend Routes**: 8 member-specific files
- **Frontend Components**: 4 member folders
- **Database Models**: 3 domain-specific files
- **Build Status**: ✓ Frontend builds successfully
- **App Status**: ✓ Backend app initializes correctly
- **No Breaking Changes**: All original routes work alongside new modular routes

---

## Presenter Tips

1. **Know your member's code**: Practice explaining your specific files
2. **Be ready for drill-down questions**: Examiners may ask about specific functions
3. **Test the demo beforehand**: Make sure endpoints work before viva
4. **Show both backend and frontend**: Demonstrate integration
5. **Explain design decisions**: Why separate files? Why this structure?
6. **Handle errors gracefully**: If something breaks, explain it confidently
7. **Prepare backup demos**: Have screenshots/videos if live demo fails

---

Good luck with your viva! 🚀
