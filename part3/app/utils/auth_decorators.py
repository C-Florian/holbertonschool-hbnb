from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from functools import wraps
from app.services import facade

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return {'error': 'Token required'}, 401
            
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
        except Exception as e:
            return {'error': 'Token required'}, 401
        
        claims = get_jwt()
        current_user_id = get_jwt_identity()
        
        if claims.get('is_admin'):
            return f(*args, **kwargs)
        
        user = facade.get_user(current_user_id)
        if not user or not user.is_admin:
            return {'error': 'Administrator access required'}, 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def owner_or_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
        except Exception as e:
            return {'error': 'Token required'}, 401
        
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        if claims.get('is_admin'):
            return f(*args, **kwargs)

        current_user = facade.get_user(current_user_id)
        if not current_user:
            return {'error': 'User not found'}, 404

        if current_user.is_admin:
            return f(*args, **kwargs)
        
        resource_id = kwargs.get('user_id') or kwargs.get('place_id') or kwargs.get('review_id')
        if resource_id:
            if 'user_id' in kwargs and kwargs['user_id'] == current_user_id:
                return f(*args, **kwargs)
            elif 'place_id' in kwargs:
                place = facade.get_place(kwargs['place_id'])
                if place and place.owner_id == current_user_id:
                    return f(*args, **kwargs)
            elif 'review_id' in kwargs:
                review = facade.get_review(kwargs['review_id'])
                if review and review.user_id == current_user_id:
                    return f(*args, **kwargs)
        
        return {'error': 'Access denied. You must be the owner or an administrator'}, 403
    
    return decorated_function

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
        except Exception as e:
            return {'error': 'Token required'}, 401
        
        return f(*args, **kwargs)
    
    return decorated_function