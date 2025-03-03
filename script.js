// Constants
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
const STORAGE_KEYS = {
    API_KEY: "gemini_api_key",
    CHARACTERS: "gemini_characters",
    CHATS: "gemini_chats",
    SETTINGS: "gemini_settings",
};

// Mobile browser viewport fix for keyboard
function setupMobileViewportFix() {
    // Only apply on mobile devices
    if (window.innerWidth > 768) return;
    
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport.getAttribute('content');
    
    // Fix for iOS keyboard issues
    const chatInput = document.getElementById('message-input');
    if (chatInput) {
        // When chat input gets focus (keyboard shows)
        chatInput.addEventListener('focus', () => {
            // Prevent viewport from auto-zooming
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
            
            // Scroll to the input after a brief delay to ensure keyboard is fully shown
            setTimeout(() => {
                chatInput.scrollIntoView(false);
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 300);
        });
        
        // When keyboard hides
        chatInput.addEventListener('blur', () => {
            // Restore original viewport settings
            viewport.setAttribute('content', originalContent);
        });
    }
    
    // Handle window resize (for when keyboard appears/disappears)
    let windowHeight = window.innerHeight;
    window.addEventListener('resize', () => {
        // If the window height changes dramatically (keyboard appearing)
        if (window.innerHeight < windowHeight) {
            // When keyboard appears, make sure chat input is visible
            if (document.activeElement === chatInput) {
                setTimeout(() => {
                    chatInput.scrollIntoView(false);
                }, 100);
            }
        } else {
            // When keyboard disappears, make sure we're at the right position
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }
        windowHeight = window.innerHeight;
    });
    
    // Fix scrolling for different views
    const setupViewScrolling = () => {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // Fix scrolling for settings view
        const settingsView = document.getElementById('settings-view');
        if (settingsView) {
            if (isIOSDevice) {
                settingsView.style.webkitOverflowScrolling = 'touch';
            }
        }
        
        // Fix scrolling for characters view
        const charactersView = document.getElementById('characters-view');
        if (charactersView) {
            if (isIOSDevice) {
                charactersView.style.webkitOverflowScrolling = 'touch';
            }
        }
        
        // Update the height calculation when the view changes
        const updateViewLayout = () => {
            // Get active view
            const activeView = document.querySelector('#chat-view:not(.hidden), #settings-view:not(.hidden), #characters-view:not(.hidden)');
            
            if (activeView) {
                if (activeView.id === 'chat-view') {
                    document.body.classList.add('chat-view-active');
                    
                    // Make sure chat input is visible on iOS
                    if (isIOSDevice) {
                        const chatForm = document.querySelector('#chat-window > div:last-of-type');
                        if (chatForm) {
                            chatForm.style.position = 'fixed';
                            chatForm.style.bottom = '0';
                            chatForm.style.left = '0';
                            chatForm.style.right = '0';
                            chatForm.style.zIndex = '100';
                        }
                    }
                } else {
                    document.body.classList.remove('chat-view-active');
                    
                    // Force a small delay and then scroll to top
                    setTimeout(() => {
                        window.scrollTo(0, 0);
                        activeView.scrollTop = 0;
                    }, 100);
                }
            }
        };
        
        // Initial update
        updateViewLayout();
        
        // Update when view changes
        const viewButtons = document.querySelectorAll('[onclick^="changeView"]');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Small delay to ensure DOM is updated
                setTimeout(updateViewLayout, 50);
            });
        });
    };
    
    // Initialize view scrolling fixes
    setupViewScrolling();
}

// App Settings
let appSettings = {
    allowGroupChats: false,
    modelVersion: "gemini-2.0-flash",
    temperature: 1.1,
    maxTokens: 1200,
    topK: 40,
    topP: 0.95,
};

// App State
let state = {
    apiKey: "",
    characters: [],
    chats: {},
    activeCharacters: [],
    activeChat: null,
    selectedCharacters: [], // For character selection in sidebar
    geminiModel: null, // Store the model reference
    isApiConnected: false // Track API connection status
};

// Add Gemini AI SDK
// Dynamically load the Gemini AI SDK
function loadGeminiSDK() {
    return new Promise((resolve, reject) => {
        if (window.GoogleGenerativeAI) {
            resolve(window.GoogleGenerativeAI);
            return;
        }

        // Use the official Gemini CDN URL
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@google/generative-ai@0.1.3/dist/index.min.js";
        script.async = true;
        script.onload = () => {
            console.log("Gemini SDK loaded successfully");
            resolve(window.GoogleGenerativeAI);
        };
        script.onerror = () => {
            console.error("Failed to load Gemini SDK from CDN");
            reject(new Error("Failed to load Gemini SDK"));
        };
        document.head.appendChild(script);
    });
}

// Initialize Gemini API
async function initializeGeminiAPI() {
    if (!state.apiKey) {
        console.log("No API key available");
        return false;
    }

    try {
        const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");

        // Create the Gemini instance
        const genAI = new GoogleGenerativeAI(state.apiKey);

        // Get model from settings and store it in state
        state.geminiModel = genAI.getGenerativeModel({ 
            model: appSettings.modelVersion || "gemini-2.0-flash" 
        });

        // Test the API connection
        const result = await state.geminiModel.generateContent("Hello, testing Gemini API connection.");
        console.log("API connection test successful:", result.response.text().substring(0, 20) + "...");

        state.isApiConnected = true;
        return true;
    } catch (error) {
        console.error("Failed to initialize Gemini API:", error);
        showError(`Failed to connect to Gemini API: ${error.message}`);
        state.isApiConnected = false;
        return false;
    }
}

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
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded - initializing app");
    
    // Load data from localStorage
    loadStoredData();

    // Initialize views
    changeView('chat');
    
    // Update character lists
    updateCharacterLists();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize mobile viewport fixes
    setupMobileViewportFix();
    
    // Add direct event listeners for critical functionality
    setupDirectListeners();
    
    // Show API warning if needed
    checkApiKey();
    
    // Initialize Gemini API if key is available
    if (state.apiKey) {
        try {
            const success = await initializeGeminiAPI();
            if (success) {
                console.log("Gemini API initialized successfully");
                // Update UI to show connection status
                const apiWarning = document.getElementById('api-warning');
                if (apiWarning) {
                    apiWarning.classList.add('hidden');
                }
                // Show success message
                showSuccess("API connected successfully", 3000);
            }
        } catch (error) {
            console.error("Error initializing Gemini API:", error);
        }
    }

    // Set up test chat form for easier testing
    setupTestChatForm();

    // Initialize sidebar functionality
    initializeSidebar();

    // Initialize model settings
    initializeModelSettings();
});

