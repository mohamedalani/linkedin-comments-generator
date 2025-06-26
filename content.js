// This script will be injected into LinkedIn pages.
// It will be responsible for DOM manipulation, like adding the 'Generate' button.
console.log("Content script loaded.");

// More specific selectors might be needed depending on LinkedIn's dynamic class names
const POST_SELECTOR = ".feed-shared-update-v2";
const POST_CONTENT_SELECTOR = ".update-components-text";
const POST_ACTIONS_SELECTOR = ".feed-shared-social-action-bar__action-button";
// Multiple selectors for comment box to handle different LinkedIn versions
const COMMENT_BOX_SELECTORS = [
    ".comments-comment-box__editor",
    'div[contenteditable="true"]',
    'div[role="textbox"]',
    'textbox',
    '.ql-editor',
    '[data-placeholder*="comment"]',
    '[data-placeholder*="Comment"]'
];
// Multiple selectors for comment button to handle different LinkedIn versions/languages
const COMMENT_BUTTON_SELECTORS = [
    'button[aria-label*="Comment"]',
    'button[aria-label*="Commenter"]', 
    'button:has-text("Comment")',
    'button:has-text("Commenter")',
    '[data-control-name="comment"]',
    'button[id*="comment"]'
];
const GENERATE_BUTTON_ID = "generate-ai-comment-btn";

/**
 * Creates and returns the "Generate with AI" button.
 */
function createGenerateButton() {
    const button = document.createElement("button");
    button.id = GENERATE_BUTTON_ID;
    button.textContent = "✨ Gen AI";
    button.style.marginLeft = "8px";
    button.style.padding = "8px 12px";
    button.style.border = "1px solid #0a66c2";
    button.style.borderRadius = "18px";
    button.style.backgroundColor = "white";
    button.style.color = "#0a66c2";
    button.style.cursor = "pointer";
    button.style.fontFamily = "inherit";
    button.style.fontWeight = "600";
    button.style.fontSize = "14px";
    button.title = "Generate a comment with AI";
    return button;
}

/**
 * Waits for an element to appear in the DOM with a timeout.
 */
