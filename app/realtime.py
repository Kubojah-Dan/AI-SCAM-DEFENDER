import json
import asyncio
from datetime import datetime
from typing import Dict, List, Set
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models_db import User, ThreatReport, UserFeedback, db

# Initialize SocketIO
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')

# Store active connections and rooms
active_users: Dict[str, Dict] = {}
team_rooms: Dict[str, Set[str]] = {}
incident_subscribers: Set[str] = set()
intelligence_subscribers: Set[str] = set()

class RealtimeManager:
    def __init__(self):
        self.active_connections = {}
        self.team_chats = {}
        self.incident_updates = {}
        self.intelligence_updates = {}
        
    def broadcast_to_team(self, team_id: str, event: str, data: dict):
        """Broadcast message to all team members"""
        if team_id in team_rooms:
            socketio.emit(event, data, room=team_id)
    
    def broadcast_incident(self, incident_data: dict):
        """Broadcast incident update to all subscribers"""
        socketio.emit('incident_update', incident_data, room='incidents')
    
    def broadcast_intelligence(self, intel_data: dict):
        """Broadcast intelligence update to all subscribers"""
        socketio.emit('intelligence_update', intel_data, room='intelligence')
    
    def update_user_presence(self, user_id: str, status: str):
        """Update user presence and broadcast to team"""
        if user_id in active_users:
            active_users[user_id]['status'] = status
            active_users[user_id]['last_seen'] = datetime.utcnow()
            
            # Broadcast to team room
            user_team = active_users[user_id].get('team_id')
            if user_team:
                socketio.emit('user_status_update', {
                    'user_id': user_id,
                    'status': status,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=user_team)

# Global manager instance
rt_manager = RealtimeManager()

@socketio.on('connect')
def handle_connect():
    """Handle new WebSocket connection"""
    print(f"Client connected: {request.sid}")
    
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
    
    if user_id:
        rt_manager.update_user_presence(user_id, 'offline')
        del active_users[user_id]

@socketio.on('authenticate')
@jwt_required()
def handle_authenticate(data):
    """Authenticate WebSocket connection"""
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
        
        # Broadcast user online status
        rt_manager.update_user_presence(user_id, 'online')
    else:
        emit('authenticated', {'success': False})

@socketio.on('join_team')
def handle_join_team(data):
    """Join a team chat room"""
    team_id = data.get('team_id')
    user_id = data.get('user_id')
    
    if team_id and user_id:
        leave_room('default')  # Leave default room
        join_room(team_id)
        
        if team_id not in team_rooms:
            team_rooms[team_id] = set()
        team_rooms[team_id].add(request.sid)
        
        # Update user's team
        if user_id in active_users:
            active_users[user_id]['team_id'] = team_id
        
        emit('joined_team', {'team_id': team_id})
        
        # Send current team members
        team_members = [
            {'user_id': uid, **user_data}
            for uid, user_data in active_users.items()
            if user_data.get('team_id') == team_id
        ]
        emit('team_members', team_members)

@socketio.on('send_message')
def handle_send_message(data):
    """Handle chat message"""
    user_id = data.get('user_id')
    team_id = data.get('team_id')
    message = data.get('message')
    
    if user_id and team_id and message:
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
        rt_manager.broadcast_to_team(team_id, 'new_message', message_data)

@socketio.on('typing_start')
def handle_typing_start(data):
    """Handle typing indicator start"""
    user_id = data.get('user_id')
    team_id = data.get('team_id')
    
    if user_id and team_id:
        user_data = active_users.get(user_id, {})
        rt_manager.broadcast_to_team(team_id, 'user_typing', {
            'user_id': user_id,
            'user_name': user_data.get('name', 'Unknown'),
            'is_typing': True
        })

@socketio.on('typing_stop')
def handle_typing_stop(data):
    """Handle typing indicator stop"""
    user_id = data.get('user_id')
    team_id = data.get('team_id')
    
    if user_id and team_id:
        user_data = active_users.get(user_id, {})
        rt_manager.broadcast_to_team(team_id, 'user_typing', {
            'user_id': user_id,
            'user_name': user_data.get('name', 'Unknown'),
            'is_typing': False
        })

@socketio.on('share_threat')
def handle_share_threat(data):
    """Handle threat sharing with team"""
    user_id = data.get('user_id')
    team_id = data.get('team_id')
    threat_data = data.get('threat')
    
    if user_id and team_id and threat_data:
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
        rt_manager.broadcast_to_team(team_id, 'threat_shared', shared_threat)

@socketio.on('subscribe_incidents')
def handle_subscribe_incidents():
    """Subscribe to incident updates"""
    join_room('incidents')
    incident_subscribers.add(request.sid)
    emit('subscribed', {'channel': 'incidents'})

@socketio.on('subscribe_intelligence')
def handle_subscribe_intelligence():
    """Subscribe to intelligence updates"""
    join_room('intelligence')
    intelligence_subscribers.add(request.sid)
    emit('subscribed', {'channel': 'intelligence'})

# Helper functions for external use
def broadcast_new_threat_report(threat_report: ThreatReport):
    """Broadcast new threat report to all subscribers"""
    rt_manager.broadcast_intelligence({
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
    })

def broadcast_incident_update(incident_data: dict):
    """Broadcast incident update to all subscribers"""
    rt_manager.broadcast_incident({
        'type': 'incident_update',
        'data': incident_data
    })

def broadcast_workflow_execution(workflow_data: dict):
    """Broadcast workflow execution to subscribers"""
    rt_manager.broadcast_incident({
        'type': 'workflow_executed',
        'data': workflow_data
    })

def broadcast_intelligence_update(intel_data: dict):
    """Broadcast intelligence update to all subscribers"""
    rt_manager.broadcast_intelligence({
        'type': 'intelligence_update',
        'data': intel_data
    })

# Initialize team chats storage
team_chats = {}
