# Google Gemini Flash Character RolePlay

<div align="center">
  <img src="https://img.shields.io/badge/status-active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
</div>

## 🌟 [Try it now: GeminiCharacterRolePlay](https://geminicharacterroleplay.netlify.app/)

An interactive web application that allows users to create AI-powered characters and chat with them using Google's Gemini API. Leveraging Gemini's impressive 1 million token context window, this application provides a superior character roleplay experience with responsive interactions and consistent character behavior.

![Character Roleplay Demo](https://via.placeholder.com/800x400?text=Character+Roleplay+Demo)

## ✨ Features

- **Gemini API Integration**: Utilizes Google's Gemini Pro API for generating high-quality, contextually relevant character responses
- **Character Creation & Management**:
  - Create detailed character profiles with names and descriptions
  - Upload optional profile pictures
  - AI-powered context enhancement for deeper character lore
  - Edit characters anytime (note: editing will reset enhanced context)
- **iMessage-like Chat Interface**: Clean, modern chat UI inspired by Apple's iMessage design
- **Advanced Chat Features**:
  - Multi-character conversations
  - Regenerate AI responses
  - Edit responses
  - Create new chats with the same character
  - Access chat history with any character
- **Context Management**: Sophisticated system for maintaining character consistency throughout conversations
- **Customizable Settings**: Fine-tune the AI model parameters to get your preferred style of responses
- **Data Portability**: Export and import your data to use across different devices
- **Responsive Design**: Works seamlessly on desktop and most mobile devices (except Safari on mobile)

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [How to Use](#-how-to-use)
- [Contributing](#-contributing)
- [Browser Compatibility](#-browser-compatibility)
- [Privacy and Security](#-privacy-and-security)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

## 🚀 Getting Started

### Online Version

The easiest way to use the application is through the hosted version at:
[https://geminicharacterroleplay.netlify.app/](https://geminicharacterroleplay.netlify.app/)

### Running Locally

#### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, etc.)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

#### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/GeminiCharacterRP.git
   cd GeminiCharacterRP
   ```
2. Open `index.html` in your web browser
3. Go to the Settings tab and enter your Google Gemini API key
4. Start creating characters and chatting!

## 🎮 How to Use

### Setting Up Your API Key

1. Obtain a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. In the application, click on "Settings" in the navigation bar
3. Enter your API key in the provided field and click "Save"
4. Optionally adjust model parameters to fine-tune responses

### Creating Characters

1. Navigate to the "Characters" tab
2. Enter a name and description for your character
3. Optionally upload a profile picture
4. Click "Create Character"
5. Use "Enhance Context" to have the Gemini API generate a more detailed character profile

### Chatting with Characters

1. Go to the "Chat" tab
2. Select one or more characters from the sidebar
3. Click "Start Chat"
4. Type your message in the input field and press Enter or click the send button
5. Watch as your characters respond in real-time!

### Managing Conversations

- **Regenerate responses**: If you're not satisfied with a response, click the refresh icon to generate a new one
- **Edit responses**: Click on any AI response to edit it
- **Delete a message**: Hover over any message and click the "X" button that appears
- **Clear the entire chat**: Click the trash icon in the top-right corner of the chat window
- **Add/remove characters**: Select different characters from the sidebar and click "Update Chat"
- **Start a new chat**: Click "New Chat" to start a fresh conversation with the same character(s)
- **View chat history**: Access previous conversations through the history panel

### Data Management

- **Export data**: Go to Settings and use the Export function to save all your characters and chats
- **Import data**: Use the Import function to restore your data on another device
- **⚠️ Warning**: Exported data contains your API key. Remove it before sharing with others

## 👥 Contributing

Contributions are welcome and appreciated! This project was inspired by Character AI but aims to leverage Gemini's capabilities for even better roleplaying experiences.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes by running the `index.html` file locally
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request to the `test` branch (not directly to `main`)

All PRs should be directed to the `test` branch for testing before being merged into the `main` branch.

## 🌐 Browser Compatibility

- Works well on: Chrome, Firefox, Edge, and most modern browsers
- Known issues: Safari on mobile devices may experience some functionality problems
- Tested and optimized for both desktop and mobile interfaces

## 🔒 Privacy and Security

This application runs entirely in your browser. Your API key and conversation data are stored locally and are never sent to any server other than Google's API endpoints. The application uses localStorage to save your data between sessions.

When exporting your data, be aware that your API key is included in the export. Always remove your API key before sharing exported data with others.

## 📄 License

This project is open-source and available under the MIT License.

## 🙏 Acknowledgements

- Built with React.js and Tailwind CSS
- Uses the Google Gemini API for AI text generation
- Icons provided by Font Awesome
- Inspired by Character AI but enhanced with Gemini's 1M context window capabilities

---

<div align="center">
  Made with ❤️ by developers for roleplaying enthusiasts
</div>
