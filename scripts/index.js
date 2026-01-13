// scripts/index.js
// Landing page featured lessons display

const API_BASE_URL = 'http://localhost:3002/api';

document.addEventListener('DOMContentLoaded', async () => {
  await loadFeaturedLessons();
});

/**
 * Load and display featured lessons on landing page
 */
async function loadFeaturedLessons() {
  try {
    const response = await fetch(`${API_BASE_URL}/lessons`);
    
    if (!response.ok) {
      console.error('Failed to fetch lessons:', response.status);
      return;
    }
    
    const data = await response.json();
    const lessons = data.lessons || [];
    
    // Filter published lessons and get top 3 most recent
    const publishedLessons = lessons
      .filter(lesson => lesson.status === 'published')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
    
    if (publishedLessons.length > 0) {
      renderFeaturedLessons(publishedLessons);
    }
    
  } catch (error) {
    console.error('Error loading featured lessons:', error);
  }
}

/**
 * Render featured lessons section
 */
function renderFeaturedLessons(lessons) {
  // Find or create featured lessons section
  let featuredSection = document.getElementById('featured-lessons-section');
  
  if (!featuredSection) {
    // Look for a suitable container in the landing page
    const main = document.querySelector('main') || 
                 document.querySelector('.home-main') || 
                 document.querySelector('.content') ||
                 document.body;
    
    featuredSection = document.createElement('section');
    featuredSection.id = 'featured-lessons-section';
    featuredSection.style.cssText = `
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #f9f6ff 0%, #ffffff 100%);
    `;
    
    // Insert before footer or at end of main
    const footer = document.querySelector('footer');
    if (footer) {
      main.insertBefore(featuredSection, footer);
    } else {
      main.appendChild(featuredSection);
    }
  }
  
  // Build section content
  featuredSection.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 3rem;">
        <h2 style="color: #3B0270; font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700;">
          Featured Data Science Lessons 🎓
        </h2>
        <p style="color: #666; font-size: 1.1rem; max-width: 600px; margin: 0 auto;">
          Start your learning journey with our most popular courses
        </p>
      </div>
      
      <div id="featured-lessons-grid" style="
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
        gap: 2rem;
        margin-bottom: 2rem;
      "></div>
      
      <div style="text-align: center; margin-top: 3rem;">
        <a href="signup.html" style="
          display: inline-block;
          padding: 1rem 3rem;
          background: linear-gradient(135deg, #6F00FF 0%, #3B0270 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          box-shadow: 0 4px 16px rgba(111, 0, 255, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(111, 0, 255, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(111, 0, 255, 0.3)';">
          Get Started - Sign Up Free →
        </a>
      </div>
    </div>
  `;
  
  // Render lesson cards
  const grid = document.getElementById('featured-lessons-grid');
  
  lessons.forEach((lesson, index) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s, box-shadow 0.3s;
      position: relative;
      overflow: hidden;
    `;
    
    // Add hover effects
    card.onmouseover = () => {
      card.style.transform = 'translateY(-8px)';
      card.style.boxShadow = '0 8px 24px rgba(111, 0, 255, 0.15)';
    };
    card.onmouseout = () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
    };
    
    // Event delegation for Read More button
    card.addEventListener('click', handleReadMoreClick);
    
    // Badge for featured lesson
    const badges = ['🌟 Most Popular', '🔥 Trending', '✨ New'];
    const badge = badges[index] || '📚 Featured';
    
    card.innerHTML = `
      <div style="
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: linear-gradient(135deg, #E9B3FB 0%, #D896F5 100%);
        color: #3B0270;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      ">
        ${badge}
      </div>
      
      <div style="margin-top: 2rem;">
        <h3 style="
          color: #3B0270;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
          line-height: 1.3;
        ">
          ${escapeHtml(lesson.title)}
        </h3>
        
        <div class="course-description" style="
          color: #666;
          line-height: 1.6;
          margin-bottom: 0.5rem;
          min-height: 60px;
        ">
          ${escapeHtml(lesson.description || 'Comprehensive data science lesson covering essential concepts and practical applications.')}
        </div>
        
        <button class="read-more-btn" style="margin-bottom: 1rem;">Read More</button>
        
        <div style="
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
        ">
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #666;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M2 12h20"></path>
            </svg>
            <span style="font-size: 0.9rem;">${escapeHtml(lesson.topic || 'Data Science')}</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #666;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style="font-size: 0.9rem;">${lesson.duration || '30 min'}</span>
          </div>
        </div>
        
        <a href="signup.html" style="
          display: block;
          text-align: center;
          padding: 0.875rem;
          background: #6F00FF;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: background 0.2s;
        " onmouseover="this.style.background='#5a00cc';" onmouseout="this.style.background='#6F00FF';">
          Enroll Now - Free →
        </a>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* -----------------------
   Live Search (Navbar)
   ----------------------- */
(() => {
  const MIN_QUERY_LENGTH = 2;
  const DEBOUNCE_MS = 300;
  let debounceTimer = null;
  let dropdownEl = null;
  let latestResults = [];

  function createDropdown() {
    if (dropdownEl) return dropdownEl;
    dropdownEl = document.createElement('div');
    dropdownEl.className = 'search-results-dropdown';
    dropdownEl.style.display = 'none';
    document.body.appendChild(dropdownEl);
    return dropdownEl;
  }

  function positionDropdown(inputEl, dropdown) {
    const rect = inputEl.getBoundingClientRect();
    dropdown.style.minWidth = rect.width + 'px';
    dropdown.style.left = (window.scrollX + rect.left) + 'px';
    dropdown.style.top = (window.scrollY + rect.bottom + 6) + 'px';
  }

  function hideDropdown() {
    if (!dropdownEl) return;
    dropdownEl.style.display = 'none';
    dropdownEl.innerHTML = '';
    latestResults = [];
  }

  function showResults(inputEl, results) {
    const dd = createDropdown();
    const ul = document.createElement('ul');

    if (!results || results.length === 0) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      li.style.padding = '10px 12px';
      ul.appendChild(li);
      latestResults = [];
    } else {
      results.forEach(r => {
        const li = document.createElement('li');
        li.tabIndex = 0;
        li.innerHTML = `
          <div class="result-title">${escapeHtml(r.title)}</div>
          <div class="result-desc">${escapeHtml((r.description||'').slice(0, 100))}</div>
        `;
        li.addEventListener('click', () => {
          window.location.href = r.url || `/lesson.html?id=${encodeURIComponent(r.id)}`;
        });
        li.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') li.click();
        });
        ul.appendChild(li);
      });
      latestResults = results;
    }

    dd.innerHTML = '';
    dd.appendChild(ul);
    positionDropdown(inputEl, dd);
    dd.style.display = 'block';
  }

  function fetchSearch(query, inputEl) {
    fetch(`${API_BASE_URL}/courses/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        if (!data || !Array.isArray(data.courses)) return showResults(inputEl, []);
        showResults(inputEl, data.courses);
      })
      .catch(err => {
        console.error('Search error', err);
        showResults(inputEl, []);
      });
  }

  function init() {
    const input = document.getElementById('nav-search-input');
    if (!input) return;

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!dropdownEl) return;
      if (target === input) return;
      if (dropdownEl.contains(target)) return;
      hideDropdown();
    });

    // Hide when input cleared; debounce searches when typing
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length < MIN_QUERY_LENGTH) {
        hideDropdown();
        return;
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchSearch(q, input), DEBOUNCE_MS);
    });

    // Enter selects first result if available
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (latestResults && latestResults.length > 0) {
          const r = latestResults[0];
          e.preventDefault();
          window.location.href = r.url || `/lesson.html?id=${encodeURIComponent(r.id)}`;
        }
      }
    });

    // reposition dropdown on resize/scroll
    window.addEventListener('resize', () => { if (dropdownEl && dropdownEl.style.display === 'block') positionDropdown(input, dropdownEl); });
    window.addEventListener('scroll', () => { if (dropdownEl && dropdownEl.style.display === 'block') positionDropdown(input, dropdownEl); });
  }

  // init when DOM ready (file already runs on load earlier)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * Handle Read More / Read Less button clicks
 * Uses event delegation for dynamically created cards
 */
function handleReadMoreClick(e) {
  if (!e.target.classList.contains('read-more-btn')) {
    return; // Not a read-more button
  }

  e.preventDefault();
  e.stopPropagation();

  const btn = e.target;
  const descEl = btn.previousElementSibling; // .course-description should be the previous sibling

  if (!descEl || !descEl.classList.contains('course-description')) {
    console.warn('Could not find course-description element');
    return;
  }

  // Toggle expanded state
  const isExpanded = descEl.classList.contains('expanded');

  if (isExpanded) {
    descEl.classList.remove('expanded');
    btn.textContent = 'Read More';
  } else {
    descEl.classList.add('expanded');
    btn.textContent = 'Read Less';
  }
}
