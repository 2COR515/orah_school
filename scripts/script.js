// scripts/script.js
// Redirect logic for header teach button
// This script listens for clicks on the button with id="teach-button"
// and uses window.location.href to navigate the browser to
// instructor-signup.html. Keeping this code in a separate file
// keeps behavior isolated from the main app logic.

(function(){
  // Ensure DOM is ready
  document.addEventListener('DOMContentLoaded', function(){
    var teachBtn = document.getElementById('teach-button');
    if(!teachBtn) return; // button not present on this page

    // On click, set window.location.href to the instructor signup page
    teachBtn.addEventListener('click', function(event){
      // Optional: prevent default if this is inside a form or link
      event.preventDefault && event.preventDefault();

      // Redirect the user to the instructor signup page
      window.location.href = 'instructor-signup.html';
    });
  });
})();
