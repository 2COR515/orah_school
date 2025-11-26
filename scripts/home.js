// scripts/home.js
// Logic for homepage interactions: horizontal scroll for topics

// Wait until DOM is ready
document.addEventListener('DOMContentLoaded', function(){
  const container = document.getElementById('topics-container');
  const btnLeft = document.querySelector('.scroll-btn.left');
  const btnRight = document.querySelector('.scroll-btn.right');
  const exploreLink = document.getElementById('explore-link');

  if(!container) return;

  const scrollAmount = 300; // pixels to scroll per click

  // Scroll helpers
  function scrollLeft(){
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }
  function scrollRight(){
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  // Attach events
  if(btnLeft) btnLeft.addEventListener('click', scrollLeft);
  if(btnRight) btnRight.addEventListener('click', scrollRight);

  // Smooth scroll when clicking Explore in header
  // Prevent default anchor jump and scroll smoothly via JS for better control
  if(exploreLink){
    exploreLink.addEventListener('click', function(ev){
      ev.preventDefault();
      const topics = document.getElementById('topics');
      if(topics) topics.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Learn More toggles: show/hide the .more-info inside each topic-card
  // This uses event delegation on the topics container for efficiency
  if(container){
    container.addEventListener('click', function(e){
      const btn = e.target.closest('.btn.small');
      if(!btn) return;
      const card = btn.closest('.topic-card');
      if(!card) return;

      const info = card.querySelector('.more-info');
      const isOpen = card.classList.toggle('open');
      // Manage hidden attribute and aria-expanded for accessibility
      if(info){
        if(isOpen){
          info.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
        } else {
          // collapse: allow transition then hide to keep it accessible
          info.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Optionally show/hide buttons when at scroll ends
  function updateButtons(){
    if(!btnLeft || !btnRight) return;
    const maxScrollLeft = container.scrollWidth - container.clientWidth - 2; // tolerance
    btnLeft.style.visibility = container.scrollLeft > 10 ? 'visible' : 'hidden';
    btnRight.style.visibility = container.scrollLeft < maxScrollLeft - 10 ? 'visible' : 'hidden';
  }

  // Update on scroll and on load
  container.addEventListener('scroll', () => {
    // throttle lightly
    window.requestAnimationFrame(updateButtons);
  });
  updateButtons();

  // Contact form simple handler (prevent real submit)
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      alert('Thank you! Message received (demo).');
      contactForm.reset();
    });
  }
});
