# Google Gemini Flash Character RolePlay

An interactive web application that allows users to create AI-powered characters and chat with them using Google's Gemini API. This application aims to provide a superior character roleplay experience with responsive interactions and consistent character behavior.

## Features

- **Gemini API Integration**: Utilizes Google's Gemini Flash 2.0 API for generating high-quality, contextually relevant character responses.
- **Character Creation & Management**: Create, enhance, and manage AI characters with detailed profiles.
- **iMessage-like Chat Interface**: Clean, modern chat UI inspired by Apple's iMessage design.
- **Multi-Character Conversations**: Add multiple characters to a single chat for group interactions.
- **Advanced Context Management**: Sophisticated system for maintaining character consistency throughout conversations, including proper handling of deleted messages.
- **Local Storage**: All data is stored locally in your browser. No server required.
- **Responsive Design**: Works seamlessly on both desktop and mobile devices.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (for running the server)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone this repository or download the code
2. Install the dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser and go to `http://localhost:3000`

### Running the Application

1. Open `http://localhost:3000` in your web browser.
2. Go to the Settings tab and enter your Google Gemini API key.
3. Navigate to the Characters tab to create your first character.
4. Go to the Chat tab, select one or more characters, and start chatting!

## How to Use

### Setting Up Your API Key

1. Obtain a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. In the application, click on "Settings" in the navigation bar.
3. Enter your API key in the provided field and click "Save".

### Creating Characters

1. Navigate to the "Characters" tab.
2. Enter a name and description for your character.
3. Click "Create Character".
4. Optionally, click "Enhance Context" to have the Gemini API generate a more detailed character profile.

### Chatting with Characters

1. Go to the "Chat" tab.
2. Select one or more characters from the sidebar.
3. Click "Start Chat".
4. Type your message in the input field and press Enter or click the send button.
5. Watch as your characters respond in real-time!

### Managing Conversations

- **Delete a message**: Hover over any message and click the "X" button that appears.
- **Clear the entire chat**: Click the trash icon in the top-right corner of the chat window.
- **Add/remove characters**: Select different characters from the sidebar and click "Update Chat".

## Privacy and Security

This application runs entirely in your browser. Your API key and conversation data are stored locally and are never sent to any server other than Google's API endpoints. The application uses localStorage to save your data between sessions.

## Troubleshooting

If you experience issues with the application:

1. Check the browser console for any error messages
2. Ensure your API key is correctly entered in the Settings tab
3. Make sure localStorage is enabled in your browser
4. Try clearing your browser cache and reloading the page

## License

This project is open-source and available under the MIT License.

## Acknowledgements

- Uses the Google Gemini API for AI text generation
- Icons provided by Font Awesome
- UI elements styled with Tailwind CSS
