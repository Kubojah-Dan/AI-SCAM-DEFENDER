from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

test_api_bp = Blueprint('test_api', __name__)

@test_api_bp.route("/test", methods=["GET"])
def test_endpoint():
    """Simple test endpoint"""
    return jsonify({
        "message": "Backend is working!",
        "status": "success",
        "timestamp": "2024-01-01T00:00:00Z"
    })

@test_api_bp.route("/test-auth", methods=["GET"])
@jwt_required()
def test_auth_endpoint():
    """Test authenticated endpoint"""
    return jsonify({
        "message": "Authentication is working!",
        "status": "success",
        "authenticated": True
    })
