// Constants
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const STORAGE_KEYS = {
    API_KEY: "gemini_api_key",
    CHARACTERS: "gemini_characters",
    CHATS: "gemini_chats",
};

// App State
let state = {
    apiKey: "",
    characters: [],
    chats: {},
    activeCharacters: [],
    activeChat: null,
    selectedCharacters: [], // For character selection in sidebar
};

// Helper functions
const generateUniqueId = () => Math.random().toString(36).substring(2, 11);

const getStoredItem = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage: ${error}`);
        return defaultValue;
    }
};

const setStoredItem = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing to localStorage: ${error}`);
        return false;
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Load data from localStorage
    loadStoredData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show API warning if needed
    checkApiKey();
    
    // Initialize views
    changeView('chat');
    updateCharacterLists();
});

// Load data from localStorage
function loadStoredData() {
    state.apiKey = getStoredItem(STORAGE_KEYS.API_KEY, "");
    state.characters = getStoredItem(STORAGE_KEYS.CHARACTERS, []);
    state.chats = getStoredItem(STORAGE_KEYS.CHATS, {});
    
    // Update API key input
    document.getElementById('api-key-input').value = state.apiKey;
}

// Set up event listeners
function setupEventListeners() {
    // Chat form submission
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
}

// View management
function changeView(viewName) {
    // Hide all views
    document.getElementById('chat-view').classList.add('hidden');
    document.getElementById('characters-view').classList.add('hidden');
    document.getElementById('settings-view').classList.add('hidden');
    
    // Reset active buttons
    document.getElementById('chat-btn').classList.remove('bg-white', 'text-primary');
    document.getElementById('chat-btn').classList.add('text-white');
    document.getElementById('characters-btn').classList.remove('bg-white', 'text-primary');
    document.getElementById('characters-btn').classList.add('text-white');
    document.getElementById('settings-btn').classList.remove('bg-white', 'text-primary');
    document.getElementById('settings-btn').classList.add('text-white');
    
    // Show selected view and activate button
    if (viewName === 'chat') {
        document.getElementById('chat-view').classList.remove('hidden');
        document.getElementById('chat-btn').classList.remove('text-white');
        document.getElementById('chat-btn').classList.add('bg-white', 'text-primary');
    } else if (viewName === 'characters') {
        document.getElementById('characters-view').classList.remove('hidden');
        document.getElementById('characters-btn').classList.remove('text-white');
        document.getElementById('characters-btn').classList.add('bg-white', 'text-primary');
    } else if (viewName === 'settings') {
        document.getElementById('settings-view').classList.remove('hidden');
        document.getElementById('settings-btn').classList.remove('text-white');
        document.getElementById('settings-btn').classList.add('bg-white', 'text-primary');
    }
}

// Check if API key is set
function checkApiKey() {
    const warningElement = document.getElementById('api-warning');
    if (!state.apiKey) {
        warningElement.classList.remove('hidden');
    } else {
        warningElement.classList.add('hidden');
    }
}

// Save API key
function saveApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    state.apiKey = apiKeyInput.value.trim();
    setStoredItem(STORAGE_KEYS.API_KEY, state.apiKey);
    
    // Show success message
    const savedMessage = document.getElementById('api-saved');
    savedMessage.classList.remove('hidden');
    setTimeout(() => {
        savedMessage.classList.add('hidden');
    }, 2000);
    
    // Update API warning
    checkApiKey();
}

// Error handling
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
}

function dismissError() {
    document.getElementById('error-container').classList.add('hidden');
}

// Character management
function createNewCharacter() {
    const nameInput = document.getElementById('character-name');
    const contextInput = document.getElementById('character-context');
    
    const name = nameInput.value.trim();
    const context = contextInput.value.trim();
    
    if (!name || !context) {
        showError("Please provide both a name and context for your character.");
        return;
    }
    
    const newCharacter = {
        id: generateUniqueId(),
        name,
        userContext: context,
        enhancedContext: null,
        createdAt: new Date().toISOString(),
    };
    
    state.characters.push(newCharacter);
    setStoredItem(STORAGE_KEYS.CHARACTERS, state.characters);
    
    // Clear inputs
    nameInput.value = '';
    contextInput.value = '';
    
    // Update character lists
    updateCharacterLists();
}

