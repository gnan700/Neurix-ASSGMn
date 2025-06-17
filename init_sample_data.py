"""
Sample data initialization script for Splitwise Clone
Run this after the application is running to populate with sample data
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def create_sample_users():
    """Create sample users"""
    users = [
        {"name": "Alice Johnson", "email": "alice@example.com"},
        {"name": "Bob Smith", "email": "bob@example.com"},
        {"name": "Charlie Brown", "email": "charlie@example.com"},
        {"name": "Diana Prince", "email": "diana@example.com"},
        {"name": "Eve Wilson", "email": "eve@example.com"}
    ]
    
    created_users = []
    for user in users:
        try:
            response = requests.post(f"{BASE_URL}/users/", json=user)
            if response.status_code == 200:
                created_user = response.json()
                created_users.append(created_user)
                print(f"✅ Created user: {user['name']}")
            else:
                print(f"❌ Failed to create user: {user['name']}")
        except Exception as e:
            print(f"❌ Error creating user {user['name']}: {e}")
    
    return created_users

def create_sample_groups(users):
    """Create sample groups"""
    if len(users) < 3:
        print("❌ Need at least 3 users to create sample groups")
        return []
    
    groups = [
        {
            "name": "Weekend Trip",
            "description": "Our amazing weekend getaway",
            "user_ids": [users[0]["id"], users[1]["id"], users[2]["id"]]
        },
        {
            "name": "Office Lunch",
            "description": "Team lunch expenses",
            "user_ids": [users[1]["id"], users[2]["id"], users[3]["id"]]
        },
        {
            "name": "Movie Night",
            "description": "Friends movie night",
            "user_ids": [users[0]["id"], users[2]["id"], users[4]["id"]]
        }
    ]
    
    created_groups = []
    for group in groups:
        try:
            response = requests.post(f"{BASE_URL}/groups/", json=group)
            if response.status_code == 200:
                created_group = response.json()
                created_groups.append(created_group)
                print(f"✅ Created group: {group['name']}")
            else:
                print(f"❌ Failed to create group: {group['name']}")
        except Exception as e:
            print(f"❌ Error creating group {group['name']}: {e}")
    
    return created_groups

def create_sample_expenses(groups, users):
    """Create sample expenses"""
    if not groups or not users:
        print("❌ Need groups and users to create expenses")
        return
    
    # Weekend Trip expenses
    trip_group = groups[0]
    trip_expenses = [
        {
            "description": "Hotel accommodation",
            "amount": 300.00,
            "paid_by": trip_group["members"][0]["id"],
            "split_type": "equal",
            "splits": []
        },
        {
            "description": "Gas for the trip",
            "amount": 80.00,
            "paid_by": trip_group["members"][1]["id"],
            "split_type": "equal",
            "splits": []
        },
        {
            "description": "Dinner at fancy restaurant",
            "amount": 150.00,
            "paid_by": trip_group["members"][2]["id"],
            "split_type": "percentage",
            "splits": [
                {"user_id": trip_group["members"][0]["id"], "percentage": 40.0},
                {"user_id": trip_group["members"][1]["id"], "percentage": 35.0},
                {"user_id": trip_group["members"][2]["id"], "percentage": 25.0}
            ]
        }
    ]
    
    for expense in trip_expenses:
        try:
            response = requests.post(f"{BASE_URL}/groups/{trip_group['id']}/expenses", json=expense)
            if response.status_code == 200:
                print(f"✅ Created expense: {expense['description']}")
            else:
                print(f"❌ Failed to create expense: {expense['description']}")
        except Exception as e:
            print(f"❌ Error creating expense {expense['description']}: {e}")
    
    # Office Lunch expenses
    if len(groups) > 1:
        lunch_group = groups[1]
        lunch_expenses = [
            {
                "description": "Pizza for the team",
                "amount": 45.00,
                "paid_by": lunch_group["members"][0]["id"],
                "split_type": "equal",
                "splits": []
            },
            {
                "description": "Drinks and dessert",
                "amount": 25.00,
                "paid_by": lunch_group["members"][1]["id"],
                "split_type": "equal",
                "splits": []
            }
        ]
        
        for expense in lunch_expenses:
            try:
                response = requests.post(f"{BASE_URL}/groups/{lunch_group['id']}/expenses", json=expense)
                if response.status_code == 200:
                    print(f"✅ Created expense: {expense['description']}")
                else:
                    print(f"❌ Failed to create expense: {expense['description']}")
            except Exception as e:
                print(f"❌ Error creating expense {expense['description']}: {e}")

def main():
    print("🎬 Initializing sample data for Splitwise Clone...")
    print(f"🔗 Connecting to {BASE_URL}")
    
    try:
        # Test connection
        response = requests.get(f"{BASE_URL}/")
        if response.status_code != 200:
            print("❌ Cannot connect to the backend. Make sure the application is running.")
            return
    except Exception as e:
        print(f"❌ Cannot connect to the backend: {e}")
        print("Make sure the application is running with: docker-compose up")
        return
    
    print("✅ Connected to backend")
    print()
    
    # Create sample data
    print("👥 Creating sample users...")
    users = create_sample_users()
    print()
    
    print("👥 Creating sample groups...")
    groups = create_sample_groups(users)
    print()
    
    print("💰 Creating sample expenses...")
    create_sample_expenses(groups, users)
    print()
    
    print("🎉 Sample data initialization complete!")
    print()
    print("You can now visit http://localhost:3000 to see the application with sample data.")

if __name__ == "__main__":
    main()