// Initialize sidebar functionality
function initializeSidebar() {
    const sidebar = document.getElementById('character-sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const showCharactersBtn = document.getElementById('show-characters-btn');
    const showChatSidebarBtn = document.getElementById('show-chat-sidebar-btn');
    const chatView = document.getElementById('chat-view');
    const header = document.querySelector('header');
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
    }
    
    // Function to adjust sidebar position based on header height
    function adjustSidebarPosition() {
        if (window.innerWidth < 1024) {
            const headerHeight = header.offsetHeight;
            sidebar.style.top = `${headerHeight}px`;
            
            // Update main content padding to account for fixed header
            const main = document.querySelector('main');
            if (main) {
                main.style.paddingTop = `${headerHeight}px`;
            }
            
            // Update height and max-height to ensure proper scrolling
            sidebar.style.height = `calc(100vh - ${headerHeight}px)`;
            sidebar.style.maxHeight = `calc(100vh - ${headerHeight}px)`;
        } else {
            sidebar.style.top = '';
            sidebar.style.height = '';
            sidebar.style.maxHeight = '';
            
            // Reset main padding for desktop
            const main = document.querySelector('main');
            if (main) {
                main.style.paddingTop = '';
            }
        }
    }
    
    // Call initially to set the correct position
    adjustSidebarPosition();
    
    // Add click events for all toggle buttons
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
    if (showCharactersBtn) showCharactersBtn.addEventListener('click', toggleSidebar);
    if (showChatSidebarBtn) showChatSidebarBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
    
    // Close sidebar on chat start in mobile view
    const originalStartChat = startChat;
    startChat = function() {
        originalStartChat();
        if (window.innerWidth < 1024) { // lg breakpoint
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
            chatView.classList.add('chat-active');
        }
    };
    
    // Handle scroll events to ensure sidebar stays fixed
    window.addEventListener('scroll', () => {
        if (window.innerWidth < 1024) {
            // No need to reposition on scroll since it's fixed in CSS
            // But we can add this as a hook for any future scroll-based adjustments
        }
    });
    
    // Handle resize events
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        }
        adjustSidebarPosition();
    });
}

// Set up direct click handlers that don't rely on generated HTML
function setupDirectListeners() {
    // Menu buttons
    document.querySelectorAll('[id$="-btn"]').forEach(button => {
        if (button.id === 'chat-btn') {
            button.addEventListener('click', () => changeView('chat'));
        } else if (button.id === 'characters-btn') {
            button.addEventListener('click', () => changeView('characters'));
        } else if (button.id === 'settings-btn') {
            button.addEventListener('click', () => changeView('settings'));
        } else if (button.id === 'test-chat-btn') {
            button.addEventListener('click', () => forceOpenChat());
        }
    });

    // Character create button
    const createCharBtn = document.getElementById('create-character-btn');
    if (createCharBtn) {
        createCharBtn.addEventListener('click', createNewCharacter);
    }

    // Error dismiss button
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.querySelector('button').addEventListener('click', dismissError);
    }
}

// Set up a fallback chat form handler for testing
function setupTestChatForm() {
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        // Remove existing listeners and add test listener
        const clonedForm = chatForm.cloneNode(true);
        chatForm.parentNode.replaceChild(clonedForm, chatForm);
        
        clonedForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Chat form submitted via test handler");
            
            // Use API function if connected, otherwise fall back to test
            if (state.isApiConnected && state.apiKey) {
                sendMessage();
            } else {
                testSendMessage();
            }
        });
    }
}

// Load data from localStorage
function loadStoredData() {
    // Load API key
    state.apiKey = getStoredItem(STORAGE_KEYS.API_KEY, "");
    
    // Load characters and chats
    state.characters = getStoredItem(STORAGE_KEYS.CHARACTERS, []);
    state.chats = getStoredItem(STORAGE_KEYS.CHATS, {});
    
    // Load app settings
    const storedSettings = getStoredItem(STORAGE_KEYS.SETTINGS, null);
    if (storedSettings) {
        appSettings = {...appSettings, ...storedSettings};
    }
    
    // Set up the UI based on loaded data
    const apiKeyInput = document.getElementById('api-key-input');
    if (apiKeyInput && state.apiKey) {
        apiKeyInput.value = state.apiKey;
    }
    
    // Set the group chat checkbox state
    const groupChatCheckbox = document.getElementById('allow-group-chats');
    if (groupChatCheckbox) {
        groupChatCheckbox.checked = appSettings.allowGroupChats;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Chat form submission
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');

    if (chatForm && messageInput) {
        // Handle form submission
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });

        // Handle message input keydown
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Shift+Enter: insert newline
                    e.preventDefault();
                    const start = messageInput.selectionStart;
                    const end = messageInput.selectionEnd;
                    const value = messageInput.value;
                    messageInput.value = value.substring(0, start) + '\n' + value.substring(end);
                    messageInput.selectionStart = messageInput.selectionEnd = start + 1;
                } else {
                    // Just Enter: submit if not empty
                    if (messageInput.value.trim()) {
                        e.preventDefault();
                        sendMessage();
                    }
                }
            }
        });

        // Auto-resize input height based on content
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
        });
    }

    // Make sidebar character items clickable
    updateSidebarCharacterListeners();
    
    // Save API Key button
    const saveButton = document.getElementById('save-api-key-btn');
    if (saveButton) {
        saveButton.addEventListener('click', saveApiKey);
    } else {
        // If no save button, implement API key input event listener
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveApiKey();
                }
            });
        }
    }
}

// Update sidebar character event listeners
function updateSidebarCharacterListeners() {
    console.log("Updating sidebar character listeners"); // Debug log

    // This ensures characters are clickable even if onclick attribute doesn't work
    state.characters.forEach(character => {
        const element = document.getElementById(`sidebar-char-${character.id}`);
        if (element) {
            // Remove old event listener to avoid duplicates
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);

            // Add fresh event listener
            newElement.addEventListener('click', function(event) {
                event.preventDefault();
                console.log("Character clicked via event listener:", character.id);
                toggleCharacterSelection(character.id);
            });
        } else {
            console.warn(`Sidebar character element for ${character.id} not found`);
        }
    });

    // Also make sure the Start Chat button has its event listener
    // removed it
}

// View management
function changeView(viewName) {
    // Hide all views
    const views = ['chat-view', 'characters-view', 'settings-view'];
    views.forEach(view => {
        const element = document.getElementById(view);
        if (element) {
            element.classList.add('hidden');
            if (view === 'chat-view') {
                element.classList.remove('chat-active');
            }
        }
    });
    
    // Reset active buttons
    const buttons = ['chat-btn', 'characters-btn', 'settings-btn'];
    buttons.forEach(btn => {
        const element = document.getElementById(btn);
        if (element) {
            element.classList.remove('bg-white', 'text-primary');
            element.classList.add('text-white');
        }
    });
    
    // Toggle body class for fixed positioning only in chat view
    if (viewName === 'chat') {
        document.body.classList.add('chat-view-active');
    } else {
        document.body.classList.remove('chat-view-active');
    }
    
    // Show selected view and activate button
    if (viewName === 'chat') {
        const view = document.getElementById('chat-view');
        const btn = document.getElementById('chat-btn');
        if (view) {
            view.classList.remove('hidden');
            updateCharacterLists(); // Refresh the list when switching views
            
            // Add chat-active class if there's an active chat
            if (state.activeChat) {
                view.classList.add('chat-active');
            }
        }
        if (btn) {
            btn.classList.remove('text-white');
            btn.classList.add('bg-white', 'text-primary');
        }
    } else if (viewName === 'characters') {
        const view = document.getElementById('characters-view');
        const btn = document.getElementById('characters-btn');
        if (view) view.classList.remove('hidden');
        if (btn) {
            btn.classList.remove('text-white');
            btn.classList.add('bg-white', 'text-primary');
        }
    } else if (viewName === 'settings') {
        const view = document.getElementById('settings-view');
        const btn = document.getElementById('settings-btn');
        if (view) view.classList.remove('hidden');
        if (btn) {
            btn.classList.remove('text-white');
            btn.classList.add('bg-white', 'text-primary');
        }
    }
}

