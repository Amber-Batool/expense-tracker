from datetime import datetime


class UserModel:
    """Represents the shape of a user document stored in MongoDB."""

    def __init__(self, name: str, email: str, hashed_password: str):
        self.name = name
        self.email = email
        self.hashed_password = hashed_password
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "name": self.name,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "created_at": self.created_at,
        }
