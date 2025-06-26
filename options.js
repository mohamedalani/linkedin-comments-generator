/**
 * Saves the Claude API key to chrome.storage
 */
function saveClaudeAPIKey() {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.sync.set({
    'claude_api_key': apiKey
  }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Claude API Key saved successfully!';
    status.style.color = 'green';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

/**
 * Restores the Claude API key from chrome.storage and populates the input field
 */
function restoreClaudeAPIKey() {
  chrome.storage.sync.get({
    'claude_api_key': ''
  }, (items) => {
    document.getElementById('apiKey').value = items.claude_api_key;
  });
}

document.addEventListener('DOMContentLoaded', restoreClaudeAPIKey);
document.getElementById('save').addEventListener('click', saveClaudeAPIKey); 