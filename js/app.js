// Wait for all scripts to load before initializing
function waitForDependencies() {
    return new Promise((resolve) => {
        const checkDependencies = () => {
            // Check if Firebase is initialized
            if (!window.firebase || !firebase.apps.length) {
                setTimeout(checkDependencies, 100);
                return;
            }
            
            // Check if required functions are available
            const requiredFunctions = [
                // Maverick.js functions
                'processNoteWithMaverick', 
                // Firestore.js functions
                'saveNote', 
                'getNoteById', 
                'getUserNotes', 
                'updateNote', 
                'deleteNote'
            ];
            const missingFunctions = requiredFunctions.filter(func => typeof window[func] !== 'function');
            
            if (missingFunctions.length > 0) {
                console.log('Waiting for functions:', missingFunctions);
                setTimeout(checkDependencies, 100);
                return;
            }
            
            resolve();
        };
        
        checkDependencies();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - app.js');
    
    // Wait for all dependencies to be available
    try {
        await waitForDependencies();
        console.log('All dependencies loaded successfully');

        // Check which page we're on
        const currentPage = window.location.pathname.split('/').pop();
        
        // Handle note input form
        if (currentPage === 'note-input.html') {
            if (typeof setupNoteInputPage === 'function') {
                setupNoteInputPage();
            } else {
                console.error('setupNoteInputPage is not defined. Check script loading order.');
            }
        }
        
        // Handle note viewer page
        if (currentPage === 'note-viewer.html') {
            if (typeof setupNoteViewerPage === 'function') {
                setupNoteViewerPage();
            } else {
                console.error('setupNoteViewerPage is not defined. Check script loading order.');
            }
        }
    } catch (error) {
        console.error('Error waiting for dependencies:', error);
    }
});

// Setup note input page
function setupNoteInputPage() {
    const noteForm = document.getElementById('noteForm');
    const processButton = document.getElementById('processWithAI'); // Get button by ID
    const processingIndicator = document.getElementById('processingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const processingText = document.getElementById('processingText'); // Get the new text element

    // Check if we are on the note input page by checking for the form
    if (noteForm && processButton) {
        console.log("Setting up note input page listener."); // Debug log

        noteForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            console.log("Process with AI button clicked / Form submitted."); // Debug log

            // Disable button and show indicator
            processButton.disabled = true;
            processButton.textContent = 'Processing...';
            processingIndicator.classList.remove('hidden');
            errorMessage.classList.add('hidden');

            // Animation for processing steps
            const steps = [
                "Summarizing your notes...",
                "Creating important questions...",
                "Generating multiple-choice questions...",
                "Finding relevant YouTube keywords...",
                "Finalizing..."
            ];
            let currentStep = 0;
            if (processingText) { // Set initial text
                processingText.textContent = steps[currentStep];
            }

            const intervalId = setInterval(() => {
                currentStep++;
                if (currentStep < steps.length) { // Check if currentStep is within bounds
                    if (processingText) {
                        processingText.textContent = steps[currentStep];
                    }
                    if (currentStep === steps.length - 1) { // If this is the "Finalizing..." step
                        clearInterval(intervalId); // Stop the interval, "Finalizing..." will persist
                    }
                } else {
                    // Safeguard: should not be reached if logic is correct
                    clearInterval(intervalId);
                }
            }, 3500); // Change text every 3.5 seconds (slower)

            // Get form data
            const title = document.getElementById('noteTitle').value;
            const content = document.getElementById('noteContent').value;
            const subject = document.getElementById('noteSubject').value;

            if (!title || !content) {
                 alert('Please enter both a title and content for your note.');
                 processButton.disabled = false;
                 processButton.textContent = 'Process with AI';
                 processingIndicator.classList.add('hidden');
                 return;
            }

            // In setupNoteInputPage function, inside the noteForm.addEventListener('submit', async (e) => { ... }) try block:
            try {
                // Get current user
                const user = firebase.auth().currentUser;
                if (!user) {
                    throw new Error('You must be logged in to save notes');
                }
                // **** ADD THIS LOG ****
                console.log('User UID before calling saveNote:', user.uid, '(Type:', typeof user.uid, ')');
                // *********************

                // Check if processNoteWithMaverick is defined BEFORE calling it
                if (typeof processNoteWithMaverick !== 'function') {
                     console.error('processNoteWithMaverick function is not available!');
                     throw new Error('AI processing function is not loaded correctly.');
                }
                console.log("Calling processNoteWithMaverick..."); // Debug log

                // Process the note with Maverick API
                // Pass title as well, as defined in gemini.js
                const processedData = await processNoteWithMaverick(title, content, subject);
                console.log("Gemini processing complete, data:", processedData); // Log the processed data
                // **** ADD THIS LOG ****
                console.log('Detailed processedData in app.js before saving:', JSON.stringify(processedData, null, 2));
                // *********************

                // Save the note to Firestore
                // Ensure processedData is included here
                const noteDataToSave = {
                    title: title,
                    content: content,
                    subject: subject,
                    processedData: processedData // *** UNCOMMENT AND INCLUDE THIS ***
                    // userId is handled by saveNote function, no need to include here
                };

                // Ensure saveNote is defined and available (from firestore.js)
                if (typeof saveNote !== 'function') {
                    console.error('saveNote function is not available!');
                    throw new Error('Firestore save function is not loaded correctly.');
                }
                console.log("Calling saveNote..."); // Debug log
                // Log the actual data being passed to saveNote
                console.log("Data being sent to Firestore:", JSON.stringify(noteDataToSave, null, 2));

                // Pass the complete noteDataToSave object to saveNote
                const noteId = await saveNote(user.uid, noteDataToSave); // *** USE THE FULL OBJECT ***
                console.log("Note saved with ID:", noteId); // Debug log

                // Instead of redirecting, call a function to display results directly
                if (noteId && processedData) {
                    console.log("Note processed and saved. Note ID:", noteId);
                    clearInterval(intervalId); // Stop the animation
                    // Redirect to the note viewer page
                    window.location.href = `note-viewer.html?id=${noteId}`;
                } else {
                     console.error("Failed to get note ID or processed data after saving.");
                     throw new Error("Note saved, but failed to retrieve its ID or processed data for display.");
                }

            } catch (error) { // This is line 637 in the screenshot
                console.error('Error processing note:', error);
                errorMessage.textContent = error.message || 'An error occurred while processing your note';
                errorMessage.classList.remove('hidden');
                clearInterval(intervalId); // Stop the animation on error
                // Re-enable button and hide indicator on error
                processButton.disabled = false;
                processButton.textContent = 'Process with AI';
                processingIndicator.classList.add('hidden');
            }
        });
    } else {
        // console.log("Note form or process button not found on this page."); // Optional debug
    }
}

