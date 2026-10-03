from datetime import datetime


class IncomeModel:
    """Represents the shape of an income document stored in MongoDB."""

    def __init__(self, user_id: str, source: str, amount: float,
                 note: str = "", date: datetime = None):
        self.user_id = user_id
        self.source = source
        self.amount = amount
        self.note = note
        self.date = date or datetime.utcnow()
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "source": self.source,
            "amount": self.amount,
            "note": self.note,
            "date": self.date,
            "created_at": self.created_at,
        }