// Check if API key is set and working
function checkApiKey() {
    const warningElement = document.getElementById('api-warning');
    if (!state.apiKey || !state.isApiConnected) {
        warningElement.classList.remove('hidden');
    } else {
        warningElement.classList.add('hidden');
    }
}

// Save API key
async function saveApiKey() {
    const apiKeyInput = document.getElementById('api-key-input');
    state.apiKey = apiKeyInput.value.trim();
    setStoredItem(STORAGE_KEYS.API_KEY, state.apiKey);
    
    // Test API connection with new key
    const success = await initializeGeminiAPI();
    
    // Show result message
    const savedMessage = document.getElementById('api-saved');
    if (savedMessage) {
        if (success) {
            savedMessage.textContent = "API key saved and connected successfully";
        } else {
            savedMessage.textContent = "API key saved but connection failed";
        }
    savedMessage.classList.remove('hidden');
    setTimeout(() => {
        savedMessage.classList.add('hidden');
        }, 3000);
    }
    
    // Update API warning
    checkApiKey();
}

// Error handling
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (errorContainer && errorMessage) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
    } else {
        console.error("Error:", message);
        alert(message); // Fallback if error container not found
    }
}

function dismissError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.classList.add('hidden');
    }
}

// Character management
function createNewCharacter() {
    // Get input fields
    const nameInput = document.getElementById('character-name');
    const contextInput = document.getElementById('character-context');
    
    if (!nameInput || !contextInput) {
        showError("Character creation form elements not found");
        return;
    }
    
    const name = nameInput.value.trim();
    const context = contextInput.value.trim();
    
    // Better validation with more specific error messages
    if (name === '') {
        showError("Please provide a name for your character");
        nameInput.focus();
        return false;
    }
    
    if (context === '') {
        showError("Please provide context for your character");
        contextInput.focus();
        return false;
    }

    // Create new character
    const newCharacter = {
        id: generateUniqueId(),
        name,
        userContext: context,
        enhancedContext: null,
        createdAt: new Date().toISOString(),
    };
    
    console.log("Creating new character:", newCharacter);

    // Add to state and save
    state.characters.push(newCharacter);
    setStoredItem(STORAGE_KEYS.CHARACTERS, state.characters);
    
    // Clear inputs AFTER validation and saving
    nameInput.value = '';
    contextInput.value = '';
    
    // Show success message
    showSuccess(`Character "${name}" created successfully!`);

    // Instead of re-rendering the entire list, append the new element:
    const characterListContainer = document.getElementById('character-list');
    if (characterListContainer) {
        // Remove "no characters" message if present
        const noChars = document.getElementById('no-characters');
        if (noChars) { noChars.remove(); }
        
        // Create a new div element for the character
        const newCharDiv = document.createElement('div');
        newCharDiv.id = `character-item-${newCharacter.id}`;
        newCharDiv.className = "border rounded-lg p-4 hover:shadow-md transition";
        
        newCharDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <h3 class="font-bold text-lg">${newCharacter.name}</h3>
                <button id="delete-btn-${newCharacter.id}" class="text-red-500 hover:text-red-700" title="Delete character">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="mt-2">
                <p class="text-sm text-gray-700 font-semibold">User-Provided Context:</p>
                <div class="text-gray-600 text-sm mt-1 max-h-32 overflow-auto p-1 border rounded bg-gray-50">
                    ${newCharacter.userContext}
                </div>
            </div>
            
            ${ newCharacter.enhancedContext ? `
            <div class="mt-3 bg-gray-50 p-2 rounded enhanced-context" id="enhanced-context-${newCharacter.id}">
                <p class="text-sm text-gray-700 font-semibold">Enhanced Context:</p>
                <div class="text-gray-600 text-sm mt-1 max-h-60 overflow-auto p-1 border rounded bg-white">
                    ${newCharacter.enhancedContext}
                </div>
            </div>
            ` : '' }
            
            <div class="mt-3">
                <button id="enhance-btn-${newCharacter.id}" class="text-sm bg-secondary text-white px-3 py-1 rounded hover:bg-secondary/90 transition ${!state.apiKey ? 'disabled:bg-gray-400' : ''}" ${!state.apiKey ? 'disabled' : ''}>
                    <i class="fas fa-magic mr-1"></i> ${ newCharacter.enhancedContext ? 'Re-Enhance Context' : 'Enhance Context' }
                </button>
            </div>
        `;
        
        // Append the new character element to the container
        characterListContainer.appendChild(newCharDiv);
        
        // Set up event listeners for the new element:
        const deleteBtn = newCharDiv.querySelector(`#delete-btn-${newCharacter.id}`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                deleteCharacter(newCharacter.id);
            });
        }
        
        const enhanceBtn = newCharDiv.querySelector(`#enhance-btn-${newCharacter.id}`);
        if (enhanceBtn) {
            enhanceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                enhanceCharacterContext(newCharacter.id);
            });
        }
    }

    // Also update the sidebar if needed
    updateSidebarCharacters();
    
    // Full UI update
    updateCharacterLists();
    window.scrollTo(0, document.body.scrollHeight); // scroll to bottom to see new character
    
    // If the characters view is currently hidden, switch to it
    if (document.getElementById('characters-view').classList.contains('hidden')) {
        changeView('characters');
    }
    return true;
}

// Helper function to set up event listeners for character items
function setupCharacterItemListeners() {
    // Set up enhance button event listeners
    document.querySelectorAll('[id^="enhance-btn-"]').forEach(button => {
        const characterId = button.id.replace('enhance-btn-', '');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            enhanceCharacterContext(characterId);
        });
    });
    
    // Set up delete button event listeners
    document.querySelectorAll('[id^="delete-btn-"]').forEach(button => {
        const characterId = button.id.replace('delete-btn-', '');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            deleteCharacter(characterId);
        });
    });
}

