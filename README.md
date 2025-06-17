# Splitwise Clone – Neurix Full-Stack SDE Internship Assignment

A simplified version of Splitwise, built as part of the Neurix Full-Stack SDE Internship assignment. This app enables users to:

* Create groups
* Add and split expenses (equally or by percentage)
* Track balances between users across multiple groups

---

## 🔧 Tech Stack

### Backend:

* **Framework**: FastAPI
* **Language**: Python 3.10+
* **Database**: PostgreSQL
* **ORM**: SQLAlchemy

### Frontend:

* **Framework**: React
* **Styling**: TailwindCSS
* **HTTP Client**: Axios

---

## 🚀 Features

### ✅ Core Functionalities

#### Group Management

* `POST /groups`: Create a group with a name and list of user IDs
* `GET /groups/{group_id}`: Get group details (name, users, total expenses)

#### Expense Management

* `POST /groups/{group_id}/expenses`: Add a new expense
    * **Fields**: `description`, `amount`, `paid_by`, `split_type` (equal or percentage), `splits`

#### Balance Tracking

* `GET /groups/{group_id}/balances`: View balance sheet of the group (who owes whom)
* `GET /users/{user_id}/balances`: View all outstanding balances for a user across groups

### 🎨 Frontend Functionality

* Create and manage groups
* Add expenses with equal or percentage split
* View group balance summary
* View personal balance summary

---

## 🧠 Bonus (Optional): AI Chatbot

Powered by OpenAI or HuggingFace, this bot answers natural language queries like:

* “How much does Alice owe in group Goa Trip?”
* “Show me my latest 3 expenses.”
* “Who paid the most in Weekend Trip?”

---
---

## 🧪 Local Setup

### ✅ Prerequisites

* Python 3.10+
* Node.js 18+
* PostgreSQL

### 🔄 Backend Setup

1.  **Clone the repo**:
    ```bash
    git clone [https://github.com/yourusername/splitwise-clone.git](https://github.com/yourusername/splitwise-clone.git)
    cd splitwise-clone/backend
    ```
2.  **Create a virtual environment and activate it**:
    ```bash
    python -m venv venv
    source venv/bin/activate (Windows: venv\Scripts\activate)
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r scripts_requirements.txt
    ```
4.  **Set up PostgreSQL and .env file**:
    ```bash
    cp .env.example .env
    ```
    (Edit `DB_URL`, etc.)
5.  **Run the backend**:
    ```bash
    uvicorn main:app --reload
    ```

### 🌐 Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
