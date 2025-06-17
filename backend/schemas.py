from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

def round_currency(value: float) -> float:
    """Round a monetary value to exactly 2 decimal places"""
    if value is None:
        return None
    decimal_value = Decimal(str(value))
    rounded_decimal = decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return float(rounded_decimal)

# User schemas
class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Group schemas
class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    user_ids: List[int]

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    user_ids: Optional[List[int]] = None

class AddMembersRequest(BaseModel):
    user_ids: List[int]

class Group(GroupBase):
    id: int
    created_at: datetime
    members: List[User]
    
    class Config:
        from_attributes = True

class GroupDetail(Group):
    total_expenses: float
    
    @validator('total_expenses')
    def round_total_expenses(cls, v):
        return round_currency(v)

# Expense schemas
class ExpenseSplitBase(BaseModel):
    user_id: int
    amount: Optional[float] = None
    percentage: Optional[float] = None
    
    @validator('amount')
    def round_amount(cls, v):
        return round_currency(v) if v is not None else v

class ExpenseSplitCreate(ExpenseSplitBase):
    pass

class ExpenseSplit(ExpenseSplitBase):
    id: int
    user: User
    
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    description: str
    amount: float
    split_type: str  # 'equal' or 'percentage'
    
    @validator('amount')
    def round_amount(cls, v):
        return round_currency(v)

class ExpenseCreate(ExpenseBase):
    paid_by: int
    splits: List[ExpenseSplitCreate]

class Expense(ExpenseBase):
    id: int
    group_id: int
    paid_by: int
    paid_by_user: User
    splits: List[ExpenseSplit]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Balance schemas
class Balance(BaseModel):
    user_id: int
    user_name: str
    group_id: Optional[int] = None
    group_name: Optional[str] = None
    owes_to: List[dict]  # List of {user_id, user_name, amount}
    owed_by: List[dict]  # List of {user_id, user_name, amount}
    net_balance: float
    
    @validator('net_balance')
    def round_net_balance(cls, v):
        return round_currency(v)

# Settlement schemas
class SettlementCreate(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: float
    group_id: int
    description: Optional[str] = "Settlement"
    
    @validator('amount')
    def round_amount(cls, v):
        return round_currency(v)

class Settlement(BaseModel):
    id: int
    from_user_id: int
    to_user_id: int
    amount: float
    group_id: int
    description: str
    created_at: datetime
    
    class Config:
        from_attributes = True
