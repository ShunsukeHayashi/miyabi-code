/**
 * Miyabi Presentation - Interactive Script
 * AI駆動開発カンファレンス 2025秋
 */

// Initialize Reveal.js (Steve Jobs Approved - Cinematic Transitions)
Reveal.initialize({
    // Presentation configuration
    width: 1920,
    height: 1080,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 2.0,

    // Navigation
    controls: true,
    controlsLayout: 'bottom-right',
    controlsBackArrows: 'faded',
    progress: true,
    slideNumber: 'c/t',
    showSlideNumber: 'all',
    hash: true,
    history: true,
    keyboard: true,
    overview: true,
    center: true,
    touch: true,
    loop: false,
    rtl: false,
    shuffle: false,
    fragments: true,
    fragmentInURL: true,
    embedded: false,
    help: true,
    showNotes: false,
    autoPlayMedia: null,
    preloadIframes: null,
    autoAnimate: true,
    autoAnimateMatcher: null,
    autoAnimateEasing: 'cubic-bezier(0.645, 0.045, 0.355, 1)', // Smooth easing curve
    autoAnimateDuration: 1.5, // Longer for cinematic feel
    autoAnimateUnmatched: true,

    // Transition (Steve Jobs: "Like turning a page in a beautiful book")
    transition: 'slide',
    transitionSpeed: 'slow', // More deliberate, impactful
    backgroundTransition: 'fade',

    // Parallax
    parallaxBackgroundImage: '',
    parallaxBackgroundSize: '',
    parallaxBackgroundRepeat: '',
    parallaxBackgroundPosition: '',
    parallaxBackgroundHorizontal: null,
    parallaxBackgroundVertical: null,

    // Display presentation control arrows
    display: 'block',

    // Help overlay keyboard shortcuts
    keyboardCondition: null,

    // Plugins
    plugins: []
});

// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 1000,
    easing: 'ease-in-out',
    once: false,
    mirror: true
});

// Custom keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Press 'b' to toggle black screen
    if (event.key === 'b' || event.key === 'B') {
        const revealElement = document.querySelector('.reveal');
        if (revealElement.style.visibility === 'hidden') {
            revealElement.style.visibility = 'visible';
        } else {
            revealElement.style.visibility = 'hidden';
        }
    }

    // Press 'w' to toggle white screen
    if (event.key === 'w' || event.key === 'W') {
        const revealElement = document.querySelector('.reveal');
        if (revealElement.style.backgroundColor === 'white') {
            revealElement.style.backgroundColor = '';
        } else {
            revealElement.style.backgroundColor = 'white';
        }
    }
});

// Slide change event handler
Reveal.on('slidechanged', (event) => {
    // Reinitialize AOS on slide change
    AOS.refresh();

    // Custom logic for specific slides
    const currentSlide = event.currentSlide;
    const slideIndex = event.indexh;

    // Example: Log current slide number
    console.log('Current slide:', slideIndex);

    // Add custom animations for demo slides (slides 31-35)
    if (slideIndex >= 31 && slideIndex <= 35) {
        // Add demo-specific animations
        const demoElements = currentSlide.querySelectorAll('.demo-timeline, .demo-results');
        demoElements.forEach(element => {
            element.classList.add('demo-active');
        });
    }
});

// Add live clock for demo slides
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Update clock elements if they exist
    const clockElements = document.querySelectorAll('.live-clock');
    clockElements.forEach(element => {
        element.textContent = timeString;
    });
}

// Update clock every second
setInterval(updateClock, 1000);

// Progress bar animation
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fillProgress 2s ease-out forwards';
            }
        });
    }, { threshold: 0.5 });

    progressBars.forEach(bar => observer.observe(bar));
}

// Initialize progress bar animations
animateProgressBars();

