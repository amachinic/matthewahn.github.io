// Global Navigation Component for Case Studies
// Provides section-based pagination with the same functionality as home page navigation

class GlobalNavigationComponent {
    constructor(sections = []) {
        this.sections = sections; // Array of {id: 'section-id', label: 'Section Name'}
        this.isTogglingTheme = false;
        this.isManualNavigation = false;
        this.init();
    }

    // Generate the complete HTML structure
    getHTML() {
        const navButtons = this.sections.map(section => 
            `<a href="#${section.id}" class="nav-button">${section.label}</a>`
        ).join('');

        return `
            <div id="nav-container">
                <nav id="nav-bar">
                    <div class="blur-bg"></div>
                    <div id="nav-slider"></div>
                    ${navButtons}
                </nav>
            </div>
        `;
    }

    // Get the complete CSS for the navigation
    getCSS() {
        return `
            /* Global Navigation Styles */
            #nav-container {
                position: fixed;
                bottom: 30px;
                left: 50%;
                top: auto;
                transform: translateX(-50%);
                z-index: 1001;
                transition: background-color 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease;
            }

            #nav-bar {
                display: flex;
                gap: 10px;
                border-radius: 12px;
                padding: 6px 10px;
                position: relative;
            }

            .nav-button {
                background: none;
                border: none;
                color: var(--text-color);
                font-family: "Akz", sans-serif;
                font-size: 12px;
                font-weight: 400;
                padding: 8px 14px;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.3s ease, color 0.3s ease;
                position: relative;
                z-index: 2;
                text-decoration: none;
                letter-spacing: 0.02em;
            }

            /* Navigation slider indicator */
            #nav-slider {
                position: absolute;
                top: 6px;
                bottom: 6px;
                background-color: var(--nav-hover-color);
                border-radius: 8px;
                transition: left 0.3s ease, width 0.3s ease;
                z-index: 1;
                pointer-events: none;
            }

            /* Updated styles for the blur effect with drop shadow */
            .blur-bg {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgb(255 255 255 / 60%);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 12px;
                z-index: 1;
                border: 1px solid var(--nav-border-color);
                transition: box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
            }

            /* Navigation bar specific border for light mode */
            #nav-container .blur-bg {
                border: 1px solid var(--light-nav-border-color);
            }

            /* Dark mode navigation bar background */
            [data-theme="dark"] #nav-container .blur-bg {
                background-color: rgb(255 255 255 / 10%);
            }

            /* Responsive adjustments for mobile */
            @media (max-width: 600px) {
                #nav-container {
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: auto;
                    padding: 0;
                }
                
                #nav-bar {
                    gap: 4px;
                    padding: 6px;
                    width: auto;
                    display: flex;
                    justify-content: center;
                }
                
                .nav-button {
                    font-size: 11px;
                    padding: 7px 9px;
                    white-space: nowrap;
                }
                
                .blur-bg {
                    border-radius: 8px;
                }
            }
        `;
    }

    // Initialize all functionality
    init() {
        this.initNavigation();
    }