// Function to generate HTML for character list
function generateCharacterListHTML() {
    return state.characters.map(character => `
        <div class="border rounded-lg p-4 hover:shadow-md transition" id="character-item-${character.id}">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg">${character.name}</h3>
                    <button
                    id="delete-btn-${character.id}"
                        class="text-red-500 hover:text-red-700"
                        title="Delete character"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="mt-2">
                    <p class="text-sm text-gray-700 font-semibold">User-Provided Context:</p>
                    <div class="text-gray-600 text-sm mt-1 max-h-32 overflow-auto p-1 border rounded bg-gray-50">
                        ${character.userContext}
                    </div>
                </div>
                
                ${character.enhancedContext ? `
                <div class="mt-3 bg-gray-50 p-2 rounded enhanced-context" id="enhanced-context-${character.id}">
                        <p class="text-sm text-gray-700 font-semibold">Enhanced Context:</p>
                        <div class="text-gray-600 text-sm mt-1 max-h-60 overflow-auto p-1 border rounded bg-white">
                            ${character.enhancedContext}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mt-3">
                    <button
                        id="enhance-btn-${character.id}"
                        class="text-sm bg-secondary text-white px-3 py-1 rounded hover:bg-secondary/90 transition disabled:bg-gray-400"
                    ${!state.apiKey ? 'disabled' : ''}
                    >
                    <i class="fas fa-magic mr-1"></i> ${character.enhancedContext ? 'Re-Enhance Context' : 'Enhance Context'}
                    </button>
                </div>
            </div>
        `).join('');
    }
    
// Function to update just the sidebar character list
function updateSidebarCharacters() {
    console.log("Updating sidebar characters list");
    const sidebarCharactersContainer = document.getElementById('sidebar-characters');
    
    if (!sidebarCharactersContainer) {
        console.error("Sidebar characters container not found");
        return;
    }
    
    try {
    if (state.characters.length === 0) {
        sidebarCharactersContainer.innerHTML = `
            <p class="text-gray-500 italic p-4 text-sm">
                No characters created yet. Go to Characters tab to create some.
            </p>
        `;
    } else {
            const sidebarHTML = state.characters.map(character => `
            <div 
                id="sidebar-char-${character.id}"
                    data-character-id="${character.id}"
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

            // Use innerHTML for the sidebar update
            sidebarCharactersContainer.innerHTML = sidebarHTML;
    }
    
        // Setup event listeners for the sidebar characters
        setupSidebarCharacterListeners();
        
        // Update Start Chat button state
        // removed it
    } catch (error) {
        console.error("Error updating sidebar characters:", error);
    }
}

// Function to setup sidebar character listeners
function setupSidebarCharacterListeners() {
    console.log("Setting up sidebar character listeners");
    
    document.querySelectorAll('[id^="sidebar-char-"]').forEach(element => {
        const characterId = element.getAttribute('data-character-id');
        if (!characterId) {
            console.warn("Character element without data-character-id:", element);
            return;
        }
        
        // Remove any existing event listeners by cloning and replacing
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        // Add fresh event listener using the data attribute
        newElement.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Character clicked in sidebar:", characterId);
            toggleCharacterSelection(characterId);
        });
    });
    
    // Also set up the Start Chat button
    // removed it
}

// Character selection in sidebar
function toggleCharacterSelection(characterId) {
    console.log("Character selected:", characterId);
    
    // Check if character exists
    const character = state.characters.find(c => c.id === characterId);
    if (!character) {
        console.error("Character not found:", characterId);
        return;
    }
    
    const wasSelected = state.selectedCharacters.includes(characterId);
    
    // Handle selection based on group chat setting
    if (!appSettings.allowGroupChats) {
        // Single character mode - replace existing selection
        state.selectedCharacters = [characterId];
    } else {
        // Group chat mode - toggle selection
        if (wasSelected) {
            state.selectedCharacters = state.selectedCharacters.filter(id => id !== characterId);
        } else {
            state.selectedCharacters.push(characterId);
        }
    }
    
    // Update Start Chat button state
    //removed it
    
    // Update UI to reflect selection state
    updateSidebarCharacters();
    
    // If we're removing a character from an active chat
    if (wasSelected && state.selectedCharacters.length === 0) {
        // Reset the chat view if no characters are selected
        const chatWindow = document.getElementById('chat-window');
        const placeholder = document.getElementById('chat-placeholder');
        
        if (chatWindow) chatWindow.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
        
        // Force a layout refresh
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 10);
    }
    
    // Auto-start chat in single character mode
    if (!appSettings.allowGroupChats && state.selectedCharacters.length === 1) {
        console.log("Auto-starting chat since character was selected");
        startChat();
    }
}

