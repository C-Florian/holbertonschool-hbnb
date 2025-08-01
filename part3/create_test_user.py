from app import create_app, db
from config import DevelopmentConfig
from app.models.user import User  # adapte ce chemin si nécessaire

app = create_app(DevelopmentConfig)

with app.app_context():
    db.create_all()  # crée les tables si ce n’est pas déjà fait

    # Vérifie si l'utilisateur existe déjà
    existing = User.query.filter_by(email="admin@example.com").first()
    if existing:
        print("User already exists.")
    else:
        user = User(
            first_name="Admin",
            last_name="Test",
            phone_number="0600000000",
            email="admin@example.com",
            password="admin123",
            is_admin=True
        )
        user.set_password("admin123")
        db.session.add(user)
        db.session.commit()
        print("Test user created.")
