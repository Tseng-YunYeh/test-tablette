document.addEventListener('DOMContentLoaded', () => {
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
    }

    // Portfolio Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 200);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 500);
                }
            });
        });
    });

    // Scroll Animation (Intersection Observer)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.project-card, .about-grid, .timeline-item, .contact-container');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Add 'appear' class styles dynamically or in CSS
    // Here we handle it via inline styles for simplicity in the observer callback, 
    // but let's refine the observer to just add a class.
    
    // Re-defining observer to be cleaner
    const appearObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                appearObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => {
        appearObserver.observe(el);
    });

    // GSAP Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Horizontal Scroll
        const horizontalSection = document.querySelector('.horizontal-scroll-section');
        const horizontalContainer = document.querySelector('.horizontal-scroll-container');

        if (horizontalSection && horizontalContainer) {
            const panels = gsap.utils.toArray('.horizontal-panel');
            
            gsap.to(panels, {
                xPercent: -100 * (panels.length - 1),
                ease: "none",
                scrollTrigger: {
                    trigger: horizontalSection,
                    pin: true,
                    scrub: 1,
                    snap: 1 / (panels.length - 1),
                    end: () => "+=" + horizontalContainer.offsetWidth
                }
            });
        }

        // Hero Animations
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            gsap.from(".hero-content h1", {
                duration: 1,
                y: 100,
                opacity: 0,
                ease: "power4.out",
                delay: 0.5
            });
            
            gsap.from(".hero-content p", {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: "power3.out",
                delay: 0.8
            });

            gsap.from(".cta-group", {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: "power3.out",
                delay: 1
            });

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
        
        // Staggered List Animation for About Page
        const skillTags = document.querySelectorAll('.skill-tags span');
        if(skillTags.length > 0) {
             gsap.from(skillTags, {
                scrollTrigger: {
                    trigger: ".skill-tags",
                    start: "top 80%",
                },
                y: 50,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "back.out(1.7)"
            });
        }
    }
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
    
    .toggle .line:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    .toggle .line:nth-child(2) {
        opacity: 0;
    }
    .toggle .line:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
`;
document.head.appendChild(styleSheet);
