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
  "textbox",
  ".ql-editor",
  '[data-placeholder*="comment"]',
  '[data-placeholder*="Comment"]',
];
// Multiple selectors for comment button to handle different LinkedIn versions/languages
const COMMENT_BUTTON_SELECTORS = [
  'button[aria-label*="Comment"]',
  'button[aria-label*="Commenter"]',
  'button:has-text("Comment")',
  'button:has-text("Commenter")',
  '[data-control-name="comment"]',
  'button[id*="comment"]',
];
// Multiple selectors for like button to handle different LinkedIn versions/languages
const LIKE_BUTTON_SELECTORS = [
  'button[aria-label*="Réagir avec"]',
  'button[aria-label*="React with"]',
  'button[aria-label*="Like"]',
  'button[aria-label*="J\'aime"]',
  '[data-control-name="like"]',
  'button[id*="like"]',
];
// Multiple selectors for reply buttons to handle different LinkedIn versions/languages
const REPLY_BUTTON_SELECTORS = [
  'button[aria-label*="Répondre au commentaire"]',
  'button[aria-label*="Reply to comment"]',
  'button:has-text("Répondre")',
  'button:has-text("Reply")',
  '[data-control-name="reply"]',
  'button[id*="reply"]',
];
const GENERATE_BUTTON_ID = "generate-ai-comment-btn";
const GENERATE_REPLY_BUTTON_ID = "generate-ai-reply-btn";

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
 * Creates and returns the "Generate Reply with AI" button for replies.
 */
function createGenerateReplyButton() {
  const button = document.createElement("button");
  button.className = GENERATE_REPLY_BUTTON_ID;
  button.textContent = "✨ AI";
  button.style.marginLeft = "8px";
  button.style.padding = "4px 8px";
  button.style.border = "1px solid #0a66c2";
  button.style.borderRadius = "12px";
  button.style.backgroundColor = "white";
  button.style.color = "#0a66c2";
  button.style.cursor = "pointer";
  button.style.fontFamily = "inherit";
  button.style.fontWeight = "600";
  button.style.fontSize = "12px";
  button.title = "Generate a reply with AI";
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
      subtree: true,
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
    if (selector.includes(":has-text")) {
      continue;
    }

    const button = postElement.querySelector(selector);
    if (button) {
      return button;
    }
  }

  // Fallback: look for buttons containing "Comment" or "Commenter" text
  const buttons = postElement.querySelectorAll("button");
  for (const button of buttons) {
    const text = button.textContent.trim().toLowerCase();
    const ariaLabel = button.getAttribute("aria-label")?.toLowerCase() || "";

    if (
      text.includes("comment") ||
      text.includes("commenter") ||
      ariaLabel.includes("comment") ||
      ariaLabel.includes("commenter")
    ) {
      return button;
    }
  }

  return null;
}

/**
 * Finds the reply button using multiple selectors to handle different LinkedIn versions.
 */
function findReplyButton(commentElement) {
  for (const selector of REPLY_BUTTON_SELECTORS) {
    // Skip :has-text selectors as they're not standard CSS selectors
    if (selector.includes(":has-text")) {
      continue;
    }

    const button = commentElement.querySelector(selector);
    if (button) {
      return button;
    }
  }

  // Fallback: look for buttons containing "Répondre" or "Reply" text
  const buttons = commentElement.querySelectorAll("button");
  for (const button of buttons) {
    const text = button.textContent.trim().toLowerCase();
    const ariaLabel = button.getAttribute("aria-label")?.toLowerCase() || "";

    if (
      text.includes("répondre") ||
      text.includes("reply") ||
      ariaLabel.includes("répondre") ||
      ariaLabel.includes("reply")
    ) {
      return button;
    }
  }

  return null;
}

/**
 * Finds the like button using multiple selectors to handle different LinkedIn versions.
 */
function findLikeButton(postElement) {
  for (const selector of LIKE_BUTTON_SELECTORS) {
    const button = postElement.querySelector(selector);
    if (button) {
      return button;
    }
  }

  // Fallback: look for buttons containing "Like", "J'aime", or related text
  const buttons = postElement.querySelectorAll("button");
  for (const button of buttons) {
    const text = button.textContent.trim().toLowerCase();
    const ariaLabel = button.getAttribute("aria-label")?.toLowerCase() || "";

    if (
      text.includes("like") ||
      text.includes("j'aime") ||
      text.includes("réagir") ||
      ariaLabel.includes("like") ||
      ariaLabel.includes("j'aime") ||
      ariaLabel.includes("réagir")
    ) {
      return button;
    }
  }

  return null;
}

/**
 * Extracts the content of a comment element.
 */
function extractCommentContent(commentElement) {
  // Try to find the comment text content
  const contentSelectors = [
    '.feed-shared-text',
    '.comments-comment-item__main-content',
    '.update-components-text',
    '[data-test-id="comment-text"]',
    '.comment-text',
    'span[dir="ltr"]'
  ];

  for (const selector of contentSelectors) {
    const contentElement = commentElement.querySelector(selector);
    if (contentElement) {
      return contentElement.innerText.trim();
    }
  }

  // Fallback: try to get text from the comment element itself
  const commentText = commentElement.innerText || commentElement.textContent || "";
  return commentText.trim();
}