// Setup note viewer page
function setupNoteViewerPage() {
    const noteContainer = document.getElementById('noteContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get note ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    
    if (!noteId) {
        if (errorMessage) {
            errorMessage.textContent = 'No note ID provided';
            errorMessage.classList.remove('hidden');
        }
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        return;
    }

    // Get current user
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                if (loadingIndicator) loadingIndicator.classList.remove('hidden');
                if (errorMessage) errorMessage.classList.add('hidden');

                // Ensure getNoteById is defined and available (from firestore.js)
                if (typeof getNoteById !== 'function') {
                    console.error('getNoteById function is not available!');
                    throw new Error('Firestore get function is not loaded correctly.');
                }

                // Pass both user.uid and noteId to getNoteById
                console.log(`Calling getNoteById with userId: ${user.uid}, noteId: ${noteId}`);
                const note = await getNoteById(user.uid, noteId);

                // **** ADD THIS LOG ****
                console.log('Note object received in app.js:', note);
                // **** ADD THIS LOG ****
                console.log('Detailed note object in app.js after fetching:', JSON.stringify(note, null, 2));
                // *********************

                if (!note) {
                    // This error might be triggered if getNoteById returns null
                    throw new Error('Note not found or you do not have permission to view it.');
                }

                // Ensure displayNote is defined
                if (typeof displayNote !== 'function') {
                     console.error('displayNote function is not available!');
                     throw new Error('Display function is not loaded correctly.');
                }
                // **** ADD THIS LOG ****
                console.log('Calling displayNote with note:', note);
                // *********************
                displayNote(note); // Make sure this function exists and works
                
                // Setup button event listeners after note is loaded
                setupNoteViewerButtons(note);

                if (loadingIndicator) loadingIndicator.classList.add('hidden');
            } catch (error) {
                console.error('Error loading note:', error);
                if (errorMessage) {
                    errorMessage.textContent = error.message || 'An error occurred while loading the note';
                    errorMessage.classList.remove('hidden');
                }
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
            }
        } else {
             // Redirect to login if not authenticated
             console.log("User not authenticated, redirecting to index.html");
             window.location.href = 'index.html';
        }
    });
}

