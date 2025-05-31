// Enhanced authentication module with better error handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - auth.js');

    // Check if Firebase is initialized with timeout
    const checkFirebaseInit = () => {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max
            
            const check = () => {
                attempts++;
                
                if (window.firebase && firebase.apps && firebase.apps.length > 0) {
                    console.log('Firebase initialized successfully in auth.js');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase initialization timeout'));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    };

    // Initialize authentication after Firebase is ready
    checkFirebaseInit()
        .then(() => {
            initializeAuth();
        })
        .catch((error) => {
            console.error('Firebase initialization failed:', error);
            showAuthError('Firebase initialization failed. Please refresh the page.');
        });
});

function initializeAuth() {
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged(user => {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (user) {
            console.log('User is signed in:', user.displayName || user.email);
            
            // Update user info in the UI
            const userNameElement = document.getElementById('userName');
            const userEmailElement = document.getElementById('userEmail');
            const userProfileImageElement = document.getElementById('userProfileImage');

            if (userNameElement) {
                userNameElement.textContent = user.displayName || 'User';
            }
            if (userEmailElement && user.email) {
                userEmailElement.textContent = user.email;
            }
            if (userProfileImageElement) {
                if (user.photoURL) {
                    userProfileImageElement.src = user.photoURL;
                }
                // If no photoURL, it will keep the default src from the HTML
            }
            
            // Redirect to dashboard if on login page
            if (currentPage === 'index.html' || currentPage === '') {
                window.location.href = 'dashboard.html';
            }
        } else {
            console.log('User is signed out');
            
            // Redirect to login page if not authenticated and not on login page
            if (currentPage !== 'index.html' && currentPage !== '') {
                window.location.href = 'index.html';
            }
        }
    }, (error) => {
        console.error('Auth state change error:', error);
        showAuthError('Authentication error: ' + error.message);
    });

    // Google Sign-In button
    const googleSignInButton = document.getElementById('googleSignIn');
    
    if (googleSignInButton) {
        console.log('Setting up Google Sign-In button');
        
        googleSignInButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Google Sign-In button clicked');
            
            // Disable button during sign-in process
            googleSignInButton.disabled = true;
            googleSignInButton.textContent = 'Signing in...';
            
            signInWithGoogle()
                .finally(() => {
                    // Re-enable button regardless of outcome
                    googleSignInButton.disabled = false;
                    googleSignInButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                        </svg>
                        Sign in with Google
                    `;
                });
        });
    } else {
        console.warn('Google Sign-In button not found on this page');
    }

    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            logoutButton.disabled = true;
            logoutButton.textContent = 'Signing out...';
            
            firebase.auth().signOut()
                .then(() => {
                    console.log('User signed out successfully');
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error('Sign-out error:', error);
                    showAuthError('Error signing out: ' + error.message);
                    logoutButton.disabled = false;
                    logoutButton.textContent = 'Logout';
                });
        });
    }
}

// Enhanced Google Sign-In function
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Use popup for sign-in
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        
        console.log('User signed in successfully:', user.displayName || user.email);
        
        // Clear any previous error messages
        hideAuthError();
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Google Sign-In error:', error);
        
        let errorMessage = 'Sign-in failed. Please try again.';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign-in was cancelled. Please try again.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection and try again.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many sign-in attempts. Please wait and try again later.';
                break;
            default:
                errorMessage = error.message || errorMessage;
        }
        
        showAuthError(errorMessage);
    }
}

// Utility functions for error handling
function showAuthError(message) {
    const authError = document.getElementById('authError');
    if (authError) {
        authError.textContent = message;
        authError.classList.remove('hidden');
        
        // Auto-hide error after 10 seconds
        setTimeout(() => {
            hideAuthError();
        }, 10000);
    } else {
        // Fallback to alert if error element doesn't exist
        alert(message);
    }
}

function hideAuthError() {
    const authError = document.getElementById('authError');
    if (authError) {
        authError.classList.add('hidden');
    }
}