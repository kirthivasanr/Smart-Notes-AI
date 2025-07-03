# Smart Notes AI

Smart Notes AI is a web application that uses AI to help you process and understand your notes. It can generate summaries, important questions, multiple-choice questions, and relevant YouTube keywords from your notes.

## Setup

To run this project locally, you need to configure your Firebase and Maverick API keys.

1.  **Firebase Configuration:**
    *   Open `js/firebase-config.js`.
    *   Replace the placeholder values in the `firebaseConfig` object with your actual Firebase project configuration.
        ```javascript
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };
        ```

2.  **Maverick API Key:**
    *   Open `js/maverick.js`.
    *   Replace the placeholder value for `MAVERICK_API_KEY` with your OpenRouter API key.
        ```javascript
        const MAVERICK_API_KEY = 'YOUR_MAVERICK_API_KEY'; // Your OpenRouter API key
        ```

## Running the Application

After configuring the API keys, you can open `index.html` in your browser to start the application.