// Setup button event listeners for note viewer
function setupNoteViewerButtons(note) {
    // Export PDF button
    const exportPdfButton = document.getElementById('exportPdfButton');
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', () => {
            exportToPdf(note);
        });
    }
    
    // Share button functionality is handled by the inline script in note-viewer.html
    // No duplicate event listener needed here
}

// Display note data in the viewer
function displayNote(note) {
    console.log('Displaying note:', note); // Debug log
    
    // Set the note title
    document.getElementById('noteTitle').textContent = note.title || 'Untitled Note';
    
    // Set the note subject
    const noteSubjectElement = document.getElementById('noteSubject');
    if (noteSubjectElement) {
        noteSubjectElement.textContent = note.subject ? `Subject: ${note.subject}` : '';
    }
    
    // Update PDF header elements
    const pdfTitleElement = document.getElementById('pdfTitle');
    const pdfSubjectElement = document.getElementById('pdfSubject');
    if (pdfTitleElement) {
        pdfTitleElement.textContent = note.title || 'Untitled Note';
    }
    if (pdfSubjectElement) {
        pdfSubjectElement.textContent = note.subject ? `Subject: ${note.subject}` : '';
    }
      // Display original note content
    const originalNotesElement = document.getElementById('originalContent'); // Corrected ID
    if (originalNotesElement) {
        originalNotesElement.innerHTML = ''; // Clear previous content
        const originalContentContainer = document.createElement('div');
        originalContentContainer.classList.add('pdf-content-section'); // Changed class name
        originalContentContainer.innerHTML = `<p class="leading-relaxed whitespace-pre-wrap">${note.content || 'No content available'}</p>`;
        originalNotesElement.appendChild(originalContentContainer);
    }
    
    // Show PDF header when generating PDF (CSS will handle this)
    const pdfHeaderElement = document.querySelector('.pdf-header');
    if (pdfHeaderElement) {
        pdfHeaderElement.style.display = 'block';
    }
    
    // Check if processedData exists and is not empty
    const hasSufficientData = note.processedData && 
                              (note.processedData.summary || 
                               (note.processedData.questions && note.processedData.questions.length > 0) || 
                               (note.processedData.mcqs && note.processedData.mcqs.length > 0));

    if (hasSufficientData) {        // Render summary, questions, and MCQs
        const summaryElement = document.getElementById('summary');
        if (summaryElement) {
            summaryElement.innerHTML = ''; // Clear previous content
            const summaryContainer = document.createElement('div');
            summaryContainer.classList.add('pdf-content-section');
            summaryContainer.innerHTML = `<div class="leading-relaxed">${note.processedData.summary || 'No summary available'}</div>`;
            summaryElement.appendChild(summaryContainer);
        }
        
        // Display important questions if available
        const questionsElement = document.getElementById('questions'); // Corrected ID
        if (questionsElement) {
            questionsElement.innerHTML = ''; // Clear previous content
            const questionsContainer = document.createElement('div');
            questionsContainer.classList.add('pdf-content-section'); // Outer container for questions section
            questionsContainer.innerHTML = note.processedData.questions 
                ? formatListItems(note.processedData.questions) // Removed class parameter
                : '<p>No questions available</p>';
            questionsElement.appendChild(questionsContainer);
        }
        
        // Display MCQs if available
        const mcqElement = document.getElementById('mcqs'); // Corrected ID
        if (mcqElement) {
            mcqElement.innerHTML = ''; // Clear previous content
            const mcqContainer = document.createElement('div');
            mcqContainer.classList.add('pdf-content-section'); // Outer container for MCQs section
            mcqContainer.innerHTML = note.processedData.mcqs 
                ? formatMCQs(note.processedData.mcqs) // Removed class parameter
                : '<p>No multiple choice questions available</p>';
            mcqElement.appendChild(mcqContainer);
        }
        
        // Display mind map if available
        const mindMapElement = document.getElementById('mindMap');
        if (mindMapElement) {
            // If you have a mind map rendering function, call it here
            if (note.processedData.mindMap) {
                renderMindMap(mindMapElement, note.processedData.mindMap);
            } else {
                mindMapElement.innerHTML = '<p class="text-gray-500 text-center py-4">No mind map available</p>';
            }
        }
        
        // Display YouTube keywords if available
        const keywordsElement = document.getElementById('youtubeKeywords');
        if (keywordsElement) {
            keywordsElement.innerHTML = note.processedData.youtubeKeywords 
                ? formatKeywordTags(note.processedData.youtubeKeywords)
                : '<p class="text-gray-500">No suggested keywords available</p>';
        }
    } else {
        // Handle case where processedData doesn't exist (older notes)
        // Display placeholder messages
        const placeholderMessage = 'This note was created before AI processing was added. To get AI insights, please create a new note with this content.';
        
        const summaryElement = document.getElementById('summary');
        if (summaryElement) summaryElement.innerHTML = `<p class="text-gray-500">${placeholderMessage}</p>`;
        
        const questionsElement = document.getElementById('questions');
        if (questionsElement) questionsElement.innerHTML = `<p class="text-gray-500">${placeholderMessage}</p>`;
        
        const mcqElement = document.getElementById('mcqs');
        if (mcqElement) mcqElement.innerHTML = `<p class="text-gray-500">${placeholderMessage}</p>`;
        
        const mindMapElement = document.getElementById('mindMap');
        if (mindMapElement) mindMapElement.innerHTML = `<p class="text-gray-500 text-center py-4">${placeholderMessage}</p>`;
        
        const keywordsElement = document.getElementById('youtubeKeywords');
        if (keywordsElement) keywordsElement.innerHTML = `<p class="text-gray-500">${placeholderMessage}</p>`;
    }
}

