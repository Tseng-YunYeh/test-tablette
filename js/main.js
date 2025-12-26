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
    const savedTheme = getCookie('theme');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark' && icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
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

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const keys = key.split('.');
            let value = translations;
            keys.forEach(k => {
                if (value) value = value[k];
            });
            
            if (value) {
                element.textContent = value;
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
            const lang = e.target.getAttribute('data-lang');
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
}

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
