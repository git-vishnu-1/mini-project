# Internship Tracker Mini Project

A web-based platform for managing internships, designed for both students and administrators. This project allows students to browse and apply for internships, while administrators can manage internship postings and student applications.

## Features

- **Student Dashboard:** View available internships, apply, and track application status.
- **Admin Dashboard:** Manage internships, view applicants, and send reminders.
- **Authentication:** Secure login and registration for students and admins.
- **Automated Reminders:** Scheduled jobs to remind students about application deadlines.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** (Configured in `server/src/config/db.js`)

## Folder Structure

```
mini-project/
│
├── public/                # Frontend static files
│   ├── css/               # Stylesheets
│   ├── js/                # Frontend JS
│   └── *.html             # HTML pages
│
├── server/                # Backend code
│   ├── src/
│   │   ├── config/        # DB config
│   │   ├── jobs/          # Scheduled jobs
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   └── scripts/       # DB scripts
│   └── package.json       # Backend dependencies
│
├── docs/                  # Documentation
└── README.md              # Project overview
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm

### Backend Setup
1. Navigate to the `server` directory:
	```sh
	cd server
	```
2. Install dependencies:
	```sh
	npm install
	```
3. Configure your database in `src/config/db.js`.
4. (Optional) Initialize the database using the scripts in `src/scripts/`.
5. Start the backend server:
	```sh
	npm start
	```

### Frontend Usage
- Open any HTML file in the `public/` folder (e.g., `login.html`, `student-dashboard.html`) in your browser.
- Ensure the backend server is running for API requests.

## Scripts & Automation
- **Database Initialization:** See `server/src/scripts/initDb.js` and `schema.sql`.
- **Automated Reminders:** Managed by `server/src/jobs/reminders.js`.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
