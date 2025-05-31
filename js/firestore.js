// Get user's notes from Firestore with enhanced error handling
async function getUserNotes(userId) {
    try {
        // Validate input
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        // Check if user is authenticated
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        console.log('Fetching notes for user:', userId);
        
        const notesRef = firebase.firestore().collection('users').doc(String(userId)).collection('notes');
        const snapshot = await notesRef.orderBy('createdAt', 'desc').get();
        
        const notes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure createdAt is properly handled
                createdAt: data.createdAt || null,
                updatedAt: data.updatedAt || null
            };
        });
        
        console.log(`Retrieved ${notes.length} notes for user ${userId}`);
        return notes;
        
    } catch (error) {
        console.error('Error fetching notes:', error);
        
        // Return empty array instead of throwing to prevent app crash
        if (error.code === 'permission-denied') {
            console.warn('Permission denied - user may not be properly authenticated');
        }
        
        return [];
    }
}

// Get a single note by ID
async function getNoteById(userId, noteId) {
    try {
        // Verify current user is authenticated
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        console.log('Current authenticated user:', currentUser.uid);
        console.log('Attempting to fetch note:', noteId, 'for user:', userId);
        
        // Ensure userId matches current user
        if (String(userId) !== currentUser.uid) {
            console.warn('User ID mismatch - using authenticated user ID instead');
            userId = currentUser.uid;
        }
        
        const noteRef = firebase.firestore().collection('users').doc(String(userId)).collection('notes').doc(noteId);
        console.log('Fetching document from path:', noteRef.path); // Log the path
        const doc = await noteRef.get();

        if (doc.exists) {
            console.log('Document found! Data:', doc.data()); // Log the retrieved data
            return {
                id: doc.id,
                ...doc.data()
            };
        } else {
            // This log is important!
            console.error('Note document NOT FOUND at path:', noteRef.path);
            return null;
        }
    } catch (error) {
        console.error('Error fetching note:', error);
        return null;
    }
}
// Save a new note to Firestore
async function saveNote(userId, noteData) {
    try {
        // Verify current user is authenticated
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        console.log('Current authenticated user:', currentUser.uid);
        console.log('Attempting to save for userId:', userId);
        
        // Ensure userId is converted to string and matches current user
        if (String(userId) !== currentUser.uid) {
            console.warn('User ID mismatch - using authenticated user ID instead');
            userId = currentUser.uid;
        }
        
        // Create a clean copy of noteData without any userId property
        const cleanNoteData = { ...noteData };
        // If userId exists in noteData, remove it to avoid conflicts
        if ('userId' in cleanNoteData) {
            delete cleanNoteData.userId;
        }
        
        // This line uses userId
        const notesRef = firebase.firestore().collection('users').doc(String(userId)).collection('notes');
        
        // Add timestamp
        const noteWithTimestamp = {
            ...cleanNoteData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        console.log('Saving note data:', JSON.stringify(noteWithTimestamp, null, 2));
        
        const docRef = await notesRef.add(noteWithTimestamp);
        console.log('Note saved with ID:', docRef.id);

        return docRef.id;
    } catch (error) {
        console.error('Error saving note:', error);
        throw error;
    }
}

// Update an existing note
async function updateNote(userId, noteId, noteData) {
    try {
        const noteRef = firebase.firestore().collection('users').doc(userId).collection('notes').doc(noteId);
        
        // Add updated timestamp
        const updatedData = {
            ...noteData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await noteRef.update(updatedData);
        console.log('Note updated:', noteId);
        
        return {
            id: noteId,
            ...updatedData
        };
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
}

// Delete a note
async function deleteNote(userId, noteId) {
    try {
        const noteRef = firebase.firestore().collection('users').doc(userId).collection('notes').doc(noteId);
        await noteRef.delete();
        console.log('Note deleted:', noteId);
        return true;
    } catch (error) {
        console.error('Error deleting note:', error);
        throw error;
    }
}

// At the end of your firestore.js file, add these lines:

// Export functions to global scope
window.getUserNotes = getUserNotes;
window.getNoteById = getNoteById;
window.saveNote = saveNote;
window.updateNote = updateNote;
window.deleteNote = deleteNote;
// Add this alias for compatibility with your app.js
window.getNote = getNoteById;