// Maverick API configuration
const MAVERICK_API_KEY = 'YOUR_MAVERICK_API_KEY'; // Your OpenRouter API key
const MAVERICK_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Process notes with Maverick API
async function processNotesWithMaverick(notes, subject = '') {
    try {
        const prompt = createMaverickPrompt(notes, subject);
        
        const response = await fetch(MAVERICK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAVERICK_API_KEY}`
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-maverick:free",
                messages: [{
                    role: "user",
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            // If response is not OK, read the response as text, as it might be an error string
            const errorText = await response.text();
            console.error('Maverick API error response text:', errorText);
            // Try to parse as JSON in case the error is structured, but prioritize the text if parsing fails
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson?.error?.message || errorJson?.message || errorText;
            } catch (e) {
                // Parsing failed, stick with the raw error text
            }
            console.error('Maverick API error details:', errorMessage);
            throw new Error(`Maverick API error: ${errorMessage || response.statusText}`);
        }
        
        // Log the raw response data for debugging if response is OK
        const responseData = await response.json();
        console.log('Maverick API Response Data:', responseData);
        return parseMaverickResponse(responseData);
    } catch (error) {
        console.error('Error processing notes with Maverick:', error);
        throw error;
    }
}

// Create prompt for Maverick API
function createMaverickPrompt(notes, subject) {
    return `
You are an educational AI assistant. I\'ll provide you with class notes, and I need you to analyze them and generate the following:

1. A detailed summary (around 400-500 words) that thoroughly explains the key concepts. Include illustrative examples where appropriate to enhance understanding. Identify and highlight important keywords, definitions, and concepts within the summary by enclosing them in double asterisks (e.g., **keyword**).
2. 5-8 important questions that test understanding of the material.
3. 10 multiple-choice questions with answers (mark the correct answer with *).
4. 6-8 diverse and highly relevant YouTube search keywords. Focus on terms that directly relate to the core concepts and offer practical insights or visual explanations of the material presented in the notes.

${subject ? `Subject: ${subject}` : ''}

Class Notes:
${notes}

Please format your response exactly as follows:

SUMMARY:
[Your summary here]

IMPORTANT QUESTIONS:
1. [Question 1]
2. [Question 2]
...

MULTIPLE CHOICE QUESTIONS:
1. [Question]
   a) [Option A]
   b) [Option B]*
   c) [Option C]
   d) [Option D]
...

YOUTUBE KEYWORDS:
[keyword1], [keyword2], [keyword3], ...
`;
}

// Parse Maverick API response (OpenRouter format)
function parseMaverickResponse(response) {
    try {
        // Use OpenRouter API response format
        const text = response.choices[0].message.content;
        
        // Extract sections using regex (more flexible)
        const summaryMatch = text.match(/(?:SUMMARY:|Summary:|1\.\s*Summary:)?([\s\S]*?)(?:IMPORTANT QUESTIONS:|Important Questions:|2\.\s*Important Questions:|$)/i);
        const questionsMatch = text.match(/(?:IMPORTANT QUESTIONS:|Important Questions:|2\.\s*Important Questions:)?([\s\S]*?)(?:MULTIPLE CHOICE QUESTIONS:|Multiple Choice Questions:|3\.\s*Multiple Choice Questions:|$)/i);
        const mcqsMatch = text.match(/(?:MULTIPLE CHOICE QUESTIONS:|Multiple Choice Questions:|3\.\s*Multiple Choice Questions:)?([\s\S]*?)(?:YOUTUBE KEYWORDS:|Youtube Keywords:|4\.\s*Youtube Keywords:|$)/i);
        const keywordsMatch = text.match(/(?:YOUTUBE KEYWORDS:|Youtube Keywords:|4\.\s*Youtube Keywords:)?([\s\S]*?)(?=$)/i); // Adjusted to end at string end
        
        // Format keywords as array
        let keywords = [];
        if (keywordsMatch && keywordsMatch[1]) {
            keywords = keywordsMatch[1].trim().split(/,|\n/).map(k => k.trim()).filter(k => k);
        }
        
        return {
            summary: summaryMatch ? summaryMatch[1].trim() : '',
            questions: questionsMatch ? questionsMatch[1].trim() : '',
            mcqs: mcqsMatch ? mcqsMatch[1].trim() : '',
            keywords: keywords
        };
    } catch (error) {
        console.error('Error parsing Maverick response:', error);
        throw new Error('Failed to parse AI response');
    }
}

// Function to process notes with Maverick AI - Enhanced with better error handling
async function processNoteWithMaverick(noteTitle, noteContent, subject) {
    try {
        console.log('Processing note with Maverick:', noteTitle);
        
        // Validate inputs
        if (!noteTitle || !noteContent) {
            throw new Error('Note title and content are required');
        }
        
        if (!MAVERICK_API_KEY) {
            throw new Error('Maverick API key is not configured');
        }
        
        // Create a prompt that includes the note title and content
        const prompt = `
