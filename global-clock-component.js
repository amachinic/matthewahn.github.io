// Global Clock Component
// Handles only clock and location display functionality
// Separated from home button and dark mode toggle for modularity

class GlobalClockComponent {
    constructor(options = {}) {
        this.backLinkText = options.backLinkText !== undefined ? options.backLinkText : '← Back to Portfolio';
        this.backLinkUrl = options.backLinkUrl || 'index.html';
        this.showNameDisplay = options.showNameDisplay || false;
        this.hideLocationClock = options.hideLocationClock || false;
        this.caseStudyTitle = options.caseStudyTitle || '';
        this.init();
    }

    // Generate the complete HTML structure
    getHTML() {
        return `
            <div id="clock-container"${this.hideLocationClock ? ' class="case-study"' : ''}>
                <div>
                    ${this.backLinkText.includes('←') ?
                        `<a href="${this.backLinkUrl}" class="nav-back gallery-arrow-style" onclick="return false;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>` : 
                        ''
                    }
                    ${!this.hideLocationClock ? `
                    <span id="location">
                        <svg id="geo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"/>
                        </svg>
                        <span id="location-text">Toronto,<span style="margin-left: 0.2em;">Canada</span></span>
                        <span id="location-tooltip">I'm currently based here</span>
                    </span>
                    <span id="clock">00:00:00</span>
                    ` : ''}
                </div>
                
                ${this.showNameDisplay || this.hideLocationClock ? 
                    `<div id="name-display">${this.caseStudyTitle || 'Matthew Ahn'}</div>` : ''}
                
