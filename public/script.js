const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  // Send message to backend and get AI response
  sendAndReceiveMessage(userMessage);
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // Return the created element
}

async function sendAndReceiveMessage(message) {
  // Create an empty message bubble for the bot that will be populated by the stream
  const botMessageElement = appendMessage('bot', 'Gemini is thinking...');
  // Add a blinking cursor to indicate the bot is "typing"
  // You can style this in your CSS file
  botMessageElement.innerHTML = '<span class="cursor"></span>';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userMessage: message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    if (!response.body) {
      throw new Error('The response from the server is empty.');
    }

    // The stream is ready, remove the cursor.
    botMessageElement.innerHTML = '';

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // Exit the loop when the stream is finished
      const chunk = decoder.decode(value, { stream: true });
      botMessageElement.textContent += chunk;
      chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
    }
  } catch (error) {
    console.error('Error sending or receiving message:', error);
    if (botMessageElement.querySelector('.cursor')) {
      botMessageElement.innerHTML = '';
    }
    botMessageElement.textContent = `Error: ${error.message}`;
  }
}