// Chat functionality
function startChat() {
    console.log("Start chat clicked", state.selectedCharacters); // Debug log

    if (state.selectedCharacters.length === 0) {
        showError("Please select at least one character to chat with");
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
    
    // Update UI - Make sure to switch to chat view first
    changeView('chat');
    updateChatUI();
}

function updateChatUI() {
    console.log("Updating chat UI"); // Debug log
    
    // Hide placeholder, show chat window
    const placeholder = document.getElementById('chat-placeholder');
    const chatWindow = document.getElementById('chat-window');
    
    if (placeholder) placeholder.classList.add('hidden');
    if (chatWindow) chatWindow.classList.remove('hidden');
    
    // Update chat header
    const characterNames = state.activeCharacters.map(c => c.name).join(', ');
    const headerTitle = document.getElementById('chat-header-title');
    if (headerTitle) headerTitle.textContent = characterNames;
    
    const headerSubtitle = document.getElementById('chat-header-subtitle');
    if (headerSubtitle) {
        headerSubtitle.textContent = 
        state.activeCharacters.length > 1 ? 'Group conversation' : 'Private conversation';
    }
    
    // Update messages
    updateChatMessages();
    
    // Force a layout refresh to prevent spacing issues
    setTimeout(() => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            // Reset any potential accumulated margins or paddings
            chatMessages.style.height = null;
            chatMessages.style.height = 'auto';
            
            // Force browser to recalculate layout
            window.dispatchEvent(new Event('resize'));
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 50);
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
        // Filter out deleted messages
        const visibleMessages = messages.filter(message => !message.isDeleted);
        
        if (visibleMessages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="text-center text-gray-500 mt-8">
                    <p>No messages in this conversation. Start chatting!</p>
                </div>
            `;
        } else {
            messagesContainer.innerHTML = visibleMessages.map(message => createMessageHTML(message)).join('');
        }
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function createMessageHTML(message) {
    if (message.isTyping) {
        return `
            <div class="flex w-full">
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
    
    // Process markdown and sanitize HTML
    const processContent = (content) => {
        // Configure marked options for enhanced markdown support
        marked.setOptions({
            breaks: true, // Enable line breaks
            gfm: true, // Enable GitHub Flavored Markdown
            headerIds: false, // Disable header IDs for security
            mangle: false // Disable mangle for security
        });

        // Convert *text* to italics for actions, but preserve other markdown
        content = content.replace(/\*((?!\*)[^*]+)\*/g, '_$1_');
        
        // Parse markdown
        const rawHtml = marked.parse(content);
        
        // Sanitize HTML with expanded tag support
        return DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: [
                'em', 'strong', 'code', 'br', 'p', 'ul', 'ol', 'li', 
                'blockquote', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'pre', 'hr', 'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
            ],
            ALLOWED_ATTR: ['class']
        });
    };
    
    if (message.isUser) {
        // User message - right aligned
        return `
            <div 
                class="flex justify-end w-full"
                onmouseenter="showMessageActions('${message.id}')"
                onmouseleave="hideMessageActions('${message.id}')"
            >
                <div class="message-container-user">
                    <div class="message-bubble user-message">
                        ${processContent(message.content)}
                        
                        <button
                            id="delete-msg-${message.id}"
                            onclick="deleteMessage('${message.id}')"
                            class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 transition hidden"
                        >
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                    
                    <div class="text-xs text-gray-500 mt-1 text-right mr-2">
                        ${time}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Character message - left aligned
        return `
            <div 
                class="flex justify-start w-full"
                onmouseenter="showMessageActions('${message.id}')"
                onmouseleave="hideMessageActions('${message.id}')"
            >
                <div class="character-avatar bg-primary/20 text-primary self-end mb-1 mr-1">
                    ${character.name.charAt(0).toUpperCase()}
                </div>
                
                <div class="message-container-character">
                    <div class="text-xs text-gray-600 ml-2 mb-1">${character.name}</div>
                
                    <div class="message-bubble character-message">
                        ${processContent(message.content)}
                        
                        <button
                            id="delete-msg-${message.id}"
                            onclick="deleteMessage('${message.id}')"
                            class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 transition hidden"
                        >
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                    
                    <div class="text-xs text-gray-500 mt-1 ml-2">
                        ${time}
                    </div>
                </div>
            </div>
        `;
    }
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

async function sendMessage() {
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
    
    // Get response from each character using async/await and Promise.all for concurrency.
    await Promise.all(state.activeCharacters.map(async (character) => {
        await getCharacterResponse(character, userMsg);
    }));
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
    console.log("Getting response from character:", character.name);
    
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
        // Prepare context with roleplay instructions
        const context = prepareContextForAPI(
            character,
            [...(state.chats[state.activeChat] || [])],
            state.activeCharacters
        );
        
        // Get the history but ensure we have at least one user message first
        const chatHistory = state.chats[state.activeChat] || [];
        const userMessages = chatHistory.filter(m => m.isUser && !m.isDeleted);
        
        if (userMessages.length === 0) {
            console.log("No user messages yet, using a simplified approach");
            // For the first message, we'll use a simpler approach
            const result = await callGeminiAPI(context);
            
            // Remove typing indicator
            removeTypingIndicator(typingMsg.id);
            
            // Add the response as a message
        addMessage({
            id: generateUniqueId(),
                content: result,
            isUser: false,
            characterId: character.id,
            timestamp: new Date().toISOString(),
            isDeleted: false,
        });
            
            return;
        }
        
        // We have user messages, use the chat history approach
        console.log("Using chat history approach for response");
        const history = convertHistoryForGemini(chatHistory, character);
        
        // Create a chat with the history
        const chat = state.geminiModel.startChat({
            history: history,
            generationConfig: {
                temperature: appSettings.temperature,
                maxOutputTokens: parseInt(appSettings.maxTokens),
                topK: appSettings.topK,
                topP: appSettings.topP,
            }
        });
        
        // Remove typing indicator
        removeTypingIndicator(typingMsg.id);
        
        // Prepare for the new response
        let fullResponse = "";
        const responseMsg = {
            id: generateUniqueId(),
            content: "",
            isUser: false,
            characterId: character.id,
            timestamp: new Date().toISOString(),
            isDeleted: false,
        };
        
        // Add the initial empty message
        addMessage(responseMsg);
        
        // Send the message and stream the response
        const result = await chat.sendMessageStream(context);
        
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText; // Accumulate the response

            // Update the message with the latest chunk
            updateMessageContent(responseMsg.id, fullResponse);
        }
        
        console.log("Full response complete, length:", fullResponse.length);
    } catch (error) {
        console.error("Error getting character response:", error);
        showError(`Failed to get response: ${error.message}`);
        removeTypingIndicator(typingMsg.id);
    }
}
        
// Helper function to update message content
function updateMessageContent(messageId, content) {
    if (!state.activeChat) return;
    
        const messages = state.chats[state.activeChat];
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex !== -1) {
        messages[messageIndex].content = content;
        setStoredItem(STORAGE_KEYS.CHATS, state.chats);
        updateChatMessages();
    }
}

// Helper function to find the typing indicator and remove it
function removeTypingIndicator(typingMsgId) {
    if (!state.activeChat) return;
    
    const messages = state.chats[state.activeChat];
    const typingIndex = messages.findIndex(m => m.id === typingMsgId);
        
        if (typingIndex !== -1) {
            messages.splice(typingIndex, 1);
            setStoredItem(STORAGE_KEYS.CHATS, state.chats);
            updateChatMessages();
    }
}

// Context preparation for chat
function prepareContextForAPI(character, chatHistory, activeCharacters = []) {
    // Base context with character information and roleplay instructions
    let context = `You are now roleplaying as ${character.name}. This is NOT a simulation. You ARE ${character.name}. 
Your responses should maintain the character's personality, speech patterns, and knowledge at all times.

CHARACTER PROFILE:
Name of character: ${character.name}
${character.enhancedContext 
    ? `Enhanced Character Profile: ${character.enhancedContext}\n`
    : `Character Description: ${character.userContext}\n`}
${character.enhancedContext && character.userContext 
    ? `Additional User-Provided Details: ${character.userContext}\n` 
    : ''}

ROLEPLAY GUIDELINES:
1. BE the character - think, feel, and respond as they would naturally.
2. Show personality through speech patterns, expressions, and mannerisms unique to the character.
3. Stay true to the character's knowledge, background, and emotional state.
4. Be dynamic - react to the conversation flow and emotional context.
5. Avoid being defensive or overly cautious - respond naturally as the character would.
6. Use emotes and actions sparingly and only when they add value to the interaction.
7. Keep responses concise but meaningful, focusing on quality interaction.
8. You may refer to knowledge from the wiki and general lore of the original work to make you more accurate.

CONVERSATION STYLE:
- Be natural and conversational, act like you are actually that character
- Show appropriate emotions and reactions
- Maintain consistent personality
- Adapt to the user's conversation style
- Stay in character without being rigid
- Do not keep asking questions or repeating quotes from the user.
`;
    
    // Add group chat context if needed
    if (activeCharacters.length > 1) {
        context += "\nCONVERSATION PARTICIPANTS:\nYou are in a conversation with:\n";
        activeCharacters.forEach(char => {
            if (char.id !== character.id) {
                context += `- ${char.name}: ${char.enhancedContext 
                    ? `${char.name} is ${summarizeContext(char.enhancedContext, 100)}`
                    : `${char.userContext}`}\n`;
            }
        });
    }
    
    return context;
}

// Helper function to summarize long context for group chats
function summarizeContext(context, maxLength = 100) {
    if (context.length <= maxLength) return context;
    return context.substring(0, maxLength) + "...";
}

// Convert history to the format expected by Gemini API
function convertHistoryForGemini(chatHistory, currentCharacter) {
    console.log("Converting chat history for character:", currentCharacter.name);
    const formattedHistory = [];
    let hasUserMessage = false;

    // First, check if there's at least one user message in the history
    for (const msg of chatHistory) {
        if (msg.isUser && !msg.isDeleted) {
            hasUserMessage = true;
            break;
        }
    }

    // If no user messages, return an empty history
    if (!hasUserMessage) {
        console.log("No user messages found in history, returning empty history");
        return [];
    }

    // Process each message
    for (const msg of chatHistory) {
        if (msg.isTyping || msg.isDeleted) continue; // Skip typing indicators and deleted messages

        // Determine message role
        let role = "";
        if (msg.isUser) {
            role = "user";
        } else if (msg.characterId === currentCharacter.id) {
            role = "model";
        } else {
            console.log("Skipping message from other character:", msg);
            continue; // Don't include messages from other characters in *this* character's history.
        }

        // Add to formatted history
        formattedHistory.push({
            role: role,
            parts: [{ text: msg.content }],
        });
    }

    console.log("Formatted history:", formattedHistory);
    return formattedHistory;
}

// Quick test function to directly open chat window for testing
function forceOpenChat() {
    console.log("Force opening chat window for testing");

    // Create a test character if none exists
    if (state.characters.length === 0) {
        const testCharacter = {
            id: "test-character",
            name: "Test Character",
            userContext: "This is a test character created automatically for testing the chat interface.",
            enhancedContext: null,
            createdAt: new Date().toISOString()
        };
        state.characters.push(testCharacter);
        setStoredItem(STORAGE_KEYS.CHARACTERS, state.characters);
        updateCharacterLists();
    }
    
    // Select the first character
    state.selectedCharacters = [state.characters[0].id];
    state.activeCharacters = [state.characters[0]];
    
    // Set active chat
    const chatId = state.selectedCharacters[0];
    state.activeChat = chatId;
    
    // Ensure chat exists in state
    if (!state.chats[chatId]) {
        state.chats[chatId] = [];
        setStoredItem(STORAGE_KEYS.CHATS, state.chats);
    }
    
    // Switch to chat view
    changeView('chat');
    
    // Force UI update directly - don't rely on changeView
    console.log("Directly updating chat UI");
    
    // Hide placeholder, show chat window
    const placeholder = document.getElementById('chat-placeholder');
    const chatWindow = document.getElementById('chat-window');
    
    if (placeholder) {
        placeholder.classList.add('hidden');
        console.log("Placeholder hidden");
    } else {
        console.warn("Chat placeholder not found");
    }
    
    if (chatWindow) {
        chatWindow.classList.remove('hidden');
        console.log("Chat window shown");
    } else {
        console.warn("Chat window not found");
    }
    
    // Update chat header
    const headerTitle = document.getElementById('chat-header-title');
    if (headerTitle) headerTitle.textContent = state.characters[0].name;
    
    const headerSubtitle = document.getElementById('chat-header-subtitle');
    if (headerSubtitle) {
        const apiStatus = state.isApiConnected ? "API connected" : "API not connected (test mode)";
        headerSubtitle.textContent = `Test conversation - ${apiStatus}`;
    }
    
    // Add a welcome message based on API status
    let welcomeMessage = "";
    
    if (state.isApiConnected) {
        welcomeMessage = "Welcome to the chat! The Gemini API is connected and ready. Your messages will receive AI-generated responses based on the character profile.";
    } else {
        welcomeMessage = "Welcome to the test chat! The Gemini API is not currently connected. Messages will receive simulated responses. To use the real API, please add your API key in Settings.";
    }
    
    // Reset existing messages
    state.chats[chatId] = [];
    
    const welcomeMsg = {
        id: generateUniqueId(),
        content: welcomeMessage,
        isUser: false,
        characterId: state.characters[0].id,
        timestamp: new Date().toISOString(),
        isDeleted: false,
    };
    
    // Add message to chat
    addMessage(welcomeMsg);
    
    // Try to connect API if key exists but connection failed
    if (state.apiKey && !state.isApiConnected) {
        initializeGeminiAPI().then(success => {
            if (success) {
                // Update header with new status
                if (headerSubtitle) {
                    headerSubtitle.textContent = "Test conversation - API connected";
                }
                
                // Add a success message
                addMessage({
                    id: generateUniqueId(),
                    content: "API connection successful! Your messages will now receive AI-generated responses.",
                    isUser: false,
                    characterId: state.characters[0].id,
                    timestamp: new Date().toISOString(),
                    isDeleted: false,
                });
            }
        }).catch(error => {
            console.error("Error connecting to API:", error);
        });
    }
}

// Override the normal setup to prioritize test chat
document.addEventListener('DOMContentLoaded', function() {
    // Normal initialization
    loadStoredData();
    setupEventListeners();
    checkApiKey();
    changeView('chat');
    updateCharacterLists();
    
    // Load Gemini SDK
    loadGeminiSDK().catch(error => {
        console.error("Failed to load Gemini SDK:", error);
        // Don't show error for SDK load failure to allow testing without API
    });
    
    // Set up chat form with test mode
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        // Remove existing listeners
        const clonedForm = chatForm.cloneNode(true);
        chatForm.parentNode.replaceChild(clonedForm, chatForm);
        
        // Add our test listener
        clonedForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Chat form submitted");
            
            // Use test function for simplicity
            testSendMessage();
        });
    }
});

// Function to test if a character can be enhanced or generate responses
async function testModelCapabilities() {
    if (!state.apiKey) {
        showError("Please set your Gemini API key in settings first");
        return false;
    }
    
    try {
        await initializeGeminiAPI();
        return state.isApiConnected;
    } catch (error) {
        showError(`API test failed: ${error.message}`);
        return false;
    }
}

// Function for testing the chat without API
function testSendMessage() {
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
    
    // Get fake response from each character
    state.activeCharacters.forEach(character => {
        getTestCharacterResponse(character);
    });
}

// Generate a test response without using the API
async function getTestCharacterResponse(character) {
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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Remove typing indicator
    const messages = state.chats[state.activeChat];
    const typingIndex = messages.findIndex(m => m.id === typingMsg.id);
    
    if (typingIndex !== -1) {
        messages.splice(typingIndex, 1);
    }
    
    // Get last user message for context
    const userMessages = messages.filter(m => m.isUser && !m.isDeleted);
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || "Hello";
    
    // Generate fake response based on character when API is not connected
    const fakeResponses = [
        `As ${character.name}, I find your message "${lastUserMessage}" quite interesting. But the API is not connected. Add your Gemini API key in settings for real responses!`,
        `Hmm, let me think about "${lastUserMessage}" for a moment...lol the API is not connected. Add your Gemini API key in settings for real responses!`,
        `That's an excellent point about "${lastUserMessage}". I would add that...but the API is not connected.Add your Gemini API key in settings for real responses!`,
        `I disagree with your assessment of "${lastUserMessage}", because... but the API is not connected.Add your Gemini API key in settings for real responses!`,
        ` You said "${lastUserMessage}?"I've never thought about it that way before. And btw the API is not connected!Add your Gemini API key in settings for real responses!`
    ];
    // Generate a random response from the fake responses
    const randomResponse = fakeResponses[Math.floor(Math.random() * fakeResponses.length)];
    
    // Add actual response
    addMessage({
        id: generateUniqueId(),
        content: randomResponse,
        isUser: false,
        characterId: character.id,
        timestamp: new Date().toISOString(),
        isDeleted: false,
    });
}

