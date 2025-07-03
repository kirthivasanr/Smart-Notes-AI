// Initialize Firebase
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
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