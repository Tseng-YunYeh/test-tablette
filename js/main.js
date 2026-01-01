let translations = {};

document.addEventListener('DOMContentLoaded', () => {
    // ===== Custom Cursor =====
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    if (cursorDot && cursorRing) {
        // Get saved cursor position from previous page (if any)
        const savedX = sessionStorage.getItem('cursorX');
        const savedY = sessionStorage.getItem('cursorY');
        
        let mouseX = savedX ? parseFloat(savedX) : window.innerWidth / 2;
        let mouseY = savedY ? parseFloat(savedY) : window.innerHeight / 2;
        let ringX = mouseX, ringY = mouseY;

        // Set initial position immediately
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
        cursorRing.style.left = `${ringX}px`;
        cursorRing.style.top = `${ringY}px`;

        // Update mouse position
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Save position for page transitions
            sessionStorage.setItem('cursorX', mouseX);
            sessionStorage.setItem('cursorY', mouseY);

            // Dot follows instantly (centered with CSS transform)
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        });

        // Smooth ring animation
        function animateRing() {
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;
            cursorRing.style.left = `${ringX}px`;
            cursorRing.style.top = `${ringY}px`;
            requestAnimationFrame(animateRing);
        }
        animateRing();

        // Hover effects on interactive elements
        const hoverElements = document.querySelectorAll('a, button, .btn, .project-card, input, textarea, select');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorRing.classList.add('hovering');
                cursorDot.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursorRing.classList.remove('hovering');
                cursorDot.classList.remove('hovering');
            });
        });

        // Click effects
        window.addEventListener('mousedown', () => cursorRing.classList.add('clicking'));
        window.addEventListener('mouseup', () => cursorRing.classList.remove('clicking'));
    }

    // Initialize nav links and language links split text on load
    document.querySelectorAll('.nav-links a[data-i18n], .lang-content a').forEach(el => {
        const text = el.getAttribute('data-text') || el.textContent.trim();
        splitTextToSpans(el, text);
    });

    // Intro Loader Logic
    const loader = document.getElementById('intro-loader');
    
    // Check if this is an internal navigation
    const isInternalNav = sessionStorage.getItem('internalNav');

    if (loader) {
        if (isInternalNav) {
            // If internal navigation, hide loader immediately
            loader.style.display = 'none';
            document.body.classList.remove('loading');
            sessionStorage.removeItem('internalNav'); // Clear flag for next time (e.g. refresh)
        } else {
            // If refresh or first visit, show animation
            document.body.classList.add('loading');
            
            // Wait for animation to finish (approx 2.5s total)
            setTimeout(() => {
                loader.classList.add('loader-hidden');
                document.body.classList.remove('loading');
                
                // Remove from DOM after transition
                loader.addEventListener('transitionend', () => {
                    loader.remove();
                });
            }, 2500); 
        }
    }

    // Add click listeners to internal links to set the flag
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="index.html"], a[href^="about.html"], a[href^="portfolio.html"], a[href^="contact.html"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Only set flag if not opening in new tab
            if (!e.ctrlKey && !e.metaKey && link.target !== '_blank') {
                sessionStorage.setItem('internalNav', 'true');
            }
        });
    });

    // Cookie Helpers
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Theme Switcher
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle ? themeToggle.querySelector('i') : null;
    // Default to dark mode if no preference saved
    const savedTheme = getCookie('theme') || 'dark';

    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark' && icon) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else if (savedTheme === 'light' && icon) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            setCookie('theme', newTheme, 365); // Save for 1 year

            if (icon) {
                icon.classList.toggle('fa-moon');
                icon.classList.toggle('fa-sun');
            }
        });
    }

    // Language Switcher
    const langBtnDesktop = document.getElementById('lang-btn-desktop');
    const langBtnMobile = document.getElementById('lang-btn-mobile');
    const langOptions = document.querySelectorAll('[data-lang]');
    let currentLang = getCookie('lang') || 'en';
    // let translations = {}; // Moved to global scope

    const langMap = {
        'en': 'EN',
        'fr': 'FR',
        'es': 'ES',
        'zh': 'ZH'
    };

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`i18n/${lang}.json`);
            translations = await response.json();
            applyTranslations();
            updateLangButtons(lang);
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    function splitTextToSpans(element, text) {
        element.innerHTML = '';
        element.setAttribute('aria-label', text); // Accessibility
        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'char';
            span.style.setProperty('--i', index);
            span.setAttribute('data-char', char);
            element.appendChild(span);
        });
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const keys = key.split('.');
            let value = translations;
            keys.forEach(k => {
                if (value) value = value[k];
            });
            
            if (value) {
                // Check if it's a nav link or language link to apply the split effect
                if (element.closest('.nav-links') || element.closest('.lang-content')) {
                    splitTextToSpans(element, value);
                } else {
                    element.textContent = value;
                }
                
                // Update glitch-text data-text attribute for the glitch effect
                const glitchParent = element.closest('.glitch-text');
                if (glitchParent) {
                    glitchParent.setAttribute('data-text', value);
                }
            }
        });

        // Update "All" filter button if it exists
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn && translations.portfolio && translations.portfolio.filterAll) {
            allBtn.textContent = translations.portfolio.filterAll;
        }
    }

    function updateLangButtons(lang) {
        const langText = langMap[lang] || 'EN';
        const btnContent = `${langText} <i class="fas fa-chevron-down"></i>`;
        
        if (langBtnDesktop) langBtnDesktop.innerHTML = btnContent;
        if (langBtnMobile) langBtnMobile.innerHTML = btnContent;
    }

    async function setLanguage(lang) {
        currentLang = lang;
        setCookie('lang', currentLang, 365);
        await loadTranslations(currentLang);
        const allText = translations.portfolio && translations.portfolio.filterAll ? translations.portfolio.filterAll : 'All';
        loadPortfolio(currentLang, allText);
    }

    function toggleDropdown(event) {
        event.stopPropagation();
        const dropdown = event.currentTarget.closest('.lang-dropdown');
        // Close other dropdowns first
        document.querySelectorAll('.lang-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });
        dropdown.classList.toggle('active');
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.lang-dropdown').forEach(d => {
            d.classList.remove('active');
        });
    }

    if (langBtnDesktop) {
        langBtnDesktop.addEventListener('click', toggleDropdown);
    }

    if (langBtnMobile) {
        langBtnMobile.addEventListener('click', toggleDropdown);
    }

    document.addEventListener('click', () => {
        closeAllDropdowns();
    });

    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = e.currentTarget.getAttribute('data-lang');
            setLanguage(lang);
            closeAllDropdowns();
        });
    });

    // Initial Load
    loadTranslations(currentLang).then(() => {
        const allText = translations.portfolio && translations.portfolio.filterAll ? translations.portfolio.filterAll : 'All';
        loadPortfolio(currentLang, allText);
    });

    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            
            // Animate Links
            links.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });

            // Hamburger Animation
            hamburger.classList.toggle('toggle');
        });

        // Close menu when a link is clicked
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('nav-active');
                hamburger.classList.remove('toggle');
                
                links.forEach(l => {
                    l.style.animation = '';
                });
            });
        });

        // Reset menu state on resize (fix language button position issue)
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('nav-active');
                hamburger.classList.remove('toggle');
                links.forEach(l => {
                    l.style.animation = '';
                });
            }
        });
    }

    // Load Portfolio Data
    // loadPortfolio(); // Moved to Initial Load chain

    // Initialize Lightbox
    createLightbox();

    // GSAP Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Hero Animations
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            // Parallax Effect on Hero
            gsap.to(".hero", {
                backgroundPosition: "50% 100%",
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });
        }

        // ============================================
        // CARD STACKING EFFECT - All Pages
        // ============================================
        const stackingContent = document.querySelector('.stacking-content');
        const heroSection = document.querySelector('.hero, .about-hero-header, .portfolio-hero-header, .contact-hero-header');
        
        if (stackingContent && heroSection) {
            // Initial state
            gsap.set(stackingContent, {
                y: 50,
                opacity: 0.9
            });

            // Animate content sliding up and covering hero
            gsap.to(stackingContent, {
                y: 0,
                opacity: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: stackingContent,
                    start: "top 90%",
                    end: "top 20%",
                    scrub: 1
                }
            });

            // Hero content fade out and scale down as content covers it
            gsap.to(heroSection.querySelector('.hero-content, .about-hero-content, .portfolio-hero-content, .contact-hero-content'), {
                scale: 0.95,
                opacity: 0.3,
                ease: "none",
                scrollTrigger: {
                    trigger: stackingContent,
                    start: "top 100%",
                    end: "top 30%",
                    scrub: true
                }
            });
        }
    }
});