    // Navigation functionality
    initNavigation() {
        // Add event listeners after DOM is ready
        setTimeout(() => {
            this.addNavigationListeners();
            this.updateActiveNavigation();
            // Ensure proper sizing after fonts/layout settle
            const rerun = () => this.updateActiveNavigation();
            try { if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => setTimeout(rerun, 0)); } } catch(_) {}
            window.addEventListener('load', () => setTimeout(rerun, 0), { once: true });
            setTimeout(rerun, 150);
            setTimeout(rerun, 350);
        }, 100);
    }

    // Navigation slider positioning
    updateNavSlider(activeButton) {
        // Don't update slider during theme toggle
        if (this.isTogglingTheme) return;
        
        const slider = document.getElementById('nav-slider');
        
        if (activeButton) {
            // Hug the active button's width precisely
            const left = activeButton.offsetLeft;
            const width = activeButton.offsetWidth;
            if (!width || width < 4) {
                // Defer until fonts/layout have settled
                slider.style.opacity = '0';
                try { if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => this.updateNavSlider(activeButton)); } } catch(_) {}
                requestAnimationFrame(() => this.updateNavSlider(activeButton));
                return;
            }
            slider.style.left = `${left}px`;
            slider.style.width = `${width}px`;
            slider.style.opacity = '1';
        } else {
            slider.style.opacity = '0';
        }
    }

    // Navigation active state tracking
    updateActiveNavigation() {
        // Don't update navigation during theme toggle or manual navigation
        if (this.isTogglingTheme || this.isManualNavigation) return;

        let sectionIds = (this.sections || []).map(s => s.id).filter(Boolean);
        if (!sectionIds.length) {
            sectionIds = Array.from(document.querySelectorAll('.section'))
                .map(el => el.getAttribute('id'))
                .filter(Boolean);
        }
        const navBarEl = document.getElementById('nav-bar');
        const navButtons = navBarEl ? navBarEl.querySelectorAll('.nav-button') : document.querySelectorAll('.nav-button');
        const headerEl = document.getElementById('clock-container');
        const headerOffset = headerEl ? Math.max(0, Math.min(window.innerHeight, headerEl.getBoundingClientRect().height)) : 120;
        const currentScrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        let currentSection = (sectionIds[0]) || 'home'; // Default to first detected section
        let activeButton = null;

        // Check if we're near the bottom of the page for better last section detection
        const isNearBottom = (currentScrollY + windowHeight) >= (documentHeight - 50);

        // Pick the section with the largest visible portion within the viewport below header
        let bestId = currentSection;
        let bestVisible = -1;
        sectionIds.forEach((id, index) => {
            const section = document.getElementById(id);
            if (!section) return;
            const rect = section.getBoundingClientRect();
            const vpTop = headerOffset;
            const vpBottom = windowHeight;
            const topClamped = Math.max(rect.top, vpTop);
            const bottomClamped = Math.min(rect.bottom, vpBottom);
            const visible = Math.max(0, bottomClamped - topClamped);
            const sectionId = id;
            const isLastSection = index === sectionIds.length - 1;
            // Early contact/collaborate detection: if top enters within 25% below header, favor it
            const entersEarly = (sectionId === 'contact') && (rect.top <= (headerOffset + windowHeight * 0.25));
            if (isLastSection && isNearBottom) {
                bestId = sectionId;
                bestVisible = Number.MAX_SAFE_INTEGER;
            } else if (entersEarly) {
                bestId = sectionId;
                bestVisible = Number.MAX_SAFE_INTEGER - 1;
            } else if (visible > bestVisible) {
                bestVisible = visible;
                bestId = sectionId;
            }
        });
        currentSection = bestId;

        // Update navigation buttons and find active button
        navButtons.forEach(button => {
            const href = button.getAttribute('href');
            if (href === `#${currentSection}`) {
                button.classList.add('active');
                activeButton = button;
            } else {
                button.classList.remove('active');
            }
        });

        // Update slider position
        this.updateNavSlider(activeButton);
    }

    // Advanced GSAP smooth scrolling for navigation
    smoothScrollToSection(targetId) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            const headerOffset = 120; // Offset for clock container
            
            // Kill any existing scroll animations for smooth interruption
            gsap.killTweensOf(window);
            
            gsap.to(window, {
                duration: 1.6,
                scrollTo: {
                    y: targetSection,
                    offsetY: headerOffset,
                    autoKill: false
                },
                ease: "power4.inOut",
                onStart: () => {
                    // Prevent scroll hijacking during animation
                    document.body.style.pointerEvents = 'none';
                },
                onComplete: () => {
                    // Re-enable interactions
                    document.body.style.pointerEvents = 'auto';
                    
                    // Force navigation update after scroll completes to ensure correct state
                    setTimeout(() => {
                        if (!this.isManualNavigation) {
                            this.updateActiveNavigation();
                        }
                    }, 50);
                }
            });
        }
    }

    // Add click handlers to navigation buttons
    addNavigationListeners() {
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('href');
                
                // Prevent scroll-based navigation updates during manual navigation
                this.isManualNavigation = true;
                
                // Immediately update slider to clicked button
                document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.updateNavSlider(button);
                
                // Scroll to target section
                this.smoothScrollToSection(targetId);
                
                // Extended timeout to prevent bouncing - wait for animation to complete fully
                setTimeout(() => {
                    this.isManualNavigation = false;
                }, 1600); // Match GSAP animation duration (1.6s) + buffer
            });
        });

        // Add event listener for scroll
        window.addEventListener('scroll', () => this.updateActiveNavigation());
        
        // Add resize event listener for responsive navigation slider
        window.addEventListener('resize', () => {
            const activeButton = document.querySelector('.nav-button.active');
            if (activeButton) {
                this.updateNavSlider(activeButton);
            }
        });
    }

    // Method to be called when theme is toggling
    setThemeToggling(isToggling) {
        this.isTogglingTheme = isToggling;
    }

    // Render the component into a container
    render(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.getHTML();
            this.init();
        }
    }

    // Update sections dynamically
    updateSections(newSections) {
        this.sections = newSections;
        const container = document.getElementById('global-navigation-container');
        if (container) {
            container.innerHTML = this.getHTML();
            this.init();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalNavigationComponent;
}

// Make available globally
window.GlobalNavigationComponent = GlobalNavigationComponent; 
