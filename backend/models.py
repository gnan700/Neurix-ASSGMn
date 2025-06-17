from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Association table for group members
group_members = Table(
    'group_members',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('groups.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    groups = relationship("Group", secondary=group_members, back_populates="members")
    paid_expenses = relationship("Expense", back_populates="paid_by_user")
    expense_splits = relationship("ExpenseSplit", back_populates="user")

class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    members = relationship("User", secondary=group_members, back_populates="groups")
    expenses = relationship("Expense", back_populates="group")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"))
    paid_by = Column(Integer, ForeignKey("users.id"))
    split_type = Column(String, nullable=False)  # 'equal' or 'percentage'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    group = relationship("Group", back_populates="expenses")
    paid_by_user = relationship("User", back_populates="paid_expenses")
    splits = relationship("ExpenseSplit", back_populates="expense")

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    percentage = Column(Float)  # Only used for percentage splits
    
    # Relationships
    expense = relationship("Expense", back_populates="splits")
    user = relationship("User", back_populates="expense_splits")

class Settlement(Base):
    __tablename__ = "settlements"
    
    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"))
    to_user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"))
    description = Column(String, default="Settlement")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
    group = relationship("Group")