let portfolioData = null;

async function loadPortfolio(lang = 'en', allText = 'All') {
    const featuredContainer = document.getElementById('featured-portfolio');
    const fullContainer = document.getElementById('full-portfolio');

    if (!featuredContainer && !fullContainer) return;

    try {
        if (!portfolioData) {
            const response = await fetch('data/projects.json');
            portfolioData = await response.json();
        }
        const data = portfolioData;

        if (featuredContainer) {
            featuredContainer.innerHTML = '';
            // Home Page: Random Selection
            const allProjects = [];
            data.themes.forEach(theme => {
                theme.projects.forEach(project => {
                    allProjects.push(project);
                });
            });

            // Shuffle and pick 3
            const shuffled = allProjects.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);

            selected.forEach(project => {
                const card = createProjectCard(project, lang);
                featuredContainer.appendChild(card);
            });
        }

        if (fullContainer) {
            // Portfolio Page: Filterable Grid
            fullContainer.innerHTML = ''; // Clear existing content

            // 1. Create Filter Controls
            const filterContainer = document.createElement('div');
            filterContainer.className = 'filter-container';
            
            const allBtn = document.createElement('button');
            allBtn.className = 'filter-btn active';
            allBtn.textContent = allText;
            allBtn.dataset.filter = 'all';
            filterContainer.appendChild(allBtn);

            data.themes.forEach(theme => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.textContent = theme.title[lang] || theme.title['en'];
                btn.dataset.filter = theme.id;
                filterContainer.appendChild(btn);
            });

            fullContainer.appendChild(filterContainer);

            // 2. Create Grid
            const grid = document.createElement('div');
            grid.className = 'portfolio-grid';

            data.themes.forEach(theme => {
                theme.projects.forEach(project => {
                    const card = createProjectCard(project, lang);
                    card.dataset.category = theme.id;
                    // Add animation class for initial load
                    card.classList.add('fade-in-up');
                    grid.appendChild(card);
                });
            });

            fullContainer.appendChild(grid);

            // 3. Filter Logic
            const buttons = filterContainer.querySelectorAll('.filter-btn');
            const cards = grid.querySelectorAll('.project-card');

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update Active Button
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filterValue = btn.dataset.filter;

                    cards.forEach(card => {
                        if (filterValue === 'all' || card.dataset.category === filterValue) {
                            card.style.display = 'block';
                            // Small timeout to allow display:block to apply before opacity transition
                            setTimeout(() => {
                                card.style.opacity = '1';
                                card.style.transform = 'translateY(0)';
                            }, 10);
                        } else {
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(20px)';
                            setTimeout(() => {
                                card.style.display = 'none';
                            }, 300); // Match CSS transition duration
                        }
                    });
                });
            });
        }

        // Initialize Observers for new elements
        initObservers();

        // Refresh ScrollTrigger to account for new content height
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }

    } catch (error) {
        console.error('Error loading portfolio:', error);
    }
}