function enhanceCharacterContext(characterId) {
    if (!state.apiKey) {
        showError("Please set your Gemini API key in settings first");
        return;
    }
    
    const character = state.characters.find(c => c.id === characterId);
    if (!character) return;
    
    // Update UI to show enhancing status
    const enhanceButton = document.querySelector(`#enhance-btn-${characterId}`);
    enhanceButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enhancing...';
    enhanceButton.disabled = true;
    
    // Call API
    callEnhanceAPI(character.userContext)
        .then(enhancedContext => {
            // Update character
            character.enhancedContext = enhancedContext;
            setStoredItem(STORAGE_KEYS.CHARACTERS, state.characters);
            
            // Update UI
            updateCharacterLists();
        })
        .catch(error => {
            showError(`Failed to enhance character: ${error.message}`);
            
            // Reset button
            enhanceButton.innerHTML = '<i class="fas fa-magic mr-1"></i> Enhance Context';
            enhanceButton.disabled = false;
        });
}

async function callEnhanceAPI(userContext) {
    const prompt = `
        You are an expert character developer. Please transform the following brief character description into a detailed, rich character profile that can be used to guide an AI in roleplaying this character consistently. Include personality traits, speech patterns, background details, motivations, and typical behaviors.
        
        Brief description: "${userContext}"
        
        Provide a comprehensive and nuanced character profile (around 300-400 words):
    `;

    return await callGeminiAPI(state.apiKey, prompt, 0.8);
}

function deleteCharacter(characterId) {
    // Remove from characters array
    state.characters = state.characters.filter(c => c.id !== characterId);
    setStoredItem(STORAGE_KEYS.CHARACTERS, state.characters);
    
    // Remove from selected characters
    state.selectedCharacters = state.selectedCharacters.filter(id => id !== characterId);
    
    // Remove from active characters if present
    state.activeCharacters = state.activeCharacters.filter(c => c.id !== characterId);
    
    // Remove associated chats
    for (const chatId in state.chats) {
        if (chatId.includes(characterId)) {
            delete state.chats[chatId];
        }
    }
    setStoredItem(STORAGE_KEYS.CHATS, state.chats);
    
    // Update UI
    updateCharacterLists();
}