You are an educational AI assistant. I\'ll provide you with class notes, and I need you to analyze them and generate the following:

1. A detailed summary (around 400-500 words) that thoroughly explains the key concepts. Include illustrative examples where appropriate to enhance understanding. Identify and highlight important keywords, definitions, and concepts within the summary by enclosing them in double asterisks (e.g., **keyword**).
2. 5-8 important questions that test understanding of the material.
3. 10 multiple-choice questions with answers (mark the correct answer with *).
4. 6-8 diverse and highly relevant YouTube search keywords. Focus on terms that directly relate to the core concepts and offer practical insights or visual explanations of the material presented in the notes.

Title: ${noteTitle}
${subject ? `Subject: ${subject}` : ''}

Class Notes:
${noteContent}

Please format your response exactly as follows:

SUMMARY:
[Your summary here]

IMPORTANT QUESTIONS:
1. [Question 1]
2. [Question 2]
...

MULTIPLE CHOICE QUESTIONS:
1. [Question]
   a) [Option A]
   b) [Option B]*
   c) [Option C]
   d) [Option D]
...

YOUTUBE KEYWORDS:
[keyword1], [keyword2], [keyword3], ...
`;

        console.log('Sending request to Maverick API...');
        
        // Make the actual API call to Maverick with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(MAVERICK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAVERICK_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Smart Notes AI'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 2000,
                temperature: 0.7
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Enhanced error handling
            let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error.message || errorData.error || errorMessage;
                }
            } catch (parseError) {
                // If error response isn't JSON, use the status text
                console.warn('Could not parse error response as JSON:', parseError);
            }
            
            console.error('Maverick API error:', errorMessage);
            throw new Error(errorMessage);
        }
        
        // Log the raw response data for debugging if response is OK
        const data = await response.json();
        console.log('Received response from Maverick API');
        console.log('Raw data from Maverick API:', JSON.stringify(data, null, 2));
        
        // Validate response structure
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from Maverick API');
        }
        
        // Parse the response from OpenRouter API format
        const text = data.choices[0].message.content;
        
        if (!text || text.trim().length === 0) {
            throw new Error('Empty response from Maverick API');
        }
        
        console.log('Attempting to parse text:', text);
        
        // Parse the response with improved regex patterns
        return parseEnhancedMaverickResponse(text, noteTitle);
        
    } catch (error) {
        console.error('Error processing note with Maverick:', error);
        
        // Provide more specific error messages
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check your internet connection and try again.');
        } else {
            throw error;
        }
    }
}

// Enhanced response parsing function
function parseEnhancedMaverickResponse(text, noteTitle) {
    try {
        // Pattern to match content within markdown bold, e.g., (details) in **Header (details)**
        // Needs double escaping for backslashes in a string that becomes a RegExp
        const insideBoldPattern = "(?:[^\\\\*]|\\\\*(?!\\\\*))*"; 

        // Regex for Summary
        const summaryRegex = new RegExp(
            `(?:SUMMARY:|\\\\*\\\\*Summary${insideBoldPattern}\\\\*\\\\*)\\s*([\\s\\S]*?)(?=\\s*(?:IMPORTANT QUESTIONS:|\\\\*\\\\*Important Questions${insideBoldPattern}\\\\*\\\\*|MULTIPLE CHOICE QUESTIONS:|\\\\*\\\\*Multiple Choice Questions${insideBoldPattern}\\\\*\\\\*|MCQ|MCQs:|YOUTUBE KEYWORDS:|\\\\*\\\\*YouTube Search Keywords${insideBoldPattern}\\\\*\\\\*|KEYWORDS:|$))`, "i"
        );
        const summaryMatch = text.match(summaryRegex);

        // Regex for Important Questions
        const questionsRegex = new RegExp(
            `(?:IMPORTANT QUESTIONS:|\\\\*\\\\*Important Questions${insideBoldPattern}\\\\*\\\\*)\\s*([\\s\\S]*?)(?=\\s*(?:MULTIPLE CHOICE QUESTIONS:|\\\\*\\\\*Multiple Choice Questions${insideBoldPattern}\\\\*\\\\*|MCQ|MCQs:|YOUTUBE KEYWORDS:|\\\\*\\\\*YouTube Search Keywords${insideBoldPattern}\\\\*\\\\*|KEYWORDS:|$))`, "i"
        );
        const questionsMatch = text.match(questionsRegex);

        // Regex for MCQs
        const mcqsRegex = new RegExp(
            `(?:MULTIPLE CHOICE QUESTIONS:|\\\\*\\\\*Multiple Choice Questions${insideBoldPattern}\\\\*\\\\*|MCQ|MCQs:)\\s*([\\s\\S]*?)(?=\\s*(?:YOUTUBE KEYWORDS:|\\\\*\\\\*YouTube Search Keywords${insideBoldPattern}\\\\*\\\\*|KEYWORDS:|$))`, "i"
        );
        const mcqsMatch = text.match(mcqsRegex);

        // Regex for YouTube Keywords
        const keywordsRegex = new RegExp(
            `(?:YOUTUBE KEYWORDS:|\\\\*\\\\*YouTube Search Keywords${insideBoldPattern}\\\\*\\\\*|KEYWORDS:)\\s*([\\s\\S]*?)(?=$)`, "i" // Adjusted to look for end of string
        );
        const keywordsMatch = text.match(keywordsRegex);
        
        // Parse questions with better handling
        let questions = [];
        if (questionsMatch && questionsMatch[1]) {
            let textBlock = questionsMatch[1].trim();

            // Remove potential outer list marker (like "1.") and bolding if it's wrapping the entire question block
            // e.g., "1. ** ...questions... **" or "** ...questions... **" or "• ** ...questions... **"
            // Also handles cases where the AI might add a leading list item marker like "- " or "* "
            textBlock = textBlock.replace(/^(\s*[-•*]\s*|\s*\d+\.\s*)?\s*\*\*/, '').replace(/\s*\*\*$/, '').trim();

            // Now, textBlock should be closer to "1. Question one 2. Question two..." or just "Question one 2. Question two..."
            // Split by the question numbering (e.g., "1. ", "2. "). 
            // This regex looks for optional whitespace, a number, a dot, and then mandatory whitespace.
            // It will also handle cases where questions might be separated by newlines before the numbering.
            questions = textBlock.split(/\r?\n?\s*\d+\.\s+/)
                .map(q => q.trim()) // Trim whitespace from each potential question part
                .filter(q => q.length > 0) // Filter out any empty strings that result from split
                .slice(0, 8); // Limit to 8 questions
        }
        // Parse MCQs with enhanced error handling
        let mcqs = [];
        if (mcqsMatch && mcqsMatch[1]) {
            mcqs = parseEnhancedMCQs(mcqsMatch[1].trim());
        }
        
        // Parse keywords with better filtering
        let youtubeKeywords = [];
        if (keywordsMatch && keywordsMatch[1]) {
            youtubeKeywords = keywordsMatch[1]
                .trim()
                .split(/,|\n/)
                .map(k => k.trim())
                .filter(k => k && k.length > 2) // Ensure keywords are meaningful
                .slice(0, 8); // Limit to 8 keywords as per the updated prompt
        }
        
        // REMOVED: const mindMap = createStructuredMindMap(noteTitle, questions, youtubeKeywords, mindMapMatch);
        
        // Validate and clean extracted data
        const extractedSummary = summaryMatch ? summaryMatch[1].trim() : '';
          console.log('Extracted Summary:', extractedSummary);
        console.log('Processed Questions Array:', questions);
        console.log('Processed MCQs Array:', mcqs);
        console.log('Processed Keywords Array:', youtubeKeywords);

        // Create the processed data object
        const processedData = {
            summary: extractedSummary || 'No summary could be generated.',
            questions: questions.length > 0 ? questions : ['What are the main concepts in this note?'],
            mcqs: mcqs.length > 0 ? mcqs : [],
            // REMOVED: mindMap: mindMap,
            youtubeKeywords: youtubeKeywords.length > 0 ? youtubeKeywords : [noteTitle]
        };
        
        console.log('Final Processed data before returning:', processedData);
        return processedData;
        
    } catch (error) {
        console.error('Error parsing enhanced Maverick response:', error);
        
        // Return fallback data instead of throwing
        return {
            summary: 'Error occurred while processing the note content.',
            questions: ['What are the main points discussed in this note?'],
            mcqs: [],
            // REMOVED: mindMap: { name: noteTitle, children: [{ name: 'Processing Error' }] },
            youtubeKeywords: [noteTitle]
        };
    }
}

// Enhanced MCQ parsing function
function parseEnhancedMCQs(mcqsText) {
    try {
        const mcqBlocks = mcqsText.split(/\d+\.\s*/).filter(q => q.trim().length > 0);
        
        return mcqBlocks.map(block => {
            const lines = block.split('\n').filter(line => line.trim().length > 0);
            if (lines.length === 0) return null;
            
            const question = lines[0].trim();
            const options = [];
            let correctAnswerIndex = 0;
              for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                // More flexible option matching - handle both a) and a.
                const optionMatch = line.match(/^([a-d])[\)\.]?\s*(.+)/i);
                
                if (optionMatch) {
                    const option = optionMatch[2].trim();
                    const cleanOption = option.replace(/\*$/, '');
                    options.push(cleanOption);
                      // Check if this option is marked as correct (with *)
                    if (option.endsWith('*')) {
                        correctAnswerIndex = options.length - 1;
                    }
                }
            }            if (options.length < 2) return null; // Skip invalid MCQs
            
            const mcqResult = {
                question,
                options,
                answer: options[correctAnswerIndex] || options[0]
            };
            
            return mcqResult;
        }).filter(mcq => mcq !== null);
    } catch (error) {
        console.error('Error parsing MCQs:', error);
        return [];
    }
}

// REMOVED: function createStructuredMindMap(noteTitle, questions, keywords, mindMapMatch) { ... }