function createProjectCard(project, lang) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.type = project.type;

    let mediaHtml = '';
    
    if (project.type === 'web' || project.type === 'image-gallery') {
        if (project.images && project.images.length > 0) {
            if (project.images.length > 1) {
                // Carousel
                const slides = project.images.map(img => {
                    const title = project.title[lang] || project.title['en'];
                    return `<div class="carousel-slide"><img src="${img}" alt="${title}"></div>`;
                }).join('');
                mediaHtml = `
                    <div class="carousel-container">
                        <div class="carousel-track">
                            ${slides}
                        </div>
                        <button class="carousel-btn prev" onclick="moveCarousel(this, -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="carousel-btn next" onclick="moveCarousel(this, 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                `;
            } else {
                // Single Image
                const title = project.title[lang] || project.title['en'];
                mediaHtml = `<img src="${project.images[0]}" alt="${title}">`;
            }
        } else {
             mediaHtml = `<div style="height:100%; background:#eee; display:flex; align-items:center; justify-content:center;">No Image</div>`;
        }
    } else if (project.type === 'video') {
        mediaHtml = `
            <video controls>
                <source src="${project.src}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    } else if (project.type === 'pdf') {
        const downloadText = (translations.portfolio && translations.portfolio.clickToDownload) ? translations.portfolio.clickToDownload : 'Click to Download';
        const title = project.title[lang] || project.title['en'];
        
        mediaHtml = `
            <div class="pdf-preview">
                <img src="${project.image}" alt="${title}" class="pdf-img">
                <div class="pdf-overlay">
                    <div class="pdf-content">
                        <i class="fas fa-file-download"></i>
                        <span>${downloadText}</span>
                    </div>
                </div>
                <a href="${project.src}" class="pdf-link" download aria-label="${downloadText}"></a>
            </div>
        `;
        card.classList.add('pdf-card');
    }

    const viewLiveText = (translations.portfolio && translations.portfolio.viewLive) ? translations.portfolio.viewLive : 'View Live';
    const linkHtml = project.link ? `<a href="${project.link}" target="_blank" class="btn secondary" style="padding: 5px 15px; font-size: 0.8rem;">${viewLiveText}</a>` : '';
    
    const title = project.title[lang] || project.title['en'];
    const description = project.description[lang] || project.description['en'];

    card.innerHTML = `
        <div class="card-media">
            ${mediaHtml}
        </div>
        <div class="card-content">
            <h3 class="card-title">${title}</h3>
            <p class="card-desc">${description}</p>
            <div class="card-actions">
                ${linkHtml}
            </div>
        </div>
    `;

    return card;
}

window.moveCarousel = function(btn, direction) {
    const container = btn.closest('.carousel-container');
    const track = container.querySelector('.carousel-track');
    const slides = track.children;
    const slideWidth = slides[0].offsetWidth;
    
    let currentIndex = parseInt(track.getAttribute('data-index') || '0');
    let newIndex = currentIndex + direction;

    if (newIndex < 0) newIndex = slides.length - 1;
    if (newIndex >= slides.length) newIndex = 0;

    track.style.transform = `translateX(-${newIndex * slideWidth}px)`;
    track.setAttribute('data-index', newIndex);
};

function initObservers() {
    const observerOptions = {
        threshold: 0.1
    };

    const appearObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                appearObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.project-card');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        appearObserver.observe(el);
    });

    // Skill bars animation observer
    const skillBarsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillFills = entry.target.querySelectorAll('.skill-fill');
                skillFills.forEach(fill => {
                    const width = fill.getAttribute('data-width');
                    setTimeout(() => {
                        fill.style.width = width + '%';
                    }, 300);
                });
                skillBarsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const skillsSection = document.querySelector('.skills-section');
    if (skillsSection) {
        skillBarsObserver.observe(skillsSection);
    }

    // Stats counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statItems = entry.target.querySelectorAll('.stat-item');
                statItems.forEach(item => {
                    const target = parseInt(item.getAttribute('data-count'));
                    const numberEl = item.querySelector('.stat-number');
                    if (numberEl && target) {
                        animateCounter(numberEl, target);
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
}

// Counter animation function
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 1500;
    const stepTime = duration / 50;

    const counter = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(counter);
        } else {
            element.textContent = Math.floor(current);
        }
    }, stepTime);
}

// Initialize observers on page load
document.addEventListener('DOMContentLoaded', () => {
    initObservers();
});

// Keyframes for nav link fade
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes navLinkFade {
        from {
            opacity: 0;
            transform: translateX(50px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(styleSheet);

// Add Gooey Filter for Liquid Effect
function addGooeyFilter() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("style", "position: absolute; width: 0; height: 0; pointer-events: none;");
    svg.innerHTML = `
        <defs>
            <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            </filter>
        </defs>
    `;
    document.body.appendChild(svg);
}
addGooeyFilter();

function createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    document.body.appendChild(lightbox);

    const img = document.createElement('img');
    lightbox.appendChild(img);

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('close');
    closeBtn.innerHTML = '&times;';
    lightbox.appendChild(closeBtn);

    lightbox.addEventListener('click', (e) => {
        if (e.target !== img) {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.style.display = 'none';
                img.src = '';
            }, 300);
        }
    });

    // Event Delegation for Images
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.project-card')) {
            const src = e.target.src;
            img.src = src;
            lightbox.style.display = 'flex';
            // Small timeout to allow display:flex to apply before opacity transition
            setTimeout(() => {
                lightbox.classList.add('active');
            }, 10);
        }
    });
}

// ===== Enhanced Page Header Particle Effect =====
function initPageHeaderParticles() {
    const containers = document.querySelectorAll('.particles-container');
    
    containers.forEach(container => {
        // Create 30 particles
        for (let i = 0; i < 30; i++) {
            createParticle(container);
        }
    });
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    // Random size (2-6px)
    const size = Math.random() * 4 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    
    // Random animation duration (3-7s)
    const duration = Math.random() * 4 + 3;
    particle.style.animationDuration = duration + 's';
    
    // Random animation delay
    particle.style.animationDelay = Math.random() * 4 + 's';
    
    // Random color variation
    const colors = [
        'rgba(99, 102, 241, 0.8)',   // indigo
        'rgba(139, 92, 246, 0.8)',   // purple
        'rgba(236, 72, 153, 0.8)',   // pink
        'rgba(6, 182, 212, 0.8)',    // cyan
        'rgba(255, 255, 255, 0.8)'   // white
    ];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    container.appendChild(particle);
    
    // Animate particle movement
    animateParticle(particle);
}

function animateParticle(particle) {
    const moveX = (Math.random() - 0.5) * 100;
    const moveY = (Math.random() - 0.5) * 100;
    const duration = Math.random() * 5000 + 5000;
    
    particle.animate([
        { transform: 'translate(0, 0)', opacity: 0.8 },
        { transform: `translate(${moveX}px, ${moveY}px)`, opacity: 0.4 },
        { transform: 'translate(0, 0)', opacity: 0.8 }
    ], {
        duration: duration,
        iterations: Infinity,
        easing: 'ease-in-out'
    });
}

// Initialize particles on page load
document.addEventListener('DOMContentLoaded', initPageHeaderParticles);


// ============================================
// ABOUT PAGE - Interactive Effects
// ============================================
function initAboutPageEffects() {
    const aboutHeader = document.querySelector('.about-hero-header');
    if (!aboutHeader) return;

    // Animate Stats Counter on View
    const statItems = document.querySelectorAll('.stat-item');
    const animatedStats = new Set();
    
    const observerOptions = {
        threshold: 0.5
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animatedStats.has(entry.target)) {
                animatedStats.add(entry.target);
                const countEl = entry.target.querySelector('.stat-number');
                const target = parseInt(entry.target.dataset.count);
                animateCounter(countEl, target);
            }
        });
    }, observerOptions);

    statItems.forEach(item => statsObserver.observe(item));

    // Floating icons parallax effect on mouse move
    const floatingIcons = document.querySelectorAll('.floating-icon');
    if (floatingIcons.length > 0) {
        aboutHeader.addEventListener('mousemove', (e) => {
            const rect = aboutHeader.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            floatingIcons.forEach((icon, index) => {
                const speed = (index + 1) * 10;
                icon.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });
        });

        aboutHeader.addEventListener('mouseleave', () => {
            floatingIcons.forEach(icon => {
                icon.style.transform = '';
            });
        });
    }
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}


// ============================================
// PORTFOLIO PAGE - Matrix Code Rain + Effects
// ============================================
function initPortfolioPageEffects() {
    const portfolioHeader = document.querySelector('.portfolio-hero-header');
    if (!portfolioHeader) return;

    // Code Rain Effect
    const canvas = document.getElementById('codeRainCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = portfolioHeader.offsetHeight;

        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const charArray = chars.split('');
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100;
        }

        function drawCodeRain() {
            ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#38bdf8';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        setInterval(drawCodeRain, 50);

        // Resize handler
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = portfolioHeader.offsetHeight;
        });
    }

    // Click Ripple Effect
    portfolioHeader.addEventListener('click', (e) => {
        const rippleArea = document.getElementById('rippleArea');
        if (!rippleArea) return;

        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        
        const rect = portfolioHeader.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        
        rippleArea.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 1000);
    });

    // 3D Tilt Effect on Preview Cards
    const cards = document.querySelectorAll('.preview-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 5;
            const rotateY = (centerX - x) / 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}


// ============================================
// CONTACT PAGE - Interactive Effects
// ============================================
function initContactPageEffects() {
    const contactHeader = document.querySelector('.contact-hero-header');
    if (!contactHeader) return;

    // Magnetic Effect on Social Icons
    const magneticIcons = document.querySelectorAll('.magnetic-icon');
    magneticIcons.forEach(icon => {
        icon.addEventListener('mousemove', (e) => {
            const rect = icon.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            icon.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.1)`;
        });

        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'translate(0, 0) scale(1)';
        });
    });

    // Double-click Easter Egg - Confetti burst
    contactHeader.addEventListener('dblclick', (e) => {
        createConfettiBurst(e.clientX, e.clientY);
    });

    // Bubble hover expand effect
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(bubble => {
        bubble.addEventListener('mouseenter', () => {
            bubble.style.transform = 'scale(1.5)';
            bubble.style.zIndex = '100';
        });
        
        bubble.addEventListener('mouseleave', () => {
            bubble.style.transform = '';
            bubble.style.zIndex = '';
        });

        // Click bubble to create ripple
        bubble.addEventListener('click', () => {
            bubble.style.animation = 'none';
            bubble.offsetHeight;
            bubble.style.animation = 'bubblePop 0.5s ease-out';
            
            setTimeout(() => {
                bubble.style.animation = 'bubbleFloat 6s ease-in-out infinite';
            }, 500);
        });
    });
}

