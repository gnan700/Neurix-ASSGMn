from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

import crud
import models
import schemas
from database import SessionLocal, engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Splitwise Clone API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User endpoints
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.get("/users/{user_id}/balances", response_model=List[schemas.Balance])
def get_user_balances(user_id: int, db: Session = Depends(get_db)):
    return crud.calculate_user_balances(db, user_id=user_id)

# Group endpoints
@app.post("/groups/", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    return crud.create_group(db=db, group=group)

@app.get("/groups/", response_model=List[schemas.GroupDetail])
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    groups = crud.get_groups(db, skip=skip, limit=limit)
    group_details = []
    
    for group in groups:
        # Calculate total expenses for each group
        expenses = crud.get_group_expenses(db, group_id=group.id)
        total_expenses = crud.round_currency(sum(expense.amount for expense in expenses))
        
        group_detail = schemas.GroupDetail(
            id=group.id,
            name=group.name,
            description=group.description,
            created_at=group.created_at,
            members=group.members,
            total_expenses=total_expenses
        )
        group_details.append(group_detail)
    
    return group_details

@app.get("/groups/{group_id}", response_model=schemas.GroupDetail)
def read_group(group_id: int, db: Session = Depends(get_db)):
    db_group = crud.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
      # Calculate total expenses
    expenses = crud.get_group_expenses(db, group_id=group_id)
    total_expenses = crud.round_currency(sum(expense.amount for expense in expenses))
    
    group_detail = schemas.GroupDetail(
        id=db_group.id,
        name=db_group.name,
        description=db_group.description,
        created_at=db_group.created_at,
        members=db_group.members,
        total_expenses=total_expenses
    )
    return group_detail

@app.get("/groups/{group_id}/balances", response_model=List[schemas.Balance])
def get_group_balances(group_id: int, db: Session = Depends(get_db)):
    return crud.calculate_group_balances(db, group_id=group_id)

# Expense endpoints
@app.post("/groups/{group_id}/expenses", response_model=schemas.Expense)
def create_expense(
    group_id: int, 
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db)
):
    # Validate group exists
    db_group = crud.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
      # Validate paid_by user is in the group
    if not any(member.id == expense.paid_by for member in db_group.members):
        raise HTTPException(status_code=400, detail="User who paid is not in the group")
    
    try:
        return crud.create_expense(db=db, group_id=group_id, expense=expense)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/groups/{group_id}/expenses", response_model=List[schemas.Expense])
def get_group_expenses(group_id: int, db: Session = Depends(get_db)):
    return crud.get_group_expenses(db, group_id=group_id)

# Settlement endpoints
@app.post("/settlements/", response_model=schemas.Settlement)
def create_settlement(
    settlement: schemas.SettlementCreate,
    db: Session = Depends(get_db)
):
    return crud.create_settlement(db=db, settlement=settlement)

@app.get("/groups/{group_id}/settlements", response_model=List[schemas.Settlement])
def get_group_settlements(group_id: int, db: Session = Depends(get_db)):
    return crud.get_group_settlements(db, group_id=group_id)

# Group management endpoints
@app.put("/groups/{group_id}", response_model=schemas.GroupDetail)
def update_group(group_id: int, group_update: schemas.GroupUpdate, db: Session = Depends(get_db)):
    db_group = crud.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    updated_group = crud.update_group(db=db, group_id=group_id, group_update=group_update)
    
    # Calculate total expenses
    expenses = crud.get_group_expenses(db, group_id=group_id)
    total_expenses = crud.round_currency(sum(expense.amount for expense in expenses))
    
    group_detail = schemas.GroupDetail(
        id=updated_group.id,
        name=updated_group.name,
        description=updated_group.description,
        created_at=updated_group.created_at,
        members=updated_group.members,
        total_expenses=total_expenses
    )
    return group_detail

@app.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    db_group = crud.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")    # Check if group has outstanding balances
    balances = crud.calculate_group_balances(db, group_id=group_id)
    has_outstanding_balances = any(not crud.is_effectively_zero(balance.net_balance) for balance in balances)
    
    if has_outstanding_balances:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete group with outstanding balances. Please settle all debts first."
        )
    
    crud.delete_group(db=db, group_id=group_id)
    return {"message": "Group deleted successfully"}

@app.post("/groups/{group_id}/members", response_model=schemas.GroupDetail)
def add_member_to_group(group_id: int, request: schemas.AddMembersRequest, db: Session = Depends(get_db)):
    db_group = crud.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    updated_group = crud.add_members_to_group(db=db, group_id=group_id, user_ids=request.user_ids)
    
    # Calculate total expenses
    expenses = crud.get_group_expenses(db, group_id=group_id)
    total_expenses = crud.round_currency(sum(expense.amount for expense in expenses))
    
    group_detail = schemas.GroupDetail(
        id=updated_group.id,
        name=updated_group.name,
        description=updated_group.description,
        created_at=updated_group.created_at,
        members=updated_group.members,
        total_expenses=total_expenses
    )
    return group_detail

@app.delete("/groups/{group_id}/members/{user_id}")
def remove_member_from_group(group_id: int, user_id: int, db: Session = Depends(get_db)):
    db_group = crud.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user has outstanding balances in this group
    balances = crud.calculate_group_balances(db, group_id=group_id)
    user_balance = next((b for b in balances if b.user_id == user_id), None)
    
    if user_balance and not crud.is_effectively_zero(user_balance.net_balance):
        raise HTTPException(
            status_code=400,
            detail="Cannot remove user with outstanding balances. Please settle all debts first."
        )
    
    crud.remove_member_from_group(db=db, group_id=group_id, user_id=user_id)
    return {"message": "User removed from group successfully"}

# User management endpoints
@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return crud.update_user(db=db, user_id=user_id, user_update=user_update)

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
      # Check if user has outstanding balances across all groups
    user_balances = crud.calculate_user_balances(db, user_id=user_id)
    has_outstanding_balances = any(not crud.is_effectively_zero(balance.net_balance) for balance in user_balances)
    
    if has_outstanding_balances:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete user with outstanding balances. Please settle all debts first."
        )
    
    crud.delete_user(db=db, user_id=user_id)
    return {"message": "User deleted successfully"}

# Database reset endpoint (for development/testing only)
@app.get("/")
def read_root():
    return {"message": "Splitwise Clone API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
