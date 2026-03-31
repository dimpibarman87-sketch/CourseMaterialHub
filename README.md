# Course Material Hub

The Course Material Hub is a web-based platform designed to help students and teachers easily share, access and manage study materials in one place. It acts like a centralized system where lecture notes, PDFs, PPTs and other learning resources are organized subject-wise or course-wise.

## Tech Stack

* Frontend: HTML, CSS, JavaScript
* Backend: Node.js, Express.js
* Database: MongoDB
* Key Integrations: Mongoose, Multer (file uploads), Cloudinary (cloud storage), JWT/Bcrypt (authentication)

# Project Structure

├───backend
│   ├───config/         # Database and third-party configuration
│   ├───middleware/     # Express middlewares (e.g., authentication, upload handlers)
│   ├───models/         # Mongoose database schemas
│   ├───routes/         # API endpoints
│   ├───upload/         # Local file upload processing
│   ├───uploads/        # Temporary storage for local uploads
│   ├───.env            # Environment variables (Create this locally)
│   └───package.json    # Backend dependencies and scripts
└───frontend
    ├───index.html      # Main entry point
    ├───css/            # Stylesheets
    └───js/             # Client-side logic

# Getting Started

Follow these steps to download and run the project locally on your system.

### Prerequisites

Make sure you have the following installed on your machine:
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/)
* [MongoDB](https://www.mongodb.com/try/download/community) (running locally, or have a MongoDB Atlas connection string ready)

### 1. Clone the Repository

Open your terminal or command prompt and run the following commands to download the code:

git clone https://github.com/dimpibarman87-sketch/CourseMaterialHub.git
cd CourseMaterialHub

### 2. Backend Setup

Open a terminal and navigate to the backend directory to install the required dependencies:

bash-
cd backend
npm install

Environment Variables:

Create a `.env` file in the root of the `backend` folder. Based on the project dependencies, you will likely need to configure the following variables:

PORT=5000
MONGO_URI = your_mongodb_connection_string
JWT_SECRET = your_jwt_secret_key
CLOUDINARY_CLOUD_NAME = your_cloudinary_name
CLOUDINARY_API_KEY = your_cloudinary_api_key
CLOUDINARY_API_SECRET = your_cloudinary_api_secret

Start the Server:

Once the dependencies are installed and the `.env` file is set up, start your backend server:

bash-
# If using nodemon for development:
npm run dev

# OR for standard node:
npm start

The backend should now be running on `http://localhost:5000` (or whichever port you specified).

### 3. Frontend Setup

Since the frontend is built with HTML,CSS and JavaScript, you don't need to install any node modules for it. 

1. Open a new terminal window.
2. Navigate to the frontend directory:
   bash
   cd ../frontend
   
3. Open `index.html` directly in your web browser, or for the best experience, use a local development server like the 'Live Server' extension in VS Code.

# Project Demo Video:

You can watch the project working demo here:


# Developed by:
  Ariesha R Marak
  
  Dimpi Barman
