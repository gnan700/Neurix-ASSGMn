from sqlalchemy.orm import Session
from models import User, Group, Expense, ExpenseSplit, Settlement
import schemas
from typing import List, Dict
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
import math

def round_currency(value: float) -> float:
    """Round a monetary value to exactly 2 decimal places using proper rounding"""
    # Convert to Decimal for precise rounding, then back to float
    decimal_value = Decimal(str(value))
    rounded_decimal = decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return float(rounded_decimal)

def is_effectively_zero(value: float, tolerance: float = 0.02) -> bool:
    """Check if a floating-point value is effectively zero within tolerance"""
    return abs(value) < tolerance

def create_user(db: Session, user: schemas.UserCreate):
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = Group(name=group.name, description=group.description)
    
    # Add members
    for user_id in group.user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db_group.members.append(user)
    
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def get_group(db: Session, group_id: int):
    return db.query(Group).filter(Group.id == group_id).first()

def get_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Group).offset(skip).limit(limit).all()

def create_expense(db: Session, group_id: int, expense: schemas.ExpenseCreate):
    # Validate mathematical consistency
    if not validate_expense_mathematical_consistency(db, group_id, expense.amount, expense.splits):
        raise ValueError("Expense splits do not add up to total amount or percentages do not equal 100%")
    
    # Round the main expense amount
    expense.amount = round_currency(expense.amount)
    
    db_expense = Expense(
        description=expense.description,
        amount=expense.amount,
        group_id=group_id,
        paid_by=expense.paid_by,
        split_type=expense.split_type
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
      # Create expense splits
    if expense.split_type == "equal":
        # Equal split among all group members
        group = db.query(Group).filter(Group.id == group_id).first()
        num_members = len(group.members)
        base_amount = round_currency(expense.amount / num_members)
        
        # Calculate total to see if there's a remainder due to rounding
        total_base = base_amount * num_members
        remainder = round_currency(expense.amount - total_base)
        
        for i, member in enumerate(group.members):
            # Give the remainder to the first member to ensure exact total
            amount = base_amount
            if i == 0:
                amount = round_currency(base_amount + remainder)
            
            split = ExpenseSplit(
                expense_id=db_expense.id,
                user_id=member.id,
                amount=amount
            )
            db.add(split)
    
    elif expense.split_type == "percentage":
        # Percentage-based split
        for split_data in expense.splits:
            amount = round_currency((split_data.percentage / 100) * expense.amount)
            split = ExpenseSplit(
                expense_id=db_expense.id,
                user_id=split_data.user_id,
                amount=amount,
                percentage=split_data.percentage
            )
            db.add(split)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_group_expenses(db: Session, group_id: int):
    return db.query(Expense).filter(Expense.group_id == group_id).all()

def calculate_group_balances(db: Session, group_id: int) -> List[schemas.Balance]:
    """Calculate who owes whom in a group"""
    expenses = db.query(Expense).filter(Expense.group_id == group_id).all()
    settlements = db.query(Settlement).filter(Settlement.group_id == group_id).all()
    group = db.query(Group).filter(Group.id == group_id).first()
    
    # Track net balances using precise decimal arithmetic
    net_balances = defaultdict(float)
    
    # Add expenses
    for expense in expenses:
        # Person who paid has positive balance
        net_balances[expense.paid_by] += expense.amount
        
        # People who owe have negative balance
        for split in expense.splits:
            net_balances[split.user_id] -= split.amount
    
    # Subtract settlements (reverse the debt relationship)
    for settlement in settlements:
        # When someone pays a settlement, it reduces their debt
        # so we add to their balance (making it less negative or more positive)
        net_balances[settlement.from_user_id] += settlement.amount
        # The person receiving payment has their credit reduced
        # so we subtract from their balance (making it less positive)
        net_balances[settlement.to_user_id] -= settlement.amount
    
    # Calculate simplified debts between users
    balances = []
    for member in group.members:
        user_balance = round_currency(net_balances[member.id])
        
        # If balance is effectively zero, set it to exactly zero
        if is_effectively_zero(user_balance):
            user_balance = 0.0
        
        owes_to = []
        owed_by = []
        
        # Find who this user owes money to or who owes them
        if user_balance < 0:
            # This user owes money - find who they should pay
            # For simplicity, they owe to the person with the highest positive balance
            creditors = [(other_member.id, other_member.name, round_currency(net_balances[other_member.id])) 
                        for other_member in group.members 
                        if round_currency(net_balances[other_member.id]) > 0]
            
            if creditors:
                # Sort by amount owed (highest first)
                creditors.sort(key=lambda x: x[2], reverse=True)
                top_creditor = creditors[0]
                owes_to.append({
                    "user_id": top_creditor[0],
                    "user_name": top_creditor[1],
                    "amount": abs(user_balance)
                })
        
        elif user_balance > 0:
            # This user is owed money - find who should pay them
            debtors = [(other_member.id, other_member.name, round_currency(net_balances[other_member.id])) 
                      for other_member in group.members 
                      if round_currency(net_balances[other_member.id]) < 0]
            
            if debtors:
                # Sort by debt amount (highest debt first)
                debtors.sort(key=lambda x: x[2])
                top_debtor = debtors[0]
                owed_by.append({
                    "user_id": top_debtor[0],
                    "user_name": top_debtor[1],
                    "amount": user_balance
                })
        
        balances.append(schemas.Balance(
            user_id=member.id,
            user_name=member.name,
            group_id=group.id,
            group_name=group.name,
            owes_to=owes_to,
            owed_by=owed_by,
            net_balance=user_balance
        ))
    
    return balances

def calculate_user_balances(db: Session, user_id: int) -> List[schemas.Balance]:
    """Calculate all balances for a user across all groups"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    all_balances = []
    for group in user.groups:
        group_balances = calculate_group_balances(db, group.id)
        user_balance = next((b for b in group_balances if b.user_id == user_id), None)
        if user_balance:
            all_balances.append(user_balance)
    
    return all_balances

def create_settlement(db: Session, settlement: schemas.SettlementCreate):
    """Create a new settlement between users"""
    # Round the settlement amount
    settlement.amount = round_currency(settlement.amount)
    
    db_settlement = Settlement(**settlement.dict())
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

def get_group_settlements(db: Session, group_id: int):
    """Get all settlements for a group"""
    return db.query(Settlement).filter(Settlement.group_id == group_id).all()

# Group management functions
def update_group(db: Session, group_id: int, group_update: schemas.GroupUpdate):
    """Update a group"""
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        return None
    
    update_data = group_update.dict(exclude_unset=True)
    user_ids = update_data.pop('user_ids', None)
    
    # Update basic fields
    for field, value in update_data.items():
        setattr(db_group, field, value)
    
    # Update members if provided
    if user_ids is not None:
        db_group.members.clear()
        for user_id in user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                db_group.members.append(user)
    
    db.commit()
    db.refresh(db_group)
    return db_group

def delete_group(db: Session, group_id: int):
    """Delete a group"""
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if db_group:
        # Delete related records in the correct order to respect foreign key constraints
        
        # First, delete expense splits for expenses in this group
        expense_ids = db.query(Expense.id).filter(Expense.group_id == group_id).all()
        expense_ids = [exp_id[0] for exp_id in expense_ids]
        
        if expense_ids:
            db.query(ExpenseSplit).filter(ExpenseSplit.expense_id.in_(expense_ids)).delete(synchronize_session=False)
        
        # Then delete expenses
        db.query(Expense).filter(Expense.group_id == group_id).delete(synchronize_session=False)
        
        # Delete settlements
        db.query(Settlement).filter(Settlement.group_id == group_id).delete(synchronize_session=False)
        
        # Finally delete the group
        db.delete(db_group)
        db.commit()
        return True
    return False

def add_members_to_group(db: Session, group_id: int, user_ids: List[int]):
    """Add members to a group"""
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        return None
    
    for user_id in user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user not in db_group.members:
            db_group.members.append(user)
    
    db.commit()
    db.refresh(db_group)
    return db_group

def remove_member_from_group(db: Session, group_id: int, user_id: int):
    """Remove a member from a group"""
    db_group = db.query(Group).filter(Group.id == group_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if db_group and user and user in db_group.members:
        db_group.members.remove(user)
        db.commit()
        db.refresh(db_group)
        return True
    return False

# User management functions
def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """Update a user"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    """Delete a user"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        # Remove user from all groups
        for group in db_user.groups:
            group.members.remove(db_user)
        
        # Delete related records in the correct order to respect foreign key constraints
        
        # First, delete expense splits for this user
        db.query(ExpenseSplit).filter(ExpenseSplit.user_id == user_id).delete(synchronize_session=False)
        
        # Get expenses paid by this user and delete their splits
        expense_ids = db.query(Expense.id).filter(Expense.paid_by == user_id).all()
        expense_ids = [exp_id[0] for exp_id in expense_ids]
        
        if expense_ids:
            db.query(ExpenseSplit).filter(ExpenseSplit.expense_id.in_(expense_ids)).delete(synchronize_session=False)
        
        # Then delete expenses paid by this user
        db.query(Expense).filter(Expense.paid_by == user_id).delete(synchronize_session=False)
        
        # Delete settlements involving this user
        db.query(Settlement).filter(
            (Settlement.from_user_id == user_id) | (Settlement.to_user_id == user_id)
        ).delete(synchronize_session=False)
        
        # Finally delete the user
        db.delete(db_user)
        db.commit()
        return True
    return False

def validate_expense_mathematical_consistency(db: Session, group_id: int, expense_amount: float, splits: List[schemas.ExpenseSplitCreate]) -> bool:
    """Validate that expense splits add up to the total amount"""
    if not splits:
        return True  # Equal split will be handled correctly
    
    total_split_amount = sum(split.amount or 0 for split in splits)
    total_split_percentage = sum(split.percentage or 0 for split in splits)
    
    # For percentage splits, check if percentages add up to 100%
    if any(split.percentage is not None for split in splits):
        if abs(total_split_percentage - 100.0) > 0.01:
            return False
        
        # Calculate actual amounts from percentages
        calculated_total = sum((split.percentage / 100) * expense_amount for split in splits)
        if abs(calculated_total - expense_amount) > 0.02:
            return False
    
    # For manual amount splits, check if amounts add up to total
    elif any(split.amount is not None for split in splits):
        if abs(total_split_amount - expense_amount) > 0.02:
            return False
    
    return True
