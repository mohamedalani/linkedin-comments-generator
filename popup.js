// No specific popup logic for now.
// This could be used for more complex popup interactions in the future.
console.log("Popup script loaded.");

// No specific popup logic for now, but we can add a listener
// to open the options page directly if the user clicks a button in the popup.
document.addEventListener('DOMContentLoaded', () => {
    const optionsLink = document.querySelector('a[href="options.html"]');
    if (optionsLink) {
        optionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
        });
    }
}); 