from datetime import datetime


class ExpenseModel:
    """Represents the shape of an expense document stored in MongoDB."""

    def __init__(self, user_id: str, title: str, amount: float, category: str,
                 note: str = "", date: datetime = None):
        self.user_id = user_id
        self.title = title
        self.amount = amount
        self.category = category
        self.note = note
        self.date = date or datetime.utcnow()
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "title": self.title,
            "amount": self.amount,
            "category": self.category,
            "note": self.note,
            "date": self.date,
            "created_at": self.created_at,
        }