                <!-- Controls Container -->
                <div id="controls-container">
                    <!-- Home Button -->
                    <div id="home-button-container">
                        <button class="nav-button" id="home-button">
                            <span class="home-label">Home</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Dark mode fade overlay -->
            <div class="fade-overlay" id="fade-overlay"></div>
        `;
    }

    // Get the complete CSS for the clock container
    getCSS() {
        return `
            /* Global Clock Component Styles */
            #clock-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 118px;
                background-color: var(--clock-bg-color);
                padding: 40px 40px;
                font-family: 'Input', monospace;
                font-size: 14px;
                display: flex;
                align-items: center;
                z-index: 1000;
                box-sizing: border-box;
                transition: background-color 0.3s ease, padding 0.3s ease, height 0.3s ease;
            }

            #clock-container.scrolled {
                height: 58px;
                padding: 10px 20px;
                border-bottom: 1px solid var(--toggle-border-color);
            }
            
            #clock-container > div:first-child {
                display: flex;
                align-items: baseline;
                gap: 20px;
                flex-wrap: nowrap;
                white-space: nowrap;
            }

            #location, #clock {
                display: flex;
                align-items: baseline;
            }

            #location {
                position: relative;
            }

            #geo-icon {
                width: 10px;
                height: 10px;
                margin-right: 6px;
                fill: var(--secondary-text-color);
                transform: translateY(1px);
            }

            #location-text, #clock {
                line-height: 1;
            }

            #clock .clock-digits {
                font-size: 13px;
            }

            #location-tooltip {
                visibility: hidden;
                background-color: var(--tooltip-bg-color);
                color: var(--tooltip-text-color);
                text-align: left;
                border-radius: 6px;
                padding: 6px 12px;
                position: absolute;
                z-index: 1;
                top: calc(100% + 5px);
                left: 0;
                opacity: 0;
                transition: opacity 0.3s, background-color 0.3s ease, color 0.3s ease;
                font-size: 12px;
                white-space: nowrap;
                box-shadow: 0 2px 5px var(--shadow-color);
                font-family: 'Unica77LL', Arial, sans-serif;
                letter-spacing: 0.02em;
                line-height: 1.2;
            }

            #location:hover #location-tooltip {
                visibility: visible;
                opacity: 1;
            }

            /* Navigation back link - Gallery arrow style */
            .nav-back.gallery-arrow-style {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 38px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.8);
                border: 1px solid var(--toggle-border-color);
                color: var(--text-color);
                text-decoration: none;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                overflow: hidden;
            }

            .nav-back.gallery-arrow-style::before {
                content: '';
                position: absolute;
                width: 0;
                height: 1px;
                background-color: currentColor;
                top: calc(50% - 0.5px);
                left: 50%;
                opacity: 0;
                transition: all 0.3s ease;
                border-radius: 0.5px;
                transform-origin: left center;
                z-index: 1;
            }

            .nav-back.gallery-arrow-style:hover {
                background-color: var(--nav-hover-color);
                border-color: var(--text-color);
            }

            .nav-back.gallery-arrow-style:hover::before {
                width: 24px;
                opacity: 1;
                left: 28%;
            }

            .nav-back.gallery-arrow-style:hover svg {
                transform: translateX(-8px);
            }

            .nav-back.gallery-arrow-style svg {
                position: relative;
                z-index: 2;
                transition: transform 0.3s ease;
                will-change: transform;
                display: block;
            }

            /* Name display for home page and case study titles */
            #name-display {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Input', monospace;
                font-size: 14px;
                color: var(--text-color);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                white-space: nowrap;
                pointer-events: none;
                z-index: 5;
                cursor: pointer;
            }

            #name-display.visible {
                opacity: 1;
                visibility: visible;
            }

            /* Always show name on case study pages */
            #clock-container.case-study #name-display {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }

            [data-theme="dark"] .nav-back.gallery-arrow-style {
                background: transparent;
                border-color: var(--toggle-border-color);
            }

            [data-theme="dark"] .nav-back.gallery-arrow-style:hover {
                background-color: var(--nav-hover-color);
                border-color: var(--text-color);
            }

            /* Controls Container */
            #controls-container {
                position: static;
                margin-left: auto;
                display: flex;
                gap: 12px !important;
                align-items: center;
                justify-content: flex-end;
                z-index: 10;
                width: auto !important;
                height: 38px !important;
                box-sizing: border-box !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
            }

            /* Home Button */
            #home-button-container {
                position: relative;
                border-radius: 8px;
                white-space: nowrap;
                width: 70px !important;
                height: 38px !important;
                box-sizing: border-box !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
            }

            #home-button-container .blur-bg {
                background-color: rgba(255, 255, 255, 0.8);
                border: 1px solid var(--toggle-border-color);
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                box-shadow: none;
                border-radius: 8px;
            }

            [data-theme="dark"] #home-button-container .blur-bg {
                background-color: transparent;
            }

            #home-button {
                padding: 6px 16px !important;
                font-family: 'Input', monospace !important;
                font-size: 14px !important;
                position: relative;
                height: 38px !important;
                width: 70px !important;
                display: flex;
                justify-content: center;
                align-items: center;
                background: none;
                cursor: pointer;
                border-radius: 6px;
                transition: background-color 0.3s ease, transform 0.3s ease;
                border: 1px solid var(--toggle-border-color) !important;
                box-sizing: border-box !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
            }

            #home-button:hover {
                background-color: var(--nav-hover-color);
            }

            .home-label {
                color: var(--text-color);
                transition: color 0.3s ease;
                position: relative;
                z-index: 2;
                white-space: nowrap !important;
                font-weight: 500 !important;
                font-family: 'Input', monospace !important;
                font-size: 14px !important;
                letter-spacing: 0 !important;
                text-rendering: optimizeLegibility !important;
            }

            #home-button:hover .home-label {
                color: var(--text-color);
            }


            /* Dark mode toggle removed */

            /* Fix light icon visibility in dark mode */
            [data-theme="dark"] #light-icon {
                color: rgb(255 255 255 / 48%);
            }

            /* Fade overlay for smooth transitions */
            .fade-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #0f0f0f;
                opacity: 0;
                z-index: 9999;
                pointer-events: none;
                transition: opacity 0.8s ease-in-out;
            }

            .fade-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }

            /* Navigation state styling */
            .navigating {
                overflow: hidden;
            }

            .navigating #home-button {
                pointer-events: none;
                opacity: 0.7;
            }

            /* Light mode fade-out effect */
            .fade-out {
                opacity: 0;
                transition: opacity 0.8s ease-in-out;
            }



            /* Mobile responsive */
            @media (max-width: 768px) {
                #clock-container {
                    height: 100px;
                    padding: 40px 20px;
                }

                #clock-container.scrolled {
                    height: 46px;
                    padding: 10px 20px;
                    border-bottom: 1px solid var(--toggle-border-color);
                }

                .nav-back.gallery-arrow-style {
                    width: 40px;
                    height: 26px;
                }

                .nav-back.gallery-arrow-style:hover::before {
                    width: 20px;
                    left: 30%;
                }

                .nav-back.gallery-arrow-style:hover svg {
                    transform: translateX(-6px);
                }

                .nav-back.gallery-arrow-style svg {
                    width: 16px;
                    height: 16px;
                }

                #controls-container {
                    gap: 8px !important;
                    width: auto !important;
                    height: 26px !important;
                    flex-shrink: 0 !important;
                    flex-grow: 0 !important;
                }

                #home-button-container {
                    width: 56px !important;
                    height: 26px !important;
                    flex-shrink: 0 !important;
                    flex-grow: 0 !important;
                }

                #home-button {
                    padding: 4px 12px !important;
                    font-size: 12px !important;
                    height: 26px !important;
                    width: 56px !important;
                    flex-shrink: 0 !important;
                    flex-grow: 0 !important;
                }

                .home-label {
                    font-size: 12px !important;
                    font-family: 'Input', monospace !important;
                    font-weight: 500 !important;
                    letter-spacing: 0 !important;
                    text-rendering: optimizeLegibility !important;
                }

                /* Dark mode toggle removed */

                #name-display {
                    display: none;
                }
                
                /* Mobile adjustments for home page */
                body.home-page #controls-container {
                    width: 56px !important;
                }
            }
            
            /* Hide home button when on home page */
            body.home-page #home-button-container {
                display: none;
            }
            
            /* Adjust controls container when home button is hidden */
            body.home-page #controls-container {
                width: 76px !important;
            }
            
            /* Dark mode toggle removed */
        `;
    }

    // Initialize all functionality
    init() {
        this.checkHomePage();
        this.initClock();
        /* Dark mode removed */
        this.initHomeButton();
        this.initBackButton();
        this.initScrollBehavior();
    }
    
    // Check if we're on home page and add class to body
    checkHomePage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop();
        
        if (currentPage === 'index.html' || currentPage === '' || currentPath === '/') {
            document.body.classList.add('home-page');
        }
    }

    // Clock functionality
    initClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const clockElement = document.getElementById('clock');
        if (clockElement) {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            
            clockElement.innerHTML = `<span class="clock-digits">${hours}:${minutes}:${seconds}</span><span style="margin-left: 0.4em;">${ampm}</span>`;
        }
    }

    /* Dark mode removed: theme initialization and toggling deleted */

    // Home button functionality
    initHomeButton() {
        const homeButton = document.getElementById('home-button');
        if (homeButton) {
            homeButton.addEventListener('click', () => this.navigateHome());
        }
    }

    // Back button functionality
    initBackButton() {
        const backButton = document.querySelector('.nav-back');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateBack();
            });
        }
    }

    navigateHome() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop();
        
        // Check if we're already on the home page
        if (currentPage === 'index.html' || currentPage === '' || currentPath === '/') {
            return; // Already on home page, do nothing
        }
        
        // Create elegant transition like the explore buttons
        // Prevent multiple clicks
        if (document.body.classList.contains('navigating')) return;
        document.body.classList.add('navigating');
        // Use light fade out
        document.body.classList.add('fade-out');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
    }

    navigateBack() {
        // Create fade overlay if it doesn't exist
        this.createFadeOverlay();
        
        const overlay = document.querySelector('.fade-overlay');
        const body = document.body;
        
        // Prevent multiple clicks
        if (body.classList.contains('navigating')) return;
        body.classList.add('navigating');
        
        // Determine theme for overlay color
        // Use light mode fade-out only
        body.classList.add('fade-out');
        
        // Navigate after transition
        setTimeout(() => {
            window.location.href = this.backLinkUrl;
        }, 800);
    }

    createFadeOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'fade-overlay';
        overlay.className = 'fade-overlay';
        document.body.appendChild(overlay);
        return overlay;
    }

    // Scroll behavior for container
    initScrollBehavior() {
        window.addEventListener('scroll', () => this.handleScroll());
    }

    handleScroll() {
        const clockContainer = document.getElementById('clock-container');
        const nameDisplay = document.getElementById('name-display');
        const scrollPosition = window.scrollY;

        if (clockContainer) {
            if (scrollPosition > 50) {
                clockContainer.classList.add('scrolled');
                if (nameDisplay) nameDisplay.classList.add('visible');
            } else {
                clockContainer.classList.remove('scrolled');
                if (nameDisplay) nameDisplay.classList.remove('visible');
            }
        }
    }

    // Render the component into a container
    render(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.getHTML();
            this.init();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalClockComponent;
}

// Make available globally
window.GlobalClockComponent = GlobalClockComponent; 
