// lib/api_client.js
// Handles communication with our serverless Python backend.

// In a real build, this URL would point to our deployed Cloud Function.
const API_BASE_URL = 'YOUR_SERVERLESS_BACKEND_URL_HERE'; 

export async function processUrl(url) {
    try {
        // We will replace this mock with a real fetch call later
        console.log(`Sending URL to backend: ${url}`);
        
        // Mocking the backend response for now
        const mockResponse = {
            success: true,
            title: `Clipped: ${url.substring(0, 50)}...`,
            cleanedContent: "This is the cleaned article content from the backend.",
            summary: "This is the AI-generated summary.",
            tags: ["mock", "clipping"]
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!mockResponse.success) {
            throw new Error(mockResponse.error || 'API processing failed');
        }

        return mockResponse;
        
    } catch (error) {
        console.error('API Client Error:', error);
        throw error;
    }
}