// API communication with the Gemini SDK
async function callGeminiAPI(prompt) {
    try {
        if (!state.apiKey || !state.geminiModel) {
            const initialized = await initializeGeminiAPI();
            if (!initialized) {
                throw new Error("API key not set or Gemini model not initialized.");
            }
        }
        
        const generationConfig = {
            temperature: appSettings.temperature,
            maxOutputTokens: appSettings.maxTokens,
            topK: appSettings.topK,
            topP: appSettings.topP,
        };
        
        const result = await state.geminiModel.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig
        });
        
        return result.response.text();
    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error.message.includes("API key")) {
            state.isApiConnected = false;
            checkApiKey();
        }
        throw error;
    }
}

async function enhanceCharacterContext(characterId) {
    if (!state.apiKey) {
        showError("Please set your Gemini API key in settings first");
        return;
    }
    
    const character = state.characters.find(c => c.id === characterId);
    if (!character) {
        showError("Character not found");
        return;
    }
    
    // Find the enhance button directly - don't rely on previous selectors
    const enhanceButton = document.querySelector(`#enhance-btn-${characterId}`);
    if (enhanceButton) {
        // Visually update the button
        enhanceButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Enhancing...';
        enhanceButton.disabled = true;
    } else {
        console.warn(`Enhance button for character ${characterId} not found`);
    }
    
    // Ensure API is initialized
    if (!state.isApiConnected) {
        try {
            const initialized = await initializeGeminiAPI();
            if (!initialized) {
                showError("Failed to connect to Gemini API. Please check your API key.");
                resetEnhanceButton(enhanceButton);
                return;
            }
        } catch (error) {
            showError(`API initialization failed: ${error.message}`);
            resetEnhanceButton(enhanceButton);
            return;
        }
    }
    
    // Call API
    try {
        const enhancedContext = await callEnhanceAPI(character.name, character.userContext);
        
        // Update character
        character.enhancedContext = enhancedContext;
        setStoredItem(STORAGE_KEYS.CHARACTERS, state.characters);
        
        // Show success message
        showSuccess(`Character ${character.name} has been enhanced!`);
        
        // Update the container of this specific character if it exists
        const characterItem = document.getElementById(`character-item-${characterId}`);
        if (characterItem) {
            // Find or create enhanced context container
            let enhancedContainer = characterItem.querySelector('.enhanced-context');
            if (!enhancedContainer) {
                enhancedContainer = document.createElement('div');
                enhancedContainer.className = 'mt-3 bg-gray-50 p-2 rounded enhanced-context';
                
                // Insert before the button container
                const buttonContainer = characterItem.querySelector('.mt-3');
                if (buttonContainer) {
                    characterItem.insertBefore(enhancedContainer, buttonContainer);
                } else {
                    characterItem.appendChild(enhancedContainer);
                }
            }
            
            // Update the content
            enhancedContainer.innerHTML = `
                <p class="text-sm text-gray-700 font-semibold">Enhanced Context:</p>
                <div class="text-gray-600 text-sm mt-1 max-h-60 overflow-auto p-1 border rounded bg-white">
                    ${enhancedContext}
                </div>
            `;
            
            // Reset the enhance button
            resetEnhanceButton(enhanceButton, "Re-Enhance Context");
        } else {
            // If we can't find the individual item, update the whole list
            const characterListContainer = document.getElementById('character-list');
            if (characterListContainer) {
                characterListContainer.innerHTML = generateCharacterListHTML();
            }
            resetEnhanceButton(enhanceButton);
        }
    } catch (error) {
        console.error("Error enhancing character:", error);
        showError(`Failed to enhance character: ${error.message}`);
        resetEnhanceButton(enhanceButton);
    }
}