function waitForElement(selector, parentElement = document, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = parentElement.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            const element = parentElement.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(parentElement, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Finds the comment button using multiple selectors to handle different LinkedIn versions.
 */
function findCommentButton(postElement) {
    for (const selector of COMMENT_BUTTON_SELECTORS) {
        // Skip :has-text selectors as they're not standard CSS selectors
        if (selector.includes(':has-text')) {
            continue;
        }
        
        const button = postElement.querySelector(selector);
        if (button) {
            return button;
        }
    }
    
    // Fallback: look for buttons containing "Comment" or "Commenter" text
    const buttons = postElement.querySelectorAll('button');
    for (const button of buttons) {
        const text = button.textContent.trim().toLowerCase();
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        
        if (text.includes('comment') || text.includes('commenter') || 
            ariaLabel.includes('comment') || ariaLabel.includes('commenter')) {
            return button;
        }
    }
    
    return null;
}

/**
 * Finds the comment box using multiple selectors to handle different LinkedIn versions.
 */
function findCommentBox(postElement) {
    for (const selector of COMMENT_BOX_SELECTORS) {
        const element = postElement.querySelector(selector);
        if (element) {
            // Additional validation to ensure it's actually a comment input
            const isEditable = element.contentEditable === 'true' || 
                              element.tagName.toLowerCase() === 'textarea' ||
                              element.tagName.toLowerCase() === 'input';
            
            if (isEditable) {
                return element;
            }
        }
    }
    
    return null;
}

/**
 * Clicks the comment button to open the comment box.
 */
async function openCommentBox(postElement) {
    const commentButton = findCommentButton(postElement);
    if (!commentButton) {
        console.error("Available buttons in post:", 
            Array.from(postElement.querySelectorAll('button')).map(b => ({
                text: b.textContent.trim(),
                ariaLabel: b.getAttribute('aria-label'),
                id: b.id,
                className: b.className
            }))
        );
        throw new Error("Comment button not found");
    }

    // Check if comment box is already open
    const existingCommentBox = findCommentBox(postElement);
    if (existingCommentBox) {
        return existingCommentBox;
    }

    // Click the comment button
    commentButton.click();

    // Wait for the comment box to appear
    try {
        // Try each selector until we find the comment box
        let commentBox = null;
        for (const selector of COMMENT_BOX_SELECTORS) {
            try {
                commentBox = await waitForElement(selector, postElement, 1000);
                if (commentBox) {
                    break;
                }
            } catch (e) {
                // Continue to next selector
                continue;
            }
        }
        
        if (!commentBox) {
            // Final attempt with a more generic approach
            commentBox = findCommentBox(postElement);
        }
        
        if (!commentBox) {
            throw new Error("Comment box not found with any selector");
        }
        
        return commentBox;
    } catch (error) {
        throw new Error("Comment box did not appear after clicking comment button: " + error.message);
    }
}

/**
 * Fills the comment box with the generated text.
 */
function fillCommentBox(commentBox, text) {
    // Try different methods to fill the comment box as LinkedIn uses rich text editors
    const p = commentBox.querySelector("p");
    if (p) {
        p.innerText = text;
        p.textContent = text;
    } else {
        commentBox.innerText = text;
        commentBox.textContent = text;
    }

    // Trigger various events to ensure LinkedIn recognizes the input
    const events = ['input', 'change', 'keyup', 'paste'];
    events.forEach(eventType => {
        commentBox.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
    });

    // Also try triggering on the paragraph element if it exists
    if (p) {
        events.forEach(eventType => {
            p.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
        });
    }

    // Focus the comment box to make it active
    commentBox.focus();
    if (p) {
        p.focus();
    }
}

/**
 * Handles the click event on the "Generate with AI" button.
 */
async function handleGenerateClick(event) {
    const button = event.currentTarget;
    const postElement = button.closest(POST_SELECTOR);
    if (!postElement) {
        console.error("Could not find parent post element.");
        return;
    }

    const postContentElement = postElement.querySelector(POST_CONTENT_SELECTOR);
    if (!postContentElement) {
        console.error("Could not find post content.");
        return;
    }

    const postContent = postContentElement.innerText.trim();
    if (!postContent) {
        console.error("Post content is empty.");
        return;
    }
    
    button.textContent = "Generating...";
    button.disabled = true;

    try {
        // First, open the comment box
        const commentBox = await openCommentBox(postElement);
        
        // Generate the comment
        const response = await chrome.runtime.sendMessage({ action: "generateComment", postContent: postContent });
        
        if (response.success) {
            // Fill the comment box with the generated text
            fillCommentBox(commentBox, response.comment);
            console.log("Comment generated and filled successfully:", response.comment);
        } else {
            console.error("Failed to generate comment:", response.message);
            alert(`Error: ${response.message}`);
        }
    } catch (error) {
        console.error("Error in comment generation process:", error);
        alert(`An error occurred: ${error.message}`);
    } finally {
        button.textContent = "✨ Gen AI";
        button.disabled = false;
    }
}

/**
 * Injects the "Generate with AI" button into a post's action bar.
 */
function injectButtonIntoPost(postElement) {
    if (postElement.querySelector(`#${GENERATE_BUTTON_ID}`)) {
        return; // Button already exists
    }

    const actionsContainer = postElement.querySelector(POST_ACTIONS_SELECTOR)?.parentElement;
    if (actionsContainer) {
        const generateButton = createGenerateButton();
        generateButton.addEventListener("click", handleGenerateClick);
        actionsContainer.appendChild(generateButton);
    }
}

/**
 * Sets up a MutationObserver to watch for new posts being added to the feed.
 */
function observeFeed() {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches(POST_SELECTOR)) {
                            injectButtonIntoPost(node);
                        } else {
                            node.querySelectorAll(POST_SELECTOR).forEach(injectButtonIntoPost);
                        }
                    }
                });
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Initial run for posts already on the page
document.querySelectorAll(POST_SELECTOR).forEach(injectButtonIntoPost);

// Start observing for new posts
observeFeed(); 