// Helper function to format keyword tags
function formatKeywordTags(keywords) {
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return '<p class="text-gray-500">No keywords available</p>';
    }
    
    return keywords.map(keyword => 
        `<span class="inline-block bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full mr-2 mb-2">${keyword}</span>`
    ).join('');
}

// Helper function to format list items
function formatListItems(items) { // itemClass removed
    if (!items || !Array.isArray(items) || items.length === 0) {
        return '<p>No items available</p>';
    }
    // Removed pdf-no-break from the outer div. CSS will handle li breaks.
    return `<div>
        <ul class="list-disc pl-5 space-y-1">
            ${items.map((item, index) => `<li class="leading-relaxed mb-2">${item}</li>`).join('')}
        </ul>
    </div>`;
}

// Helper function to format MCQs
function formatMCQs(mcqs) { // itemClass removed
    if (!mcqs || !Array.isArray(mcqs) || mcqs.length === 0) {
        return '<p>No multiple choice questions available</p>';
    }
    
    return mcqs.map((mcq, index) => {
        if (!mcq.question || !mcq.options) {
            return '';
        }
        
        // Ensure options is an array
        const options = Array.isArray(mcq.options) ? mcq.options : [];
        // Handle different answer formats (index number, letter, or full text)
        let correctAnswer = 'Not specified';
        if (mcq.answer !== undefined && mcq.answer !== null) {
            if (typeof mcq.answer === 'number' && mcq.answer >= 0 && mcq.answer < options.length) {
                correctAnswer = options[mcq.answer];
            } else if (typeof mcq.answer === 'string') {
                // Handle letter-based answers (a, b, c, d)
                const letterMatch = mcq.answer.match(/^[a-d]$/i);
                if (letterMatch) {
                    const letterIndex = mcq.answer.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
                    if (letterIndex >= 0 && letterIndex < options.length) {
                        correctAnswer = options[letterIndex];
                    }
                } else {
                    // Use the answer as-is (full text)
                    correctAnswer = mcq.answer;
                }
            }
        }
        
        // Apply pdf-no-break to each individual MCQ block
        return `
            <div class="mb-6 p-4 bg-gray-50 rounded-md pdf-no-break">
                <p class="font-semibold mb-3 text-gray-900">${index + 1}. ${mcq.question}</p>
                <ul class="list-none pl-0 space-y-1 mb-3">
                    ${options.map((option, optIndex) => `<li class="py-1 text-gray-700">${String.fromCharCode(97 + optIndex)}. ${option}</li>`).join('')}
                </ul>
                <p class="mt-3 text-green-700 font-semibold border-t pt-2">Answer: ${correctAnswer}</p>
            </div>
        `;
    }).filter(mcq => mcq !== '').join('');
}