// Confetti effect for demo completion (Slide 34)
function createConfetti() {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';

        document.body.appendChild(confetti);

        // Animate confetti falling
        const duration = Math.random() * 3 + 2;
        const xMovement = (Math.random() - 0.5) * 200;

        confetti.animate([
            { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);
    }
}

// Trigger confetti on demo completion slide
Reveal.on('slidechanged', (event) => {
    if (event.indexh === 33) { // Demo results slide
        setTimeout(createConfetti, 500);
    }
});

// Speaker notes window control
document.addEventListener('keydown', (event) => {
    // Press 's' to open speaker notes
    if (event.key === 's' || event.key === 'S') {
        Reveal.configure({ showNotes: true });
    }
});

// Fullscreen toggle
document.addEventListener('keydown', (event) => {
    // Press 'f' to toggle fullscreen
    if (event.key === 'f' || event.key === 'F') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
});

// Print-friendly mode
window.addEventListener('beforeprint', () => {
    const reveal = document.querySelector('.reveal');
    reveal.classList.add('print-pdf');
});

window.addEventListener('afterprint', () => {
    const reveal = document.querySelector('.reveal');
    reveal.classList.remove('print-pdf');
});

// Auto-advance slides (disabled by default, uncomment to enable)
// Reveal.configure({
//     autoSlide: 5000, // 5 seconds per slide
//     loop: false,
//     autoSlideStoppable: true
// });

// Console log for debugging
console.log('✅ Miyabi Presentation Initialized');
console.log('📊 Total Slides:', Reveal.getTotalSlides());
console.log('🎯 Navigation: Arrow keys, Space, or click controls');
console.log('🔑 Keyboard Shortcuts:');
console.log('   - B: Toggle black screen');
console.log('   - W: Toggle white screen');
console.log('   - F: Toggle fullscreen');
console.log('   - S: Show speaker notes');
console.log('   - O: Overview mode');
console.log('   - ESC: Exit overview mode');

// Custom data tracking (optional)
let slideViewCounts = {};

Reveal.on('slidechanged', (event) => {
    const slideId = `slide-${event.indexh}`;
    slideViewCounts[slideId] = (slideViewCounts[slideId] || 0) + 1;

    // Log slide view (for analytics)
    console.log(`📍 Slide ${event.indexh} viewed ${slideViewCounts[slideId]} time(s)`);
});

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
            console.log(`⚡ Page load time: ${entry.loadEventEnd - entry.fetchStart}ms`);
        }
    });
});

performanceObserver.observe({ entryTypes: ['navigation'] });

// Service Worker registration (for offline support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// Export presentation data
window.MiyabiPresentation = {
    getTotalSlides: () => Reveal.getTotalSlides(),
    getCurrentSlide: () => Reveal.getIndices(),
    navigateToSlide: (h, v) => Reveal.slide(h, v),
    toggleOverview: () => Reveal.toggleOverview(),
    getSlideViewCounts: () => slideViewCounts,
    createConfetti: createConfetti
};

// Easter egg: Type "miyabi" to trigger confetti
let easterEggBuffer = '';
document.addEventListener('keypress', (event) => {
    easterEggBuffer += event.key;
    if (easterEggBuffer.includes('miyabi')) {
        createConfetti();
        easterEggBuffer = '';
    }
    // Reset buffer after 5 seconds
    setTimeout(() => {
        easterEggBuffer = '';
    }, 5000);
});

// ===================================
// Theme Customization System
// Inspired by: presentation-ai (Gamma Alternative)
// ===================================

const AVAILABLE_THEMES = {
    'apple': {
        name: 'Apple Style',
        description: 'Minimal, clean, white-based (Steve Jobs approved)',
        css: 'styles-apple.css',
        revealTheme: 'white'
    },
    'classic': {
        name: 'Classic Business',
        description: 'Traditional, professional, conservative',
        css: 'styles-classic.css',
        revealTheme: 'simple'
    },
    'dark': {
        name: 'Dark Mode',
        description: 'Modern, high-contrast, eye-friendly',
        css: 'styles-dark.css',
        revealTheme: 'black'
    },
    'modern': {
        name: 'Modern Gradient',
        description: 'Vibrant, purple/pink gradients, glassmorphism',
        css: 'styles-v2.css',
        revealTheme: 'black'
    }
};

/**
 * Switch presentation theme
 * @param {string} themeName - Theme name from AVAILABLE_THEMES
 */
function switchTheme(themeName) {
    const theme = AVAILABLE_THEMES[themeName];

    if (!theme) {
        console.error(`❌ Theme "${themeName}" not found`);
        return;
    }

    // Update custom stylesheet
    const customStyleLink = document.querySelector('link[rel="stylesheet"][href*="styles-"]');
    if (customStyleLink) {
        customStyleLink.href = theme.css;
        console.log(`✅ Switched to ${theme.name} (${theme.css})`);
    }

    // Update Reveal.js theme
    const revealStyleLink = document.querySelector('link[rel="stylesheet"][href*="reveal.js/dist/theme/"]');
    if (revealStyleLink) {
        revealStyleLink.href = `https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/${theme.revealTheme}.min.css`;
    }

    // Save preference to localStorage
    localStorage.setItem('miyabi-theme', themeName);

    // Show notification
    showThemeNotification(theme);
}

/**
 * Show theme change notification
 */