function createConfettiBurst(x, y) {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#38bdf8', '#f59e0b'];
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            z-index: 10000;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        `;
        document.body.appendChild(confetti);

        const angle = (Math.PI * 2 * i) / 30;
        const velocity = Math.random() * 200 + 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        confetti.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${vx}px, ${vy + 200}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
        }).onfinish = () => confetti.remove();
    }
}

// Add bubble pop animation
const bubblePopStyle = document.createElement('style');
bubblePopStyle.textContent = `
    @keyframes bubblePop {
        0% { transform: scale(1); }
        50% { transform: scale(1.5); opacity: 0.5; }
        100% { transform: scale(0.8); opacity: 1; }
    }
`;
document.head.appendChild(bubblePopStyle);


// Initialize all page-specific effects
document.addEventListener('DOMContentLoaded', () => {
    initAboutPageEffects();
    initPortfolioPageEffects();
    initContactPageEffects();
});


// ===== GSAP Text Animations =====

document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        // Initialize animations based on page content
        initHeroAnimation();
        initSectionTitles();
        initTextReveal();
        initListStagger();
    }
});

function initHeroAnimation() {
    const heroTitle = document.querySelector('.hero-content h1');
    const heroSubtitle = document.querySelector('.hero-content p');
    const heroBtn = document.querySelector('.hero-content .cta-group');

    if (heroTitle) {
        const tl = gsap.timeline();
        
        // Check for existing spans to preserve structure/i18n
        const spans = heroTitle.querySelectorAll('span');
        const target = spans.length > 0 ? spans : heroTitle;

        tl.fromTo(target, 
            { y: 100, opacity: 0 },
            {
                duration: 1,
                y: 0,
                opacity: 1,
                stagger: 0.2,
                ease: "back.out(1.7)"
            }
        )
        .fromTo(heroSubtitle, 
            { y: 30, opacity: 0 },
            {
                duration: 1,
                y: 0,
                opacity: 1,
                ease: "power3.out"
            }, "-=0.5")
        .fromTo(heroBtn, 
            { scale: 0.8, opacity: 0 },
            {
                duration: 0.8,
                scale: 1,
                opacity: 1,
                ease: "elastic.out(1, 0.5)"
            }, "-=0.5");
    }
}

function initSectionTitles() {
    const titles = document.querySelectorAll('.section-title, h2:not(.hero-content h2)');
    
    titles.forEach(title => {
        // Create a wrapper for the slide-up effect
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        // Ensure the wrapper respects the title's alignment
        wrapper.style.display = window.getComputedStyle(title).display;
        wrapper.style.textAlign = window.getComputedStyle(title).textAlign;
        
        title.parentNode.insertBefore(wrapper, title);
        wrapper.appendChild(title);

        gsap.fromTo(title, 
            { y: "100%" },
            {
                y: "0%",
                duration: 1.2,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: wrapper,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });
}

function initTextReveal() {
    // Paragraphs and other text blocks
    // Exclude contact-info p as the parent items are already animated
    const textBlocks = document.querySelectorAll('.about-text p, .project-card p');
    
    textBlocks.forEach(block => {
        gsap.fromTo(block,
            { 
                opacity: 0,
                y: 20,
                filter: "blur(10px)"
            },
            {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: block,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });
}

function initListStagger() {
    // Stagger lists like skills or contact info items
    const lists = document.querySelectorAll('.skills-list, .contact-info');
    
    lists.forEach(list => {
        const items = list.children; // Get direct children
        if (items.length > 0) {
            gsap.fromTo(items,
                { 
                    opacity: 0,
                    x: -30
                },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: list,
                        start: "top 85%"
                    }
                }
            );
        }
    });
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > window.innerHeight * 0.2) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// GSAP Floating Shapes Animation
function initFloatingShapes() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    // Hero floating shapes
    gsap.utils.toArray('.hero .floating-shape').forEach((shape, i) => {
        // Continuous floating animation
        gsap.to(shape, {
            y: -20 + (i * 5),
            rotation: 10 - (i * 5),
            duration: 3 + i,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
        
        // Scroll-based parallax and scale
        gsap.to(shape, {
            yPercent: -100 - (i * 30),
            scale: 0.5 + (i * 0.2),
            opacity: 0.3,
            ease: "none",
            scrollTrigger: {
                trigger: '.hero',
                start: "top top",
                end: "bottom top",
                scrub: 1
            }
        });
    });
    
    // Footer floating shapes
    gsap.utils.toArray('footer .floating-shape').forEach((shape, i) => {
        gsap.to(shape, {
            y: -15,
            rotation: 15,
            duration: 4 + i,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
        
        gsap.fromTo(shape, 
            { scale: 0.5, opacity: 0 },
            {
                scale: 1,
                opacity: 0.15,
                scrollTrigger: {
                    trigger: 'footer',
                    start: "top 90%",
                    end: "top 50%",
                    scrub: 1
                }
            }
        );
    });
    
    // Geo stripes parallax
    gsap.utils.toArray('.geo-stripe').forEach((stripe, i) => {
        gsap.to(stripe, {
            xPercent: 20 * (i % 2 === 0 ? 1 : -1),
            ease: "none",
            scrollTrigger: {
                trigger: stripe.closest('.hero, footer'),
                start: "top bottom",
                end: "bottom top",
                scrub: 2
            }
        });
    });
}

// Initialize floating shapes on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initFloatingShapes, 100);
    initRandomThunder();
});

// Random Thunder Lightning Effect
function initRandomThunder() {
    const containers = document.querySelectorAll('.lightning-container');
    if (!containers.length) return;
    
    const colors = ['', 'cyan', 'purple'];
    
    // Create SVG for each container
    containers.forEach(container => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('lightning-svg');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.overflow = 'visible';
        container.appendChild(svg);
        
        // Generate jagged thunder path
        function generateThunderPath(startX, startY, length, angle) {
            let path = `M ${startX} ${startY}`;
            let x = startX;
            let y = startY;
            const segments = 5 + Math.floor(Math.random() * 5);
            const segmentLength = length / segments;
            
            for (let i = 0; i < segments; i++) {
                // Add randomness to angle for jagged effect
                const jitter = (Math.random() - 0.5) * 1.2;
                const currentAngle = angle + jitter;
                
                x += Math.cos(currentAngle) * segmentLength;
                y += Math.sin(currentAngle) * segmentLength;
                
                // Add slight horizontal jitter
                x += (Math.random() - 0.5) * 25;
                
                path += ` L ${x} ${y}`;
            }
            
            return { path, endX: x, endY: y };
        }
        
        // Create branch paths
        function generateBranch(startX, startY, length, angle) {
            const branchLength = length * (0.3 + Math.random() * 0.4);
            return generateThunderPath(startX, startY, branchLength, angle).path;
        }
        
        // Create lightning bolt at random position
        function createRandomThunderBolt() {
            // Ensure SVG is still attached
            if (!svg.parentNode) return;

            const rect = container.getBoundingClientRect();
            const containerWidth = rect.width || window.innerWidth;
            const containerHeight = rect.height || 500;
            
            // Random start position (across full width, from top area)
            const startX = Math.random() * containerWidth;
            const startY = Math.random() * containerHeight * 0.3;
            
            // Main bolt going downward with slight angle
            const mainAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
            const mainLength = 120 + Math.random() * 200;
            const mainBolt = generateThunderPath(startX, startY, mainLength, mainAngle);
            
            // Create main path element
            const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            mainPath.classList.add('lightning-path');
            const colorClass = colors[Math.floor(Math.random() * colors.length)];
            if (colorClass) mainPath.classList.add(colorClass);
            mainPath.setAttribute('d', mainBolt.path);
            svg.appendChild(mainPath);
            
            // Create branches
            const branches = [];
            const numBranches = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numBranches; i++) {
                const branchStartRatio = 0.2 + Math.random() * 0.6;
                const branchX = startX + (mainBolt.endX - startX) * branchStartRatio;
                const branchY = startY + (mainBolt.endY - startY) * branchStartRatio;
                const branchAngle = mainAngle + (Math.random() - 0.5) * 1.5;
                
                const branchPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                branchPath.classList.add('lightning-path', 'branch');
                if (colorClass) branchPath.classList.add(colorClass);
                branchPath.setAttribute('d', generateBranch(branchX, branchY, mainLength, branchAngle));
                svg.appendChild(branchPath);
                branches.push(branchPath);
            }
            
            // Animate with GSAP
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline({
                    onComplete: () => {
                        if (mainPath.parentNode) mainPath.remove();
                        branches.forEach(b => { if (b.parentNode) b.remove(); });
                    }
                });
                
                // Flash in
                tl.to(mainPath, { opacity: 1, duration: 0.03 });
                tl.to(branches, { opacity: 0.7, duration: 0.03 }, '<');
                
                // Flicker
                tl.to(mainPath, { opacity: 0.3, duration: 0.05 });
                tl.to(branches, { opacity: 0.2, duration: 0.05 }, '<');
                tl.to(mainPath, { opacity: 1, duration: 0.03 });
                tl.to(branches, { opacity: 0.6, duration: 0.03 }, '<');
                
                // Fade out
                tl.to(mainPath, { opacity: 0, duration: 0.15 });
                tl.to(branches, { opacity: 0, duration: 0.12 }, '<');
            } else {
                mainPath.style.opacity = 1;
                branches.forEach(b => b.style.opacity = 0.6);
                setTimeout(() => {
                    if (mainPath.parentNode) mainPath.remove();
                    branches.forEach(b => { if (b.parentNode) b.remove(); });
                }, 200);
            }
        }
        
        // Visibility-based thunder spawning for CPU optimization
        let isVisible = false;
        let thunderTimeout = null;
        
        // Intersection Observer to pause when not visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible && !thunderTimeout) {
                    scheduleThunder();
                } else if (!isVisible && thunderTimeout) {
                    clearTimeout(thunderTimeout);
                    thunderTimeout = null;
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(container);
        
        function scheduleThunder() {
            if (!isVisible || !document.body.contains(container)) {
                thunderTimeout = null;
                return;
            }
            
            // Longer intervals: 3-6 seconds for less CPU usage
            const nextInterval = 3000 + Math.random() * 3000;
            
            thunderTimeout = setTimeout(() => {
                if (isVisible && document.body.contains(container)) {
                    requestAnimationFrame(() => createRandomThunderBolt());
                }
                scheduleThunder();
            }, nextInterval);
        }
        
        // Start if initially visible
        const rect = container.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            isVisible = true;
            scheduleThunder();
        }
    });
}
// Footer Search Form Functionality
document.addEventListener('DOMContentLoaded', () => {
    const footerSearchForm = document.getElementById('footer-search-form');
    const footerSearchInput = document.getElementById('footer-search');
    
    if (footerSearchForm && footerSearchInput) {
        footerSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchQuery = footerSearchInput.value.trim();
            if (searchQuery) {
                // Navigate to portfolio page with search query
                window.location.href = `portfolio.html?search=${encodeURIComponent(searchQuery)}`;
            }
        });
    }
    
    // Check if on portfolio page and has search query
    if (window.location.pathname.includes('portfolio.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        
        if (searchQuery) {
            // Wait for portfolio to load then filter
            setTimeout(() => {
                const projectCards = document.querySelectorAll('.project-card');
                const searchLower = searchQuery.toLowerCase();
                
                projectCards.forEach(card => {
                    const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                    const description = card.querySelector('p')?.textContent.toLowerCase() || '';
                    const category = card.dataset.category?.toLowerCase() || '';
                    
                    if (title.includes(searchLower) || description.includes(searchLower) || category.includes(searchLower)) {
                        card.style.display = '';
                        card.style.animation = 'fadeInUp 0.5s ease forwards';
                    } else {
                        card.style.display = 'none';
                    }
                });
                
                // Fill in the footer search with the query
                if (footerSearchInput) {
                    footerSearchInput.value = searchQuery;
                }
            }, 500);
        }
    }
});

// Footer Animations
document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const footer = document.querySelector('footer');
    if (!footer) return;

    // Select elements to animate
    const footerLogo = footer.querySelector('.footer-logo');
    const footerHeadings = footer.querySelectorAll('.footer-section h3:not(.footer-logo)');
    const footerTexts = footer.querySelectorAll('.footer-section p');
    const searchForm = footer.querySelector('.footer-search-form');
    const socialLinks = footer.querySelectorAll('.social-links a');
    const footerBottom = footer.querySelector('.footer-bottom');
    const footerDivider = footer.querySelector('.footer-divider');

    // Create a timeline
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: footer,
            start: "top 85%", // Trigger when top of footer hits 85% of viewport
            toggleActions: "play none none none" // Play once, do not reset
        }
    });

    // Add animations to timeline
    if (footerLogo) {
        tl.from(footerLogo, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(1.7)"
        });
    }

    if (footerHeadings.length > 0) {
        tl.from(footerHeadings, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        }, "-=0.6");
    }

    if (footerTexts.length > 0) {
        tl.from(footerTexts, {
            y: 20,
            opacity: 0,
            duration: 0.8,
            stagger: 0.05,
            ease: "power3.out"
        }, "-=0.6");
    }

    if (searchForm) {
        tl.from(searchForm, {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.6");
    }

    if (socialLinks.length > 0) {
        tl.from(socialLinks, {
            y: 20,
            opacity: 0,
            scale: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: "back.out(2.5)",
            clearProps: "all" // Important: clear props to allow CSS hover effects to work
        }, "-=0.2");
    }
    
    if (footerDivider) {
        tl.from(footerDivider, {
            scaleX: 0,
            opacity: 0,
            duration: 1.5,
            ease: "expo.out"
        }, "-=0.4");
    }

    if (footerBottom) {
        tl.from(footerBottom.children, {
            y: 20,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "all"
        }, "-=0.6");
    }
});