// This script will be the background service worker.
// It will handle API calls to Claude Sonnet 4.
console.log("Background script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateComment") {
    // 1. Get API Key from storage
    chrome.storage.sync.get(['claude_api_key'], (result) => {
      const apiKey = result.claude_api_key;
      if (!apiKey) {
        sendResponse({ success: false, message: "API Key not found. Please set it in the options page." });
        // Maybe open the options page automatically
        // chrome.runtime.openOptionsPage();
        return;
      }

      // 2. Call Claude API
      callClaudeAPI(apiKey, request.postContent)
        .then(comment => {
          sendResponse({ success: true, comment: comment });
        })
        .catch(error => {
          sendResponse({ success: false, message: error.message });
        });
    });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

/**
 * Loads the prompt template from the prompt.txt file
 * @returns {Promise<string>} The prompt template content
 */
async function loadPromptTemplate() {
  try {
    const response = await fetch(chrome.runtime.getURL('prompt.txt'));
    const promptTemplate = await response.text();
    return promptTemplate;
  } catch (error) {
    console.error('Failed to load prompt template:', error);
    // Fallback prompt if file can't be loaded
    return `Tu es un(e) growth hacker / startupper, direct(e) et allergique à la langue de bois. Ton but est de lancer une idée pertinente en un minimum de mots.

Règles IMPÉRATIVES :
1. Longueur : Maximum 2 phrases. C'est une limite stricte.
2. Attaque directe : Commence directement par ton idée. Zéro introduction ("Super post", "Merci", etc.).
3. Le Twist : Approuve l'idée générale, mais ajoute immédiatement une touche personnelle : une question un peu provoc, une analogie, ou une idée qui pousse le concept un cran plus loin.
4. Ton : Langage jeune, cool et naturel, la personne qui écrit le commentaire est un pote

Post:
"\${postContent}"

Comment:`;
  }
}

/**
 * Calls the Claude Sonnet 4 API to generate a comment based on the post content
 * @param {string} apiKey - The Claude API key
 * @param {string} postContent - The LinkedIn post content to generate a comment for
 * @returns {Promise<string>} The generated comment
 */
async function callClaudeAPI(apiKey, postContent) {
  const promptTemplate = await loadPromptTemplate();
  const prompt = promptTemplate.replace('${postContent}', postContent);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',

      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      temperature: 1,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
} 