/**
 * Clicks the like button for a specific post.
 */
async function likePost(postElement) {
  try {
    const likeButton = findLikeButton(postElement);
    if (!likeButton) {
      console.error("Like button not found in post");
      return false;
    }

    // Check if the post is already liked by examining button state
    const ariaLabel = likeButton.getAttribute("aria-label") || "";
    const isAlreadyLiked =
      ariaLabel.includes("Unlike") ||
      ariaLabel.includes("Annuler") ||
      likeButton.classList.contains("active") ||
      likeButton.querySelector('[data-test-icon="thumbs-up-filled"]');

    if (isAlreadyLiked) {
      console.log("Post is already liked, skipping...");
      return true;
    }

    // Click the like button
    likeButton.click();
    console.log("Post liked successfully");
    return true;
  } catch (error) {
    console.error("Error liking post:", error);
    return false;
  }
}

/**
 * Finds the comment box using multiple selectors to handle different LinkedIn versions.
 */
function findCommentBox(postElement) {
  for (const selector of COMMENT_BOX_SELECTORS) {
    const element = postElement.querySelector(selector);
    if (element) {
      // Additional validation to ensure it's actually a comment input
      const isEditable =
        element.contentEditable === "true" ||
        element.tagName.toLowerCase() === "textarea" ||
        element.tagName.toLowerCase() === "input";

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
    console.error(
      "Available buttons in post:",
      Array.from(postElement.querySelectorAll("button")).map((b) => ({
        text: b.textContent.trim(),
        ariaLabel: b.getAttribute("aria-label"),
        id: b.id,
        className: b.className,
      })),
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
    throw new Error(
      "Comment box did not appear after clicking comment button: " +
        error.message,
    );
  }
}

/**
 * Clicks the reply button to open the reply box.
 */
async function openReplyBox(commentElement) {
  const replyButton = findReplyButton(commentElement);
  if (!replyButton) {
    console.error(
      "Available buttons in comment:",
      Array.from(commentElement.querySelectorAll("button")).map((b) => ({
        text: b.textContent.trim(),
        ariaLabel: b.getAttribute("aria-label"),
        id: b.id,
        className: b.className,
      })),
    );
    throw new Error("Reply button not found");
  }

  // Click the reply button
  replyButton.click();

  // Wait for the reply box to appear
  try {
    // Try each selector until we find the reply box
    let replyBox = null;
    for (const selector of COMMENT_BOX_SELECTORS) {
      try {
        replyBox = await waitForElement(selector, commentElement, 2000);
        if (replyBox) {
          break;
        }
      } catch (e) {
        // Continue to next selector
        continue;
      }
    }

    if (!replyBox) {
      // Try to find it in the parent or sibling elements
      const parentElement = commentElement.parentElement;
      if (parentElement) {
        for (const selector of COMMENT_BOX_SELECTORS) {
          try {
            replyBox = await waitForElement(selector, parentElement, 1000);
            if (replyBox) {
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (!replyBox) {
      throw new Error("Reply box not found with any selector");
    }

    return replyBox;
  } catch (error) {
    throw new Error(
      "Reply box did not appear after clicking reply button: " +
        error.message,
    );
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
  const events = ["input", "change", "keyup", "paste"];
  events.forEach((eventType) => {
    commentBox.dispatchEvent(
      new Event(eventType, { bubbles: true, cancelable: true }),
    );
  });

  // Also try triggering on the paragraph element if it exists
  if (p) {
    events.forEach((eventType) => {
      p.dispatchEvent(
        new Event(eventType, { bubbles: true, cancelable: true }),
      );
    });
  }

  // Focus the comment box to make it active
  commentBox.focus();
  if (p) {
    p.focus();
  }
}

/**
 * Waits for user to validate the comment and then automatically likes the post.
 */
async function waitForCommentValidationAndLike(postElement, commentBox) {
  return new Promise((resolve) => {
    // Create a mutation observer to watch for comment submission
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check if the comment box content has been cleared (indicating submission)
        if (
          mutation.type === "childList" ||
          mutation.type === "characterData"
        ) {
          const currentText =
            commentBox.textContent || commentBox.innerText || "";
          if (
            currentText.trim() === "" ||
            currentText.includes("Ajouter un commentaire")
          ) {
            // Comment was likely submitted, now like the post
            console.log(
              "Comment appears to have been submitted, liking post...",
            );
            observer.disconnect();
            setTimeout(() => {
              likePost(postElement).then(resolve);
            }, 1000); // Small delay to ensure comment is fully processed
          }
        }
      });
    });

    // Also listen for specific LinkedIn events that might indicate comment submission
    const handleSubmit = (event) => {
      if (
        event.target.closest(".comments-comment-box") ||
        event.target.closest('[data-test-id="comment-form"]')
      ) {
        console.log("Comment form submission detected, liking post...");
        document.removeEventListener("click", handleSubmit);
        setTimeout(() => {
          likePost(postElement).then(resolve);
        }, 1000);
      }
    };

    // Watch for changes in the comment box
    observer.observe(commentBox, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Listen for form submissions
    document.addEventListener("click", handleSubmit);

    // Fallback: stop observing after 5 minutes
    setTimeout(() => {
      observer.disconnect();
      document.removeEventListener("click", handleSubmit);
      resolve(false);
    }, 300000); // 5 minutes
  });
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
    const response = await chrome.runtime.sendMessage({
      action: "generateComment",
      postContent: postContent,
    });

    if (response.success) {
      // Fill the comment box with the generated text
      fillCommentBox(commentBox, response.comment);
      console.log(
        "Comment generated and filled successfully:",
        response.comment,
      );

      // Start watching for comment validation and auto-like
      waitForCommentValidationAndLike(postElement, commentBox);
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
 * Handles the click event on the "Generate Reply with AI" button.
 */
async function handleGenerateReplyClick(event) {
  const button = event.currentTarget;
  const commentElement = button.closest("article") || button.closest(".comments-comment-item");
  if (!commentElement) {
    console.error("Could not find parent comment element.");
    return;
  }

  // Extract the comment content to reply to
  const commentContent = extractCommentContent(commentElement);
  if (!commentContent) {
    console.error("Could not extract comment content.");
    return;
  }

  // Find the original post content for context
  const postElement = commentElement.closest(POST_SELECTOR);
  let postContent = "";
  if (postElement) {
    const postContentElement = postElement.querySelector(POST_CONTENT_SELECTOR);
    if (postContentElement) {
      postContent = postContentElement.innerText.trim();
    }
  }

  button.textContent = "Generating...";
  button.disabled = true;

  try {
    // First, open the reply box
    const replyBox = await openReplyBox(commentElement);

    // Generate the reply using both post and comment content
    const response = await chrome.runtime.sendMessage({
      action: "generateReply",
      postContent: postContent,
      commentContent: commentContent,
    });

    if (response.success) {
      // Fill the reply box with the generated text
      fillCommentBox(replyBox, response.comment);
      console.log(
        "Reply generated and filled successfully:",
        response.comment,
      );
    } else {
      console.error("Failed to generate reply:", response.message);
      alert(`Error: ${response.message}`);
    }
  } catch (error) {
    console.error("Error in reply generation process:", error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    button.textContent = "✨ AI";
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

  const actionsContainer = postElement.querySelector(
    POST_ACTIONS_SELECTOR,
  )?.parentElement;
  if (actionsContainer) {
    const generateButton = createGenerateButton();
    generateButton.addEventListener("click", handleGenerateClick);
    actionsContainer.appendChild(generateButton);
  }
}

/**
 * Injects the "Generate Reply with AI" button into a comment's action area.
 */
function injectReplyButtonIntoComment(commentElement) {
  // Check if button already exists
  if (commentElement.querySelector(`.${GENERATE_REPLY_BUTTON_ID}`)) {
    return;
  }

  // Find the reply button to place our AI button next to it
  const replyButton = findReplyButton(commentElement);
  if (!replyButton) {
    return; // No reply button found, skip this comment
  }

  // Find the container that holds the reply button
  const actionsContainer = replyButton.parentElement;
  if (actionsContainer) {
    const generateReplyButton = createGenerateReplyButton();
    generateReplyButton.addEventListener("click", handleGenerateReplyClick);

    // Insert the AI button after the reply button
    actionsContainer.insertBefore(generateReplyButton, replyButton.nextSibling);
  }
}

/**
 * Finds and processes all comments in the document to inject reply buttons.
 */
function injectReplyButtonsIntoComments() {
  // Look for comment elements using various selectors
  const commentSelectors = [
    'article[data-id*="comment"]',
    '.comments-comment-item',
    '.feed-shared-comment',
    'article[role="article"]',
    '.comment-item'
  ];

  for (const selector of commentSelectors) {
    const comments = document.querySelectorAll(selector);
    comments.forEach(injectReplyButtonIntoComment);
  }

  // Also look for comments that might be nested differently
  const allArticles = document.querySelectorAll('article');
  allArticles.forEach(article => {
    // Check if this article contains a reply button (indicating it's a comment)
    if (findReplyButton(article)) {
      injectReplyButtonIntoComment(article);
    }
  });
}

/**
 * Sets up a MutationObserver to watch for new posts being added to the feed.
 */
function observeFeed() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches(POST_SELECTOR)) {
              injectButtonIntoPost(node);
            } else {
              node
                .querySelectorAll(POST_SELECTOR)
                .forEach(injectButtonIntoPost);
            }

            // Also check for new comments and inject reply buttons
            injectReplyButtonsIntoComments();
          }
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initial run for posts already on the page
document.querySelectorAll(POST_SELECTOR).forEach(injectButtonIntoPost);

// Initial run for comments already on the page
injectReplyButtonsIntoComments();

// Start observing for new posts and comments
observeFeed();
