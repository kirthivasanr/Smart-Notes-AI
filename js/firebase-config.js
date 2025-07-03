// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA9ue0HgkzCjVy-Bteb3Rx6kHwL31JE71c",
    authDomain: "smart-notes-ai-a8127.firebaseapp.com",
    projectId: "smart-notes-ai-a8127",
    storageBucket: "smart-notes-ai-a8127.firebasestorage.app",
    messagingSenderId: "815326262098",
    appId: "1:815326262098:web:74ab9fb3a06f03179b008b"
};

// Initialize Firebase only if it hasn't been initialized yet
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
    } else {
        // Use existing app if already initialized
        firebase.app();
        console.log('Using existing Firebase app');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Configure Google provider to request profile information
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
    'prompt': 'select_account'
});

// Export the services for use in other files
// This ensures these objects are available when imported
window.db = db;
window.auth = auth;
window.googleProvider = googleProvider;