function showThemeNotification(theme) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 16px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    notification.innerHTML = `
        <strong>🎨 Theme Changed</strong><br>
        ${theme.name}<br>
        <small style="opacity: 0.7;">${theme.description}</small>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * Load saved theme on startup
 */
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('miyabi-theme') || 'apple';

    // Only switch if not already using the saved theme
    const currentStylesheet = document.querySelector('link[rel="stylesheet"][href*="styles-"]');
    const currentThemeCss = currentStylesheet ? currentStylesheet.href.split('/').pop() : '';
    const savedThemeCss = AVAILABLE_THEMES[savedTheme].css;

    if (currentThemeCss !== savedThemeCss) {
        switchTheme(savedTheme);
    }

    console.log(`🎨 Current theme: ${savedTheme}`);
});

/**
 * Keyboard shortcuts for theme switching
 * T + 1: Apple Style
 * T + 2: Classic Business
 * T + 3: Dark Mode
 * T + 4: Modern Gradient
 */
let themeShortcutBuffer = '';
document.addEventListener('keydown', (event) => {
    if (event.key === 't' || event.key === 'T') {
        themeShortcutBuffer = 't';
        setTimeout(() => { themeShortcutBuffer = ''; }, 1000);
    } else if (themeShortcutBuffer === 't') {
        switch(event.key) {
            case '1':
                switchTheme('apple');
                break;
            case '2':
                switchTheme('classic');
                break;
            case '3':
                switchTheme('dark');
                break;
            case '4':
                switchTheme('modern');
                break;
        }
        themeShortcutBuffer = '';
    }
});

// Add theme switching to MiyabiPresentation API
window.MiyabiPresentation.switchTheme = switchTheme;
window.MiyabiPresentation.getAvailableThemes = () => AVAILABLE_THEMES;
window.MiyabiPresentation.getCurrentTheme = () => localStorage.getItem('miyabi-theme') || 'apple';

// Add animation keyframes for notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🎨 Theme Customization System Initialized');
console.log('📋 Available Themes:', Object.keys(AVAILABLE_THEMES));
console.log('⌨️  Keyboard Shortcuts:');
console.log('   - T+1: Apple Style');
console.log('   - T+2: Classic Business');
console.log('   - T+3: Dark Mode');
console.log('   - T+4: Modern Gradient');

// ===================================
// Slide Quality Evaluation System
// Inspired by: PPTAgent (EMNLP 2025) - PPTEval Framework
// Evaluates slides across 3 dimensions: Content, Design, Coherence
// ===================================

/**
 * Evaluate slide quality across 3 dimensions
 * @param {number} slideIndex - Slide index to evaluate
 * @returns {Object} Quality scores (content, design, coherence, overall)
 */
function evaluateSlideQuality(slideIndex) {
    const slide = Reveal.getSlide(slideIndex);

    if (!slide) {
        return { content: 0, design: 0, coherence: 0, overall: 0 };
    }

    // Content Score: Text quality, structure, readability
    const contentScore = evaluateContent(slide);

    // Design Score: Visual elements, balance, aesthetics
    const designScore = evaluateDesign(slide);

    // Coherence Score: Logical flow with adjacent slides
    const coherenceScore = evaluateCoherence(slideIndex);

    const overall = Math.round((contentScore + designScore + coherenceScore) / 3);

    return {
        content: contentScore,
        design: designScore,
        coherence: coherenceScore,
        overall: overall,
        grade: getQualityGrade(overall)
    };
}

/**
 * Evaluate content quality (0-100)
 * Criteria: Text length, heading structure, lists, readability
 */
function evaluateContent(slide) {
    let score = 0;

    // Text content analysis
    const textContent = slide.textContent.trim();
    const textLength = textContent.length;

    // Optimal text length: 50-500 characters
    if (textLength >= 50 && textLength <= 500) {
        score += 30; // Good length
    } else if (textLength > 500 && textLength <= 800) {
        score += 20; // Acceptable, slightly long
    } else if (textLength < 50 && textLength > 0) {
        score += 10; // Too short
    }

    // Heading structure
    const hasH1 = slide.querySelector('h1') !== null;
    const hasH2 = slide.querySelector('h2') !== null;
    const hasH3 = slide.querySelector('h3') !== null;

    if (hasH1 || hasH2) {
        score += 25; // Has clear heading
    } else if (hasH3) {
        score += 15; // Has subheading
    }

    // Lists and structure
    const hasUL = slide.querySelector('ul') !== null;
    const hasOL = slide.querySelector('ol') !== null;

    if (hasUL || hasOL) {
        score += 20; // Well-structured with lists
    }

    // Paragraph structure
    const paragraphs = slide.querySelectorAll('p');
    if (paragraphs.length >= 1 && paragraphs.length <= 3) {
        score += 15; // Good paragraph count
    } else if (paragraphs.length > 3) {
        score += 5; // Too many paragraphs
    }

    // Code snippets (bonus for technical slides)
    const hasCode = slide.querySelector('code, pre') !== null;
    if (hasCode) {
        score += 10; // Bonus for code examples
    }

    return Math.min(score, 100);
}

/**
 * Evaluate design quality (0-100)
 * Criteria: Visual elements, images, animations, balance
 */
function evaluateDesign(slide) {
    let score = 40; // Base score for existing slide

    // Visual elements
    const hasImage = slide.querySelector('img') !== null;
    const hasSVG = slide.querySelector('svg') !== null;

    if (hasImage || hasSVG) {
        score += 20; // Visual elements present
    }

    // Code blocks (design for technical content)
    const hasCodeBlock = slide.querySelector('pre') !== null;
    if (hasCodeBlock) {
        score += 10; // Well-formatted code
    }

    // Animations (AOS or data-auto-animate)
    const hasAnimation = slide.querySelector('[data-aos]') !== null;
    const hasAutoAnimate = slide.hasAttribute('data-auto-animate');

    if (hasAnimation || hasAutoAnimate) {
        score += 10; // Engaging animations
    }

    // Icons (FontAwesome)
    const hasIcons = slide.querySelector('.fa, .fas, .fab') !== null;
    if (hasIcons) {
        score += 10; // Visual icons
    }

    // Background styling
    const hasCustomBg = slide.hasAttribute('data-background-color') ||
                        slide.hasAttribute('data-background-image');
    if (hasCustomBg) {
        score += 10; // Custom background
    }

    // Color contrast (check for readable text)
    const textElements = slide.querySelectorAll('p, li, span');
    if (textElements.length > 0) {
        // Simple heuristic: if text exists, assume readable
        score += 10; // Readable text
    }

    return Math.min(score, 100);
}

/**
 * Evaluate coherence with adjacent slides (0-100)
 * Simplified version: checks for logical progression
 */
function evaluateCoherence(slideIndex) {
    // For now, return a fixed score
    // Future: Implement NLP-based topic similarity analysis
    let score = 70; // Base coherence score

    const totalSlides = Reveal.getTotalSlides();

    // First slide (title) gets bonus
    if (slideIndex === 0) {
        score += 20;
    }

    // Last slide (Q&A/Contact) gets bonus
    if (slideIndex === totalSlides - 1) {
        score += 20;
    }

    // Middle slides: assume logical flow
    if (slideIndex > 0 && slideIndex < totalSlides - 1) {
        score += 10; // Middle slides have context
    }

    return Math.min(score, 100);
}

/**
 * Get quality grade from score
 * @param {number} score - Overall quality score (0-100)
 * @returns {string} Grade (A+, A, B+, B, C+, C, D, F)
 */
function getQualityGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

/**
 * Display quality evaluation in console
 */
function displayQualityReport(slideIndex, quality) {
    console.group(`📊 Slide ${slideIndex} Quality Report`);
    console.log(`✅ Content Score: ${quality.content}/100`);
    console.log(`🎨 Design Score: ${quality.design}/100`);
    console.log(`🔗 Coherence Score: ${quality.coherence}/100`);
    console.log(`⭐ Overall Score: ${quality.overall}/100 (Grade: ${quality.grade})`);

    if (quality.overall >= 90) {
        console.log('🏆 Excellent slide! High quality across all dimensions.');
    } else if (quality.overall >= 75) {
        console.log('👍 Good slide. Minor improvements possible.');
    } else if (quality.overall >= 60) {
        console.log('⚠️ Acceptable slide. Consider improvements in lower-scoring areas.');
    } else {
        console.warn('❌ Low quality slide. Needs significant improvement!');
    }

    console.groupEnd();
}

// Evaluate current slide on change
Reveal.on('slidechanged', (event) => {
    const quality = evaluateSlideQuality(event.indexh);
    displayQualityReport(event.indexh, quality);

    // Store quality data for analytics
    if (!window.MiyabiPresentation.slideQualityData) {
        window.MiyabiPresentation.slideQualityData = {};
    }
    window.MiyabiPresentation.slideQualityData[event.indexh] = quality;
});

// Add quality evaluation to MiyabiPresentation API
window.MiyabiPresentation.evaluateSlideQuality = evaluateSlideQuality;
window.MiyabiPresentation.evaluateAllSlides = () => {
    const totalSlides = Reveal.getTotalSlides();
    const results = [];

    for (let i = 0; i < totalSlides; i++) {
        const quality = evaluateSlideQuality(i);
        results.push({ slideIndex: i, quality });
    }

    return results;
};

window.MiyabiPresentation.getAverageQuality = () => {
    const results = window.MiyabiPresentation.evaluateAllSlides();
    const totalScore = results.reduce((sum, r) => sum + r.quality.overall, 0);
    const average = Math.round(totalScore / results.length);

    console.log(`📊 Average Presentation Quality: ${average}/100 (Grade: ${getQualityGrade(average)})`);
    return { average, grade: getQualityGrade(average), details: results };
};

console.log('📊 Slide Quality Evaluation System Initialized');
console.log('🔍 Evaluating slides based on PPTEval framework (Content, Design, Coherence)');
console.log('💡 Use MiyabiPresentation.getAverageQuality() to see overall presentation quality');