function updateCharacterLists() {
    // Update character list in Characters view
    const characterListContainer = document.getElementById('character-list');
    const noCharactersEl = document.getElementById('no-characters');
    
    if (state.characters.length === 0) {
        noCharactersEl.classList.remove('hidden');
        characterListContainer.innerHTML = '';
    } else {
        noCharactersEl.classList.add('hidden');
        
        characterListContainer.innerHTML = state.characters.map(character => `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg">${character.name}</h3>
                    <button
                        onclick="deleteCharacter('${character.id}')"
                        class="text-red-500 hover:text-red-700"
                        title="Delete character"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="mt-2">
                    <p class="text-sm text-gray-700 font-semibold">User-Provided Context:</p>
                    <p class="text-gray-600 text-sm mt-1">${character.userContext}</p>
                </div>
                
                ${character.enhancedContext ? `
                    <div class="mt-3 bg-gray-50 p-2 rounded">
                        <p class="text-sm text-gray-700 font-semibold">Enhanced Context:</p>
                        <p class="text-gray-600 text-sm mt-1 line-clamp-3">${character.enhancedContext.substring(0, 150)}...</p>
                    </div>
                ` : ''}
                
                <div class="mt-3">
                    <button
                        id="enhance-btn-${character.id}"
                        onclick="enhanceCharacterContext('${character.id}')"
                        ${!state.apiKey ? 'disabled' : ''}
                        class="text-sm bg-secondary text-white px-3 py-1 rounded hover:bg-secondary/90 transition disabled:bg-gray-400"
                    >
                        <i class="fas fa-magic mr-1"></i> Enhance Context
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Update sidebar character list
    const sidebarCharactersContainer = document.getElementById('sidebar-characters');
    
    if (state.characters.length === 0) {
        sidebarCharactersContainer.innerHTML = `
            <p class="text-gray-500 italic p-4 text-sm">
                No characters created yet. Go to Characters tab to create some.
            </p>
        `;
    } else {
        sidebarCharactersContainer.innerHTML = state.characters.map(character => `
            <div 
                id="sidebar-char-${character.id}"
                onclick="toggleCharacterSelection('${character.id}')"
                class="p-3 rounded mb-2 cursor-pointer character-item ${
                    state.selectedCharacters.includes(character.id)
                        ? 'bg-primary/10 border-primary/30 border' 
                        : 'hover:bg-gray-100 border border-transparent'
                }"
            >
                <div class="flex items-center">
                    <div class="character-avatar bg-primary/20 text-primary">
                        ${character.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="ml-2 overflow-hidden">
                        <p class="font-medium truncate">${character.name}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Update start chat button
    const startChatBtn = document.getElementById('start-chat-btn');
    startChatBtn.disabled = state.selectedCharacters.length === 0;
    startChatBtn.innerHTML = `
        <i class="fas fa-comments mr-1"></i> 
        ${state.activeCharacters.length > 0 ? 'Update Chat' : 'Start Chat'}
    `;
}

// Character selection in sidebar
function toggleCharacterSelection(characterId) {
    const index = state.selectedCharacters.indexOf(characterId);
    
    if (index === -1) {
        // Add to selection
        state.selectedCharacters.push(characterId);
    } else {
        // Remove from selection
        state.selectedCharacters.splice(index, 1);
    }
    
    // Update UI
    updateCharacterLists();
}

// Chat functionality
function startChat() {
    if (state.selectedCharacters.length === 0) {
        return;
    }
    
    // Generate chat ID
    const chatId = state.selectedCharacters.sort().join('-');
    state.activeChat = chatId;
    
    // Ensure chat exists in state
    if (!state.chats[chatId]) {
        state.chats[chatId] = [];
        setStoredItem(STORAGE_KEYS.CHATS, state.chats);
    }
    
    // Update active characters
    state.activeCharacters = state.characters.filter(c => state.selectedCharacters.includes(c.id));
    
    // Update UI
    updateChatUI();
}

function updateChatUI() {
    // Hide placeholder, show chat window
    document.getElementById('chat-placeholder').classList.add('hidden');
    document.getElementById('chat-window').classList.remove('hidden');
    
    // Update chat header
    const characterNames = state.activeCharacters.map(c => c.name).join(', ');
    document.getElementById('chat-header-title').textContent = characterNames;
    document.getElementById('chat-header-subtitle').textContent = 
        state.activeCharacters.length > 1 ? 'Group conversation' : 'Private conversation';
    
    // Update messages
    updateChatMessages();
}

function updateChatMessages() {
    if (!state.activeChat) return;
    
    const messagesContainer = document.getElementById('chat-messages');
    const messages = state.chats[state.activeChat] || [];
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="text-center text-gray-500 mt-8">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
    } else {
        messagesContainer.innerHTML = messages.map(message => createMessageHTML(message)).join('');
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function createMessageHTML(message) {
    if (message.isTyping) {
        return `
            <div class="flex">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
    }
    
    const character = message.isUser ? null : 
        state.characters.find(c => c.id === message.characterId) || { name: 'Character' };
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div 
            class="flex ${message.isUser ? 'justify-end' : 'justify-start'} ${message.isDeleted ? 'opacity-60' : ''}"
            onmouseenter="showMessageActions('${message.id}')"
            onmouseleave="hideMessageActions('${message.id}')"
        >
            ${!message.isUser && character ? `
                <div class="character-avatar bg-primary/20 text-primary self-end mb-1 mr-1">
                    ${character.name.charAt(0).toUpperCase()}
                </div>
            ` : ''}
            
            <div class="relative">
                ${!message.isUser && character ? `
                    <div class="text-xs text-gray-600 ml-2 mb-1">${character.name}</div>
                ` : ''}
                
                <div class="message-bubble ${message.isUser ? 'user-message' : 'character-message'} ${message.isDeleted ? 'deleted-message' : ''}">
                    ${message.content}
                    
                    ${!message.isDeleted ? `
                        <button
                            id="delete-msg-${message.id}"
                            onclick="deleteMessage('${message.id}')"
                            class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 transition hidden"
                        >
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    ` : ''}
                </div>
                
                <div class="text-xs text-gray-500 mt-1 ${message.isUser ? 'text-right mr-2' : 'ml-2'}">
                    ${time}
                </div>
            </div>
        </div>
    `;
}

// Message action buttons
function showMessageActions(messageId) {
    const deleteButton = document.getElementById(`delete-msg-${messageId}`);
    if (deleteButton) {
        deleteButton.classList.remove('hidden');
    }
}

function hideMessageActions(messageId) {
    const deleteButton = document.getElementById(`delete-msg-${messageId}`);
    if (deleteButton) {
        deleteButton.classList.add('hidden');
    }
}

function deleteMessage(messageId) {
    if (!state.activeChat) return;
    
    // Mark message as deleted
    const messages = state.chats[state.activeChat];
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex !== -1) {
        messages[messageIndex].isDeleted = true;
        setStoredItem(STORAGE_KEYS.CHATS, state.chats);
        
        // Update UI
        updateChatMessages();
    }
}

function clearChatMessages() {
    if (!state.activeChat) return;
    
    // Clear messages
    state.chats[state.activeChat] = [];
    setStoredItem(STORAGE_KEYS.CHATS, state.chats);
    
    // Update UI
    updateChatMessages();
}

function sendMessage() {
    if (!state.apiKey) {
        showError("Please set your Gemini API key in settings first");
        return;
    }
    
    if (!state.activeChat || state.activeCharacters.length === 0) {
        showError("Please select at least one character to chat with");
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    const userMessage = messageInput.value.trim();
    
    if (!userMessage) return;
    
    // Clear input
    messageInput.value = '';
    
    // Add user message
    const userMsg = {
        id: generateUniqueId(),
        content: userMessage,
        isUser: true,
        timestamp: new Date().toISOString(),
        isDeleted: false,
    };
    
    addMessage(userMsg);
    
    // Get response from each character
    state.activeCharacters.forEach(character => {
        getCharacterResponse(character, userMsg);
    });
}

function addMessage(message) {
    if (!state.activeChat) return;
    
    // Add message to chat
    if (!state.chats[state.activeChat]) {
        state.chats[state.activeChat] = [];
    }
    
    state.chats[state.activeChat].push(message);
    setStoredItem(STORAGE_KEYS.CHATS, state.chats);
    
    // Update UI
    updateChatMessages();
}

async function getCharacterResponse(character, userMsg) {
    // Add typing indicator
    const typingMsg = {
        id: generateUniqueId(),
        content: "typing...",
        isUser: false,
        characterId: character.id,
        timestamp: new Date().toISOString(),
        isTyping: true,
        isDeleted: false,
    };
    
    addMessage(typingMsg);
    
    try {
        // Prepare context
        const context = prepareContextForAPI(
            character,
            [...(state.chats[state.activeChat] || [])],
            state.activeCharacters
        );
        
        // Call API
        const response = await callGeminiAPI(state.apiKey, context);
        
        // Remove typing indicator and add actual response
        const messages = state.chats[state.activeChat];
        const typingIndex = messages.findIndex(m => m.id === typingMsg.id);
        
        if (typingIndex !== -1) {
            messages.splice(typingIndex, 1);
        }
        
        // Add actual response
        addMessage({
            id: generateUniqueId(),
            content: response,
            isUser: false,
            characterId: character.id,
            timestamp: new Date().toISOString(),
            isDeleted: false,
        });
    } catch (error) {
        showError(`Failed to get response: ${error.message}`);
        
        // Remove typing indicator
        const messages = state.chats[state.activeChat];
        const typingIndex = messages.findIndex(m => m.id === typingMsg.id);
        
        if (typingIndex !== -1) {
            messages.splice(typingIndex, 1);
            setStoredItem(STORAGE_KEYS.CHATS, state.chats);
            updateChatMessages();
        }
    }
}

// Context preparation for chat
function prepareContextForAPI(character, chatHistory, activeCharacters = []) {
    // Base context with character information
    let context = `You are roleplaying as ${character.name}. Here is your character profile:\n${character.enhancedContext || character.userContext}\n\n`;
    
    // If there are multiple active characters
    if (activeCharacters.length > 1) {
        context += "You are in a group conversation with the following other characters:\n";
        activeCharacters.forEach(char => {
            if (char.id !== character.id) {
                context += `- ${char.name}: ${char.userContext}\n`;
            }
        });
        context += "\n";
    }
    
    // Add conversation history
    context += "The following is the conversation so far (some messages may be marked as [DELETED], which means they should be ignored and considered non-canonical):\n\n";
    
    chatHistory.forEach(msg => {
        let prefix = "";
        if (msg.isUser) {
            prefix = "User: ";
        } else {
            const sender = activeCharacters.find(c => c.id === msg.characterId);
            prefix = `${sender?.name || 'Character'}: `;
        }
        
        let messageText = msg.isDeleted ? `[DELETED] ${msg.content}` : msg.content;
        context += prefix + messageText + "\n";
    });
    
    // Final instruction
    context += `\nRespond as ${character.name}, maintaining character consistency and addressing the most recent message. Only provide ${character.name}'s response, without any additional text, narration, or explanations.`;
    
    return context;
}

// API communication
async function callGeminiAPI(apiKey, prompt, temperature = 0.7) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: 800,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw error;
    }
}
