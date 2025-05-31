document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notesContainer');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userProfileImage = document.getElementById('userProfileImage');
    const logoutButton = document.getElementById('logoutButton');
    
    // Check if user is logged in
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Update user profile information
            if (userNameElement) userNameElement.textContent = user.displayName || 'User';
            if (userEmailElement) userEmailElement.textContent = user.email || '';
            if (userProfileImage && user.photoURL) userProfileImage.src = user.photoURL;
            
            // Load user's notes
            loadNotes(user.uid);
        } else {
            // Redirect to login page if not logged in
            window.location.href = 'index.html';
        }
    });
    
    // Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            firebase.auth().signOut()
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error('Error signing out:', error);
                });
        });
    }
    
    async function loadNotes(userId) {
        try {
            notesContainer.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-600">Loading your notes...</p></div>';
            
            const notes = await getUserNotes(userId);
            console.log('Notes loaded:', notes); // Debug log to see what notes are loaded
            
            if (notes.length === 0) {
                notesContainer.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <p class="text-gray-600 mb-4">You don't have any notes yet.</p>
                        <a href="note-input.html" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">Create Your First Note</a>
                    </div>
                `;
                return;
            }
            
            // Clear loading message
            notesContainer.innerHTML = '';
            
            // Display each note
            notes.forEach(note => {
                const noteCard = document.createElement('div');
                noteCard.className = 'bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer';
                
                // Safe access to all properties
                const noteTitle = note.title || 'Untitled Note';
                const noteContent = note.content || '';
                const noteId = note.id || '';
                
                const truncatedContent = noteContent.length > 150 
                    ? noteContent.substring(0, 150) + '...' 
                    : noteContent;
                
                noteCard.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2">${noteTitle}</h3>
                    <p class="text-gray-600 mb-3">${truncatedContent}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">${formatDate(note.createdAt)}</span>
                        <a href="note-viewer.html?id=${noteId}" class="text-indigo-600 hover:text-indigo-800 w-full h-full block absolute top-0 left-0 opacity-0">View Details</a>
                    </div>
                `;
                
                // Make the entire card clickable
                noteCard.style.position = 'relative';
                noteCard.addEventListener('click', () => {
                    window.location.href = `note-viewer.html?id=${noteId}`;
                });
                
                notesContainer.appendChild(noteCard);
            });
        } catch (error) {
            console.error('Error loading notes:', error);
            notesContainer.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-red-600 mb-4">Error loading notes. Please try again later.</p>
                </div>
            `;
        }
    }
    
    // Helper function to format date
    // Helper function to format date
    function formatDate(timestamp) {
        if (!timestamp) return 'Unknown date';
        
        try {
            // Handle Firestore Timestamp objects
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            
            // Check if date is valid before formatting
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (error) {
            console.warn('Error formatting date:', error);
            return 'Unknown date';
        }
    }
});

// This function should be defined in firestore.js and imported
// Including here for completeness
async function getUserNotes(userId) {
    try {
        const notesRef = firebase.firestore().collection('users').doc(userId).collection('notes');
        const snapshot = await notesRef.orderBy('createdAt', 'desc').get();
        
        return snapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
    }
}