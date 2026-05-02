Proxima - Project Management Tool

A full-stack project management web application similar to Trello/Asana, built with Node.js, Express, MongoDB, Socket.io, and Vanilla JS/CSS.

Features
User Authentication: Register/Login with JWT and bcrypt hashing.
Project Management: Create and view projects.
Kanban Boards & Tasks: Create columns, add tasks, and reorder tasks across boards using Drag-and-Drop.
Real-Time Collaboration: Task updates and comments appear in real-time across connected clients via Socket.IO.
Notifications: Instant pop-up notifications when users are assigned to tasks.
Rich UI/UX: Glassmorphism design system, dark mode native, and responsive layouts.

Project Structure
/client - Contains all Frontend HTML, CSS, and Vanilla JavaScript.
/server - Contains the Express backend, Mongoose models, routes, controllers, and Socket.IO handler.

Prerequisites
Node.js installed (v16+)
MongoDB Database (Local instance running on mongodb://127.0.0.1:27017/pm_tool or an Atlas URI)

Setup Instructions
Install Dependencies Navigate to the server directory and install the required NPM packages.
cd server
npm install

Environment Variables The .env file is already created in the /server folder. You can configure your MongoDB database or JWT secrets there. The defaults are:
MONGO_URI=mongodb://127.0.0.1:27017/pm_tool
JWT_SECRET=supersecretjwtkey123
PORT=5000

Run the Application You can start the server and the frontend with one command inside the /server directory:
npm start
Or for nodemon watching during development:

npm run dev
Access the App Open your browser and navigate to: http://localhost:5000

Sample Data Testing
Register a new user account through the Web UI.
Go to your Dashboard and create a project.
Once the project opens, create some tasks and shift them around. You can open multiple browser windows logged into different accounts to see real-time Socket.IO notifications and board movements instantly.