// Enhanced mind map rendering function with proper error handling
function renderMindMap(container, mindMapData) {
    // Clear any existing content
    container.innerHTML = '';
    
    // Validate container element
    if (!container) {
        console.error('Mind map container element not found');
        return;
    }
    
    // Validate mind map data
    if (!mindMapData) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No mind map data available</p>';
        return;
    }
    
    try {
        // Handle different data formats
        if (typeof mindMapData === 'string') {
            // If it's a string, display it as text
            container.innerHTML = `<pre class="whitespace-pre-wrap text-sm text-gray-700 p-4 bg-gray-50 rounded">${mindMapData}</pre>`;
            return;
        }
        
        if (typeof mindMapData === 'object') {
            // Check if D3.js is available for proper mind map rendering
            if (typeof d3 !== 'undefined') {
                renderD3MindMap(container, mindMapData);
            } else {
                // Fallback to hierarchical text display
                renderTextMindMap(container, mindMapData);
            }
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Invalid mind map data format</p>';
        }
    } catch (error) {
        console.error('Error rendering mind map:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-4">Error rendering mind map</p>';
    }
}

// D3.js mind map rendering function
function renderD3MindMap(container, data) {
    try {
        // Set dimensions
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 250;
        
        // Clear container
        d3.select(container).selectAll("*").remove();
        
        // Create SVG
        const svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        // Create a simple tree layout
        const tree = d3.tree().size([width - 40, height - 40]);
        
        // Transform data to D3 hierarchy format
        const hierarchyData = transformToHierarchy(data);
        const root = d3.hierarchy(hierarchyData);
        
        // Generate the tree layout
        tree(root);
        
        // Create group element
        const g = svg.append("g")
            .attr("transform", "translate(20,20)");
        
        // Add links
        g.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .style("fill", "none")
            .style("stroke", "#6366f1")
            .style("stroke-width", 2);
        
        // Add nodes
        const node = g.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.y},${d.x})`);
        
        // Add circles for nodes
        node.append("circle")
            .attr("r", 5)
            .style("fill", "#6366f1")
            .style("stroke", "#ffffff")
            .style("stroke-width", 2);
        
        // Add text labels
        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -8 : 8)
            .style("text-anchor", d => d.children ? "end" : "start")
            .style("font-size", "12px")
            .style("fill", "#374151")
            .text(d => d.data.name);
            
    } catch (error) {
        console.error('Error rendering D3 mind map:', error);
        renderTextMindMap(container, data);
    }
}

// Fallback text-based mind map rendering
function renderTextMindMap(container, data) {
    try {
        let html = '<div class="mind-map-text p-4 bg-gray-50 rounded">';
        
        // Handle different object structures
        if (data.central || data.name) {
            const centralTopic = data.central || data.name;
            html += `<div class="text-center mb-4"><strong class="text-lg text-indigo-600">${centralTopic}</strong></div>`;
            
            if (data.branches && Array.isArray(data.branches)) {
                data.branches.forEach(branch => {
                    html += `<div class="mb-3">`;
                    html += `<div class="font-medium text-gray-800 mb-1">• ${branch.name}</div>`;
                    if (branch.children && Array.isArray(branch.children)) {
                        html += `<div class="ml-4">`;
                        branch.children.forEach(child => {
                            const childName = typeof child === 'string' ? child : child.name || 'Unknown';
                            html += `<div class="text-gray-600 text-sm">- ${childName}</div>`;
                        });
                        html += `</div>`;
                    }
                    html += `</div>`;
                });
            } else if (data.children && Array.isArray(data.children)) {
                data.children.forEach(child => {
                    const childName = typeof child === 'string' ? child : child.name || 'Unknown';
                    html += `<div class="mb-2 text-gray-700">• ${childName}</div>`;
                });
            }
        } else {
            // Fallback: display as JSON
            html += `<pre class="text-sm text-gray-700 whitespace-pre-wrap">${JSON.stringify(data, null, 2)}</pre>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error rendering text mind map:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-4">Error displaying mind map</p>';
    }
}