// Helper function to reset enhance button
function resetEnhanceButton(button, text = 'Enhance Context') {
    if (button) {
        button.innerHTML = `<i class="fas fa-magic mr-1"></i> ${text}`;
        button.disabled = false;
    }
}

// Success message function
function showSuccess(message, duration = 3000) {
    // Check if there's an existing success container, if not create one
    let successContainer = document.getElementById('success-container');
    
    if (!successContainer) {
        // Create success container if it doesn't exist
        successContainer = document.createElement('div');
        successContainer.id = 'success-container';
        successContainer.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 m-4 rounded shadow-md';
        successContainer.style.position = 'fixed';
        successContainer.style.top = '20px';
        successContainer.style.right = '20px';
        successContainer.style.zIndex = '1000';
        successContainer.style.maxWidth = '400px';
        
        document.body.appendChild(successContainer);
    }
    
    // Set the message
    successContainer.innerHTML = `
        <div class="flex">
            <div class="py-1"><i class="fas fa-check-circle"></i></div>
            <div class="ml-3">
                <p>${message}</p>
            </div>
        </div>
    `;
    
    // Show the container
    successContainer.style.display = 'block';
    
    // Hide after duration
    setTimeout(() => {
        successContainer.style.display = 'none';
    }, duration);
}

async function callEnhanceAPI(characterName, userContext) {
    const prompt = `
You are an expert character developer for roleplaying. Transform this brief character description into a detailed character profile that can guide an AI in consistently roleplaying as this character.
Do not mention AI. Immediately fill in the details about the character for generating a character bio and context which will be used to roleplay with the user.
Write details for CHARACTER NAME: "${characterName}"

BRIEF DESCRIPTION:
"${userContext}"

BUILD ON THE BRIEF DESCRIPTION TO CREATE A COMPREHENSIVE CHARACTER PROFILE INCLUDING:
1. Personality traits with specific behavioral examples
2. Distinctive speech patterns, vocabulary choices, and verbal tics
3. Background information and formative experiences that shaped them
4. Core motivations, values, and life goals
5. Key relationships and how they interact with different types of people
6. Emotional responses to various situations (angry, happy, stressed, etc.)
7. Physical appearance and mannerisms if relevant
8. Skills, knowledge areas, and expertise
9. Fears, insecurities, and internal conflicts

FORMAT AS A COHESIVE PROFILE THAT DEFINES THE CHARACTER'S ESSENCE THAT REFLECTS THEIR ORIGINAL SOURCE.
Make the character feel authentic and three-dimensional with consistent traits.
Include specific examples of how they would speak and react.
Write in third person (like you are analyzing them), approximately 400-500 words.
Focus on depth and specificity rather than generic descriptions.
`;

    try {
        // Use the regular callGeminiAPI function which already uses appSettings
        const result = await callGeminiAPI(prompt);
        return result;
    } catch (error) {
        console.error("Error enhancing character:", error);
        throw error;
    }
}

function deleteCharacter(characterId) {
    console.log("Deleting character:", characterId);
    
    // Remove from characters array
    state.characters = state.characters.filter(c => c.id !== characterId);
    setStoredItem(STORAGE_KEYS.CHARACTERS, state.characters);
    
    // Remove from selected characters
    state.selectedCharacters = state.selectedCharacters.filter(id => id !== characterId);
    
    // Remove from active characters if present
    if (state.activeCharacters) {
        state.activeCharacters = state.activeCharacters.filter(c => c.id !== characterId);
    }
    
    // Remove associated chats
    let chatsRemoved = 0;
    for (const chatId in state.chats) {
        if (chatId.includes(characterId)) {
            delete state.chats[chatId];
            chatsRemoved++;
        }
    }
    setStoredItem(STORAGE_KEYS.CHATS, state.chats);
    
    console.log(`Character deleted, removed ${chatsRemoved} associated chats`);

    // Remove the HTML element directly
    const charElement = document.getElementById(`character-item-${characterId}`);
    if (charElement) {
        charElement.remove();
    }

    // Optionally, update the sidebar if needed
    updateSidebarCharacters();
    
    // Show success message
    showSuccess("Character deleted successfully");
    
    // Comprehensive UI update
    updateCharacterLists();
    
    // Make sure we update the chat view too if needed
    if (state.activeChat && state.activeChat.includes(characterId)) {
        // Reset active chat if it contained the deleted character
        state.activeChat = null;
        changeView('chat'); // Force refresh of chat view
    }
    
    return true;
}

