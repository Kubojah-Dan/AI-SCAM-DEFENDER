import json
from datetime import datetime
from typing import Dict, Set
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models_db import User, ThreatReport, UserFeedback, db

# Initialize SocketIO
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

# Store active connections and rooms
active_users: Dict[str, Dict] = {}
team_rooms: Dict[str, Set[str]] = {}

@socketio.on('connect')
def handle_connect():
    """Handle new WebSocket connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to Scam Defender real-time services'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    print(f"Client disconnected: {request.sid}")
    
    # Remove from active users
    user_id = None
    for uid, user_data in active_users.items():
        if user_data.get('sid') == request.sid:
            user_id = uid
            break
    
    if user_id and user_id in active_users:
        del active_users[user_id]

@socketio.on('authenticate')
@jwt_required()
def handle_authenticate(data):
    """Authenticate WebSocket connection"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user:
            active_users[user_id] = {
                'sid': request.sid,
                'user_id': user_id,
                'name': user.full_name,
                'email': user.email,
                'status': 'online',
                'last_seen': datetime.utcnow(),
                'team_id': data.get('team_id', 'default')
            }
            
            emit('authenticated', {
                'success': True,
                'user_id': user_id,
                'name': user.full_name
            })
            
            # Join team room
            team_id = active_users[user_id]['team_id']
            join_room(team_id)
            if team_id not in team_rooms:
                team_rooms[team_id] = set()
            team_rooms[team_id].add(request.sid)
            
            print(f"User {user.full_name} authenticated and joined team {team_id}")
        else:
            emit('authenticated', {'success': False})
    except Exception as e:
        print(f"Authentication error: {e}")
        emit('authenticated', {'success': False, 'error': str(e)})

@socketio.on('send_message')
def handle_send_message(data):
    """Handle chat message"""
    try:
        user_id = data.get('user_id')
        team_id = data.get('team_id', 'default')
        message = data.get('message')
        
        if user_id and message:
            user_data = active_users.get(user_id, {})
            
            message_data = {
                'id': len(team_chats.get(team_id, [])) + 1,
                'user_id': user_id,
                'user_name': user_data.get('name', 'Unknown'),
                'message': message,
                'timestamp': datetime.utcnow().isoformat(),
                'type': data.get('type', 'general')
            }
            
            # Store message
            if team_id not in team_chats:
                team_chats[team_id] = []
            team_chats[team_id].append(message_data)
            
            # Broadcast to team
            emit('new_message', message_data, room=team_id)
            print(f"Message from {user_data.get('name')} in team {team_id}")
    except Exception as e:
        print(f"Message error: {e}")

@socketio.on('typing_start')
def handle_typing_start(data):
    """Handle typing indicator start"""
    try:
        user_id = data.get('user_id')
        team_id = data.get('team_id', 'default')
        
        if user_id and team_id:
            user_data = active_users.get(user_id, {})
            emit('user_typing', {
                'user_id': user_id,
                'user_name': user_data.get('name', 'Unknown'),
                'is_typing': True
            }, room=team_id)
    except Exception as e:
        print(f"Typing start error: {e}")

@socketio.on('typing_stop')
def handle_typing_stop(data):
    """Handle typing indicator stop"""
    try:
        user_id = data.get('user_id')
        team_id = data.get('team_id', 'default')
        
        if user_id and team_id:
            user_data = active_users.get(user_id, {})
            emit('user_typing', {
                'user_id': user_id,
                'user_name': user_data.get('name', 'Unknown'),
                'is_typing': False
            }, room=team_id)
    except Exception as e:
        print(f"Typing stop error: {e}")

@socketio.on('share_threat')
def handle_share_threat(data):
    """Handle threat sharing with team"""
    try:
        user_id = data.get('user_id')
        team_id = data.get('team_id', 'default')
        threat_data = data.get('threat')
        
        if user_id and threat_data:
            user_data = active_users.get(user_id, {})
            
            shared_threat = {
                'id': len(team_chats.get(team_id, [])) + 1,
                'title': threat_data.get('title'),
                'type': threat_data.get('type'),
                'severity': threat_data.get('severity'),
                'shared_by': user_data.get('name', 'Unknown'),
                'shared_at': datetime.utcnow().isoformat(),
                'description': threat_data.get('description'),
                'iocs': threat_data.get('iocs', [])
            }
            
            # Broadcast to team
            emit('threat_shared', shared_threat, room=team_id)
            print(f"Threat shared by {user_data.get('name')}")
    except Exception as e:
        print(f"Threat share error: {e}")

@socketio.on('subscribe_incidents')
def handle_subscribe_incidents():
    """Subscribe to incident updates"""
    try:
        join_room('incidents')
        emit('subscribed', {'channel': 'incidents'})
        print(f"Client {request.sid} subscribed to incidents")
    except Exception as e:
        print(f"Subscribe incidents error: {e}")

@socketio.on('subscribe_intelligence')
def handle_subscribe_intelligence():
    """Subscribe to intelligence updates"""
    try:
        join_room('intelligence')
        emit('subscribed', {'channel': 'intelligence'})
        print(f"Client {request.sid} subscribed to intelligence")
    except Exception as e:
        print(f"Subscribe intelligence error: {e}")

# Initialize team chats storage
team_chats = {}

# Helper functions for external use
def broadcast_new_threat_report(threat_report: ThreatReport):
    """Broadcast new threat report to all subscribers"""
    try:
        data = {
            'type': 'new_threat_report',
            'data': {
                'id': threat_report.id,
                'content_type': threat_report.content_type,
                'content': threat_report.content,
                'status': threat_report.status,
                'report_count': threat_report.report_count,
                'is_urgent': threat_report.is_urgent,
                'reported_at': threat_report.created_at.isoformat(),
                'reporter': threat_report.reporter_name
            }
        }
        socketio.emit('intelligence_update', data, room='intelligence')
        print(f"Broadcasted new threat report: {threat_report.id}")
    except Exception as e:
        print(f"Broadcast threat report error: {e}")

def broadcast_incident_update(incident_data: dict):
    """Broadcast incident update to all subscribers"""
    try:
        data = {
            'type': 'incident_update',
            'data': incident_data
        }
        socketio.emit('incident_update', data, room='incidents')
        print(f"Broadcasted incident update")
    except Exception as e:
        print(f"Broadcast incident error: {e}")

def broadcast_intelligence_update(intel_data: dict):
    """Broadcast intelligence update to all subscribers"""
    try:
        data = {
            'type': 'intelligence_update',
            'data': intel_data
        }
        socketio.emit('intelligence_update', data, room='intelligence')
        print(f"Broadcasted intelligence update")
    except Exception as e:
        print(f"Broadcast intelligence error: {e}")

def get_socketio_instance():
    """Get the SocketIO instance"""
    return socketio