// Helper function to transform data to D3 hierarchy format
function transformToHierarchy(data) {
    if (data.central || data.name) {
        const root = {
            name: data.central || data.name,
            children: []
        };
        
        if (data.branches && Array.isArray(data.branches)) {
            root.children = data.branches.map(branch => ({
                name: branch.name,
                children: branch.children ? branch.children.map(child => ({
                    name: typeof child === 'string' ? child : child.name || 'Unknown'
                })) : []
            }));
        } else if (data.children && Array.isArray(data.children)) {
            root.children = data.children.map(child => ({
                name: typeof child === 'string' ? child : child.name || 'Unknown'
            }));
        }
        
        return root;
    }
    
    // Fallback structure
    return {
        name: 'Mind Map',
        children: [{ name: 'Data structure not recognized' }]
    };
}



// Export note to PDF - Enhanced with better error handling and proper content extraction
function exportToPdf(note) {
    // Hide any open modals first
    const confirmationModal = document.getElementById('deleteConfirmationModal');
    const shareNoteModal = document.getElementById('shareNoteModal');
    if (confirmationModal) confirmationModal.classList.add('hidden');
    if (shareNoteModal) shareNoteModal.classList.add('hidden');

    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessageDiv = document.getElementById('errorMessage');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (errorMessageDiv) errorMessageDiv.classList.add('hidden');

    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        console.error('html2pdf library not loaded');
        if (errorMessageDiv) {
            errorMessageDiv.textContent = 'PDF library not loaded. Please refresh the page and try again.';
            errorMessageDiv.classList.remove('hidden');
        }
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        return;
    }

    try {        // Get the PDF content element from the page
        const element = document.getElementById('pdfContent');
        if (!element) {
            console.error('PDF content element not found!');
            if (errorMessageDiv) {
                errorMessageDiv.textContent = 'Error: Could not find content to generate PDF.';
                errorMessageDiv.classList.remove('hidden');
            }
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            return;
        }

        // Show PDF header for generation
        element.classList.add('pdf-generating');
        const pdfHeader = element.querySelector('.pdf-header');
        if (pdfHeader) {
            pdfHeader.style.display = 'block';
        }

        // Generate filename from note title
        const noteTitleElement = document.getElementById('noteTitle');
        let filename = 'note_export.pdf';
        
        if (noteTitleElement && noteTitleElement.textContent.trim() !== 'Note Title' && noteTitleElement.textContent.trim() !== '') {
            // Sanitize title to be filename-friendly
            const safeTitle = noteTitleElement.textContent.trim()
                .replace(/[^a-zA-Z0-9\s_.-]/g, '') // Remove special characters
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .substring(0, 50); // Limit length
            filename = `${safeTitle}.pdf`;
        } else if (note && note.title) {
            const safeTitle = note.title.replace(/[^a-zA-Z0-9\s_.-]/g, '').replace(/\s+/g, '_').substring(0, 50);
            filename = `${safeTitle}.pdf`;
        }
        
        console.log(`Generating PDF with filename: ${filename}`);        // Enhanced PDF options for better structure and quality
        const opt = {
            margin: [12, 10, 12, 10], // Adjusted top/bottom margin slightly
            filename: filename,
            image: { type: 'jpeg', quality: 0.90 }, // Slightly adjusted quality
            html2canvas: {
                scale: 1.5,
                useCORS: true,
                letterRendering: true,
                logging: false,
                backgroundColor: '#ffffff',
                // Removed explicit width/height, let html2pdf handle based on content and jsPDF format
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true,
                putOnlyUsedFonts: true,
            },
            pagebreak: {
                mode: ['css', 'legacy'], // Rely more on CSS
                before: '.pdf-page-break-before',
                after: '.pdf-page-break-after',
                avoid: ['.pdf-no-break', 'img', 'figure', 'svg'] // Minimal avoid list
            }
        };// Generate and download the PDF
        html2pdf()
            .from(element)
            .set(opt)
            .save()
            .then(() => {
                console.log('PDF generation completed successfully.');
                // Hide PDF header and loading indicator
                element.classList.remove('pdf-generating');
                const pdfHeader = element.querySelector('.pdf-header');
                if (pdfHeader) {
                    pdfHeader.style.display = 'none';
                }
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
            })
            .catch((error) => {
                console.error('Error during PDF generation:', error);
                // Hide PDF header and loading indicator
                element.classList.remove('pdf-generating');
                const pdfHeader = element.querySelector('.pdf-header');
                if (pdfHeader) {
                    pdfHeader.style.display = 'none';
                }
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Failed to generate PDF: ' + (error.message || 'Unknown error occurred');
                    errorMessageDiv.classList.remove('hidden');
                    // Auto-hide error after 7 seconds
                    setTimeout(() => { 
                        if (errorMessageDiv) errorMessageDiv.classList.add('hidden'); 
                    }, 7000);
                }
            });

    } catch (error) {
        console.error('PDF export error:', error);
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (errorMessageDiv) {
            errorMessageDiv.textContent = 'PDF export failed: ' + (error.message || 'Unknown error occurred');
            errorMessageDiv.classList.remove('hidden');
            setTimeout(() => { 
                if (errorMessageDiv) errorMessageDiv.classList.add('hidden'); 
            }, 7000);
        }
    }
}