function updateCharacterLists() {
    console.log("Updating character lists with", state.characters.length, "characters");
    
    // Only perform this update if the DOM is fully loaded
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
        console.log("DOM not ready, deferring character list update");
        document.addEventListener('DOMContentLoaded', () => {
            updateCharacterLists();
        });
        return;
    }
    
    try {
        // Update character list in Characters view
        const characterListContainer = document.getElementById('character-list');
        const noCharactersEl = document.getElementById('no-characters');
        
        if (characterListContainer && noCharactersEl) {
            if (state.characters.length === 0) {
                noCharactersEl.classList.remove('hidden');
                characterListContainer.innerHTML = '';
            } else {
                noCharactersEl.classList.add('hidden');
                characterListContainer.innerHTML = generateCharacterListHTML();
                // Set up event listeners for character items
                setupCharacterItemListeners();
            }
        } else {
            console.log("Character list containers not found - this may be OK if not on Characters view");
        }
        
        // Always update the sidebar
        updateSidebarCharacters();
        
        // If we're in an active chat with no data, reset the active chat
        if (state.activeChat && (!state.chats[state.activeChat] || state.chats[state.activeChat].length === 0)) {
            // Check if any characters in activeChat were deleted
            const chatCharIds = state.activeChat.split('-');
            const allExist = chatCharIds.every(id => state.characters.some(c => c.id === id));
            
            if (!allExist) {
                // Reset the active chat and update UI
                state.activeChat = null;
                state.activeCharacters = [];
                updateChatUI();
            }
        }
    } catch (error) {
        console.error("Error updating character lists:", error);
        // Try to recover by refreshing the whole page if critical error
        if (error.toString().includes("TypeError")) {
            console.log("Critical error detected, suggesting page refresh");
            showError("An error occurred. Please refresh the page.");
        }
    }
}

// Save app settings to local storage
function saveAppSettings() {
    setStoredItem(STORAGE_KEYS.SETTINGS, appSettings);
    
    // If we have an API key and the model is initialized, reinitialize with new settings
    if (state.apiKey && state.isApiConnected) {
        console.log("Settings changed, reinitializing model with new configuration");
        // Reinitialize the model with new settings
        initializeGeminiAPI().then(success => {
            if (success) {
                console.log("Model successfully reinitialized with new settings");
                // Show a small notification if success
                showSuccess("Model settings updated", 2000);
            } else {
                console.error("Failed to reinitialize model with new settings");
                showError("Failed to update model with new settings. Please check your configuration.");
            }
        }).catch(error => {
            console.error("Error reinitializing model:", error);
            showError(`Error updating model: ${error.message}`);
        });
    }
}

// Toggle group chats setting
function toggleGroupChats(allowed) {
    appSettings.allowGroupChats = allowed;
    saveAppSettings();
    
    // If disabling group chats, limit selection to one character
    if (!allowed && state.selectedCharacters.length > 1) {
        // Keep only the first selected character
        state.selectedCharacters = [state.selectedCharacters[0]];
        // Update the sidebar to reflect the change
        updateSidebarCharacters();
    }
    
    console.log("Group chats setting updated:", allowed ? "Enabled" : "Disabled");
}

// Initialize event listeners for model settings
function initializeModelSettings() {
    const modelSelect = document.getElementById('model-select');
    const temperatureRange = document.getElementById('temperature-range');
    const temperatureValue = document.getElementById('temperature-value');
    const maxTokens = document.getElementById('max-tokens');
    const testModelBtn = document.getElementById('test-model-btn');

    // Load saved settings
    if (appSettings.modelVersion) {
        modelSelect.value = appSettings.modelVersion;
    }
    if (appSettings.temperature) {
        temperatureRange.value = appSettings.temperature;
        temperatureValue.textContent = appSettings.temperature;
    }
    if (appSettings.maxTokens) {
        maxTokens.value = appSettings.maxTokens;
    }

    // Add event listeners
    modelSelect.addEventListener('change', (e) => {
        appSettings.modelVersion = e.target.value;
        saveAppSettings();
    });

    temperatureRange.addEventListener('input', (e) => {
        appSettings.temperature = parseFloat(e.target.value);
        temperatureValue.textContent = e.target.value;
        saveAppSettings();
    });

    maxTokens.addEventListener('change', (e) => {
        appSettings.maxTokens = parseInt(e.target.value);
        saveAppSettings();
    });

    // Add test configuration button listener
    if (testModelBtn) {
        testModelBtn.addEventListener('click', testModelConfiguration);
    }
}

// Test model configuration
async function testModelConfiguration() {
    const testResult = document.getElementById('test-result');
    const testStatus = document.getElementById('test-status');
    const testDetails = document.getElementById('test-details');
    const testBtn = document.getElementById('test-model-btn');

    // Show testing state
    testResult.classList.remove('hidden', 'bg-green-100', 'bg-red-100');
    testResult.classList.add('bg-blue-100');
    testStatus.textContent = 'Testing configuration...';
    testDetails.textContent = 'Connecting to Gemini API...';
    testBtn.disabled = true;

    try {
        // First, check if we have an API key
        if (!state.apiKey) {
            throw new Error('No API key set. Please add your API key first.');
        }

        // Log current settings for debugging
        console.log("Testing with settings:", {
            model: appSettings.modelVersion,
            temperature: appSettings.temperature,
            maxTokens: appSettings.maxTokens,
            topK: appSettings.topK,
            topP: appSettings.topP
        });

        // Try to initialize with the selected model
        const { GoogleGenerativeAI } = await import("https://esm.run/@google/generative-ai");
        const genAI = new GoogleGenerativeAI(state.apiKey);
        
        // Get model with current settings
        const model = genAI.getGenerativeModel({ 
            model: appSettings.modelVersion
        });

        // Test the configuration with current settings
        testDetails.textContent = 'Testing model response...';
        
        const result = await model.generateContent({
            contents: [{ parts: [{ text: "Respond with 'Configuration test successful' if you receive this message." }] }],
            generationConfig: {
                temperature: appSettings.temperature,
                maxOutputTokens: parseInt(appSettings.maxTokens),
                topK: appSettings.topK,
                topP: appSettings.topP,
            }
        });

        const response = result.response.text();
        
        // Update state with the working model
        state.geminiModel = model;
        state.isApiConnected = true;

        // Show success
        testResult.classList.remove('bg-blue-100');
        testResult.classList.add('bg-green-100');
        testStatus.textContent = 'Configuration test successful!';
        testDetails.innerHTML = `
            <div class="space-y-1">
                <p>✓ Model: ${appSettings.modelVersion}</p>
                <p>✓ Temperature: ${appSettings.temperature}</p>
                <p>✓ Max Tokens: ${appSettings.maxTokens}</p>
                <p>✓ Response received: ${response.substring(0, 50)}...</p>
            </div>
        `;

    } catch (error) {
        // Show error
        testResult.classList.remove('bg-blue-100');
        testResult.classList.add('bg-red-100');
        testStatus.textContent = 'Configuration test failed';
        testDetails.textContent = `Error: ${error.message}`;
        console.error('Model test failed:', error);
    } finally {
        testBtn.disabled = false;
    }
}
