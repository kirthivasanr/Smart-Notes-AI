# Smart Notes AI

Smart Notes AI is a web application that leverages AI to transform your class notes into concise summaries, insightful questions, and other learning resources. It uses Firebase for authentication and database storage, and the Maverick API (via OpenRouter) for AI-powered content generation.

## Features

- **User Authentication:** Secure sign-in with Google.
- **Note Creation:** Easily create and save notes with a title, subject (optional), and content.
- **AI Processing:**
    - Generate detailed summaries (400-500 words) with highlighted keywords.
    - Create 5-8 important questions to test understanding.
    - Generate 10 multiple-choice questions with answers.
    - Suggest 6-8 relevant YouTube search keywords.
- **Note Viewing:** View original notes alongside AI-generated content.
- **Note Management:**
    - View all your notes on a dashboard.
    - Delete notes.
- **Share Notes:** Copy a shareable link to your note.
- **PDF Export:** Export notes and AI-generated content to a PDF document.

## Tech Stack

- **Frontend:** HTML, CSS (Tailwind CSS), JavaScript
- **Backend:** Firebase (Authentication, Firestore Database)
- **AI:** Maverick API (via OpenRouter) - specifically `meta-llama/llama-3.1-8b-instruct:free`
- **Libraries:**
    - D3.js (for potential mind map visualization)
    - html2pdf.js (for PDF export)

## Project Structure

```
.
├── dashboard.html            # User's notes dashboard
├── favicon.svg               # Application favicon
├── firestore.rules           # Firebase Firestore security rules
├── index.html                # Login page
├── note-input.html           # Page for creating new notes
├── note-viewer.html          # Page for viewing a single note and AI content
├── package.json              # Project dependencies (primarily Firebase)
├── README.md                 # This file
├── css/
│   └── styles.css            # Custom CSS styles, including PDF export styles
└── js/
    ├── app.js                # Main application logic, page setup, event handling
    ├── auth.js               # Firebase authentication logic
    ├── dashboard.js          # Logic for the dashboard page
    ├── firebase-config.js    # Firebase initialization configuration
    ├── firestore.js          # Firestore database interaction functions
    └── maverick.js           # Maverick API interaction and response parsing
```

## Setup and Installation

1.  **Clone the repository (if applicable) or download the files.**
2.  **Firebase Setup:**
    *   Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Enable **Authentication** and add the **Google** sign-in provider.
    *   Set up **Firestore Database**.
        *   Go to the "Rules" tab in Firestore and replace the default rules with the content of [`firestore.rules`](firestore.rules).
    *   In your Firebase project settings, find your web app's Firebase configuration (apiKey, authDomain, etc.).
    *   Update the `firebaseConfig` object in [`js/firebase-config.js`](js/firebase-config.js) with your project's credentials.
    *   Ensure your `storageBucket` in `firebaseConfig` is correct (e.g., `your-project-id.appspot.com`).
3.  **Maverick API Key:**
    *   Obtain an API key from [OpenRouter.ai](https://openrouter.ai/).
    *   Replace the placeholder `MAVERICK_API_KEY` in [`js/maverick.js`](js/maverick.js) with your actual API key.
4.  **Install Dependencies:**
    *   While `package.json` lists `firebase`, the project primarily uses Firebase via CDN. If you intend to use npm for managing Firebase or other dependencies locally, run:
        ```sh
        npm install
        ```
    *   For direct browser usage, no explicit `npm install` is strictly necessary if all scripts are loaded via CDN or directly.

## Usage

1.  Open [`index.html`](index.html) in your web browser.
2.  Sign in using the "Sign in with Google" button.
3.  You will be redirected to the [`dashboard.html`](dashboard.html).
4.  Click "Create New Note" to go to [`note-input.html`](note-input.html).
5.  Enter your note title, content, and an optional subject.
6.  Click "Process with AI". The application will send your notes to the Maverick API and then save the original note and the AI-generated content to Firestore.
7.  You will be redirected to [`note-viewer.html`](note-viewer.html) to see the original note and the AI-generated summary, questions, MCQs, and YouTube keywords.
8.  From the note viewer, you can:
    *   Export the note to PDF.
    *   Share the note via a link.
    *   Delete the note.
9.  Navigate back to the dashboard to see all your saved notes.

## Firebase Configuration

Firebase is used for authentication and database storage.

*   **Authentication:** Google Sign-In is implemented. User data is managed by Firebase Authentication.
*   **Firestore:** Notes and their AI-processed data are stored in Firestore. The database structure is:
    ```
    users/{userId}/notes/{noteId}
    ```
    Each `note` document contains fields like `title`, `content`, `subject`, `createdAt`, `updatedAt`, and `processedData` (which holds the AI-generated content).
*   **Security Rules:** The [`firestore.rules`](firestore.rules) file ensures that users can only read and write their own notes.

## AI Processing ([`js/maverick.js`](js/maverick.js))

The [`processNoteWithMaverick`](js/maverick.js) function in [`js/maverick.js`](js/maverick.js) handles communication with the OpenRouter API (Maverick model).
- It constructs a detailed prompt asking the AI to generate:
    - A summary.
    - Important questions.
    - Multiple-choice questions.
    - YouTube search keywords.
- The [`parseEnhancedMaverickResponse`](js/maverick.js) function parses the AI's response into a structured JavaScript object.

## Key Files

*   **[`index.html`](index.html):** Login page.
*   **[`dashboard.html`](dashboard.html):** Displays user's notes.
*   **[`note-input.html`](note-input.html):** Form for creating new notes.
*   **[`note-viewer.html`](note-viewer.html):** Displays a single note with AI-generated content.
*   **[`js/app.js`](js/app.js):** Handles page-specific logic for note input and viewing, including PDF export.
*   **[`js/auth.js`](js/auth.js):** Manages user authentication flow.
*   **[`js/firestore.js`](js/firestore.js):** Contains functions for interacting with Firestore (CRUD operations for notes).
*   **[`js/maverick.js`](js/maverick.js):** Handles API calls to Maverick and parses responses.
*   **[`js/firebase-config.js`](js/firebase-config.js):** Initializes Firebase.
*   **[`css/styles.css`](css/styles.css):** Contains custom styles, including those for PDF export.

---

This README provides a comprehensive overview of the Smart Notes AI application.