// Helper function to create printable content
function createPrintableContent(note) {
    let content = `
        <h1>${note.title || 'Untitled Note'}</h1>
        <div class="meta">Subject: ${note.subject || 'Not specified'}</div>
        
        <h2>Original Notes</h2>
        <div class="content">${note.content || ''}</div>
    `;
    
    const processedData = note.processedData || {};
    
    // Add summary
    if (processedData.summary) {
        content += `
            <h2>Summary</h2>
            <div class="content">${processedData.summary}</div>
        `;
    }
    
    // Add important questions
    if (processedData.questions && processedData.questions.length > 0) {
        content += `<h2>Important Questions</h2><ol>`;
        processedData.questions.forEach(question => {
            content += `<li>${question}</li>`;
        });
        content += `</ol>`;
    }
    
    // Add MCQs
    if (processedData.mcqs && processedData.mcqs.length > 0) {
        content += `<h2>Multiple Choice Questions</h2>`;
        processedData.mcqs.forEach((mcq, index) => {
            content += `
                <div class="mcq">
                    <div class="mcq-question">${index + 1}. ${mcq.question}</div>
                    <ol class="mcq-options">
                        ${mcq.options.map(option => `<li>${option}</li>`).join('')}
                    </ol>
                    <div class="mcq-answer">Answer: ${mcq.answer}</div>
                </div>
            `;
        });
    }
    
    // Add YouTube keywords
    if (processedData.youtubeKeywords && processedData.youtubeKeywords.length > 0) {
        content += `
            <h2>Suggested YouTube Keywords</h2>
            <div class="content">${processedData.youtubeKeywords.join(', ')}</div>
        `;
    }
    
    return content;
}

// Share functionality is now handled entirely by the HTML modal and inline scripts
// No additional shareNote function needed here