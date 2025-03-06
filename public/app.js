document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatContainer = document.getElementById('chatContainer');
    const clearChatButton = document.getElementById('clearChat');

    // Auto-resize textarea as user types
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });

    // Clear chat history
    clearChatButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the chat history?')) {
            chatContainer.innerHTML = '';
            localStorage.removeItem('chatHistory');
        }
    });

    // Load chat history from localStorage
    const loadChatHistory = () => {
        const history = localStorage.getItem('chatHistory');
        if (history) {
            chatContainer.innerHTML = history;
            highlightCode();
            scrollToBottom();
        }
    };

    // Save chat history to localStorage
    const saveChatHistory = () => {
        localStorage.setItem('chatHistory', chatContainer.innerHTML);
    };

    // Create and append a message to the chat
    const appendMessage = (content, isUser = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;

        const messageBubble = document.createElement('div');
        messageBubble.className = `max-w-[80%] rounded-lg p-4 ${
            isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
        }`;

        // Check if the content contains code blocks
        if (content.includes('```')) {
            const parts = content.split(/(```[\s\S]*?```)/g);
            parts.forEach(part => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    // Handle code block
                    const code = part.slice(3, -3);
                    const language = code.split('\n')[0].trim();
                    const codeContent = code.substring(code.indexOf('\n') + 1);
                    
                    const codeBlock = document.createElement('div');
                    codeBlock.className = 'code-block my-2';
                    codeBlock.innerHTML = `
                        <pre class="relative"><code class="language-${language}">${escapeHtml(codeContent.trim())}</code>
                        <button class="copy-button" onclick="copyCode(this)">
                            <i class="fas fa-copy"></i>
                        </button></pre>
                    `;
                    messageBubble.appendChild(codeBlock);
                } else if (part.trim()) {
                    // Handle regular text
                    const textNode = document.createElement('p');
                    textNode.className = 'whitespace-pre-wrap';
                    textNode.textContent = part;
                    messageBubble.appendChild(textNode);
                }
            });
        } else {
            // Regular message without code
            messageBubble.innerHTML = `<p class="whitespace-pre-wrap">${escapeHtml(content)}</p>`;
        }

        messageDiv.appendChild(messageBubble);
        chatContainer.appendChild(messageDiv);
        highlightCode();
        scrollToBottom();
        saveChatHistory();
    };

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        // Append user message
        appendMessage(message, true);
        userInput.value = '';
        userInput.style.height = 'auto';

        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'flex justify-start';
        loadingDiv.innerHTML = `
            <div class="bg-gray-100 rounded-lg p-4 text-gray-800">
                <div class="flex items-center space-x-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                    <span>AI is thinking...</span>
                </div>
            </div>
        `;
        chatContainer.appendChild(loadingDiv);
        scrollToBottom();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            chatContainer.removeChild(loadingDiv);
            appendMessage(data.response);
        } catch (error) {
            chatContainer.removeChild(loadingDiv);
            appendMessage('Sorry, I encountered an error. Please try again.');
            console.error('Error:', error);
        }
    });

    // Utility functions
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function highlightCode() {
        Prism.highlightAll();
    }

    // Copy code function
    window.copyCode = async (button) => {
        const pre = button.parentElement;
        const code = pre.querySelector('code');
        
        try {
            await navigator.clipboard.writeText(code.textContent);
            const icon = button.querySelector('i');
            icon.className = 'fas fa-check';
            setTimeout(() => {
                icon.className = 'fas fa-copy';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    // Initialize
    loadChatHistory();
});
