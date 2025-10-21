// ================================================
// A/B Testing Engine for BytePlus Landing Page
// ================================================
//
// Purpose: Optimize conversion rate through systematic testing
// Tests: Headline, CTA Color, Pricing Order
// Tracking: Google Analytics 4 custom events
// ================================================

(function() {
    'use strict';

    // ================================================
    // Configuration
    // ================================================

    const AB_TEST_CONFIG = {
        enabled: true,
        debug: false, // Set to true to see console logs
        storageKey: 'byteplus_ab_variant',
        tests: {
            headline: {
                enabled: true,
                variants: {
                    control: {
                        weight: 33,
                        text: '次世代動画生成API<br>実装完全マスター'
                    },
                    variant_b: {
                        weight: 33,
                        text: '動画生成APIで<br>月30万円を稼ぐ'
                    },
                    variant_c: {
                        weight: 34,
                        text: '3時間でマスター<br>動画生成API実装'
                    }
                }
            },
            cta_color: {
                enabled: true,
                variants: {
                    control: {
                        weight: 33,
                        color: 'orange' // #FF6B35 (default)
                    },
                    variant_b: {
                        weight: 33,
                        color: 'green' // #10B981
                    },
                    variant_c: {
                        weight: 34,
                        color: 'blue' // #3B82F6
                    }
                }
            },
            pricing_order: {
                enabled: true,
                variants: {
                    control: {
                        weight: 50,
                        order: 'online-first' // オンライン → オフライン
                    },
                    variant_b: {
                        weight: 50,
                        order: 'offline-first' // オフライン → オンライン（人気を先に）
                    }
                }
            }
        }
    };

    // ================================================
    // Utility Functions
    // ================================================

    function log(...args) {
        if (AB_TEST_CONFIG.debug) {
            console.log('[A/B Test]', ...args);
        }
    }

    function getRandomVariant(variants) {
        const total = Object.values(variants).reduce((sum, v) => sum + v.weight, 0);
        let random = Math.random() * total;

        for (const [key, variant] of Object.entries(variants)) {
            random -= variant.weight;
            if (random <= 0) {
                return key;
            }
        }

        return 'control';
    }

    function getStoredVariants() {
        try {
            const stored = localStorage.getItem(AB_TEST_CONFIG.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            log('Error reading stored variants:', e);
            return {};
        }
    }

    function storeVariants(variants) {
        try {
            localStorage.setItem(AB_TEST_CONFIG.storageKey, JSON.stringify(variants));
        } catch (e) {
            log('Error storing variants:', e);
        }
    }

    function sendTrackingEvent(testName, variant) {
        // GA4 カスタムイベント送信
        if (typeof gtag !== 'undefined') {
            gtag('event', 'ab_test_assigned', {
                test_name: testName,
                variant_name: variant,
                timestamp: new Date().toISOString()
            });
            log(`Tracking event sent: ${testName} = ${variant}`);
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'ABTestAssigned', {
                test_name: testName,
                variant_name: variant
            });
        }

        // LinkedIn Insight Tag
        if (typeof lintrk !== 'undefined') {
            lintrk('track', { conversion_id: 'ab_test_assigned' });
        }
    }

    // ================================================
    // Test Implementations
    // ================================================

    function applyHeadlineTest(variant) {
        const config = AB_TEST_CONFIG.tests.headline.variants[variant];
        if (!config) return;

        const headline = document.querySelector('.hero-title-large');
        if (headline) {
            headline.innerHTML = config.text;
            log('Headline test applied:', variant, config.text);
        }
    }

    function applyCTAColorTest(variant) {
        const config = AB_TEST_CONFIG.tests.cta_color.variants[variant];
        if (!config) return;

        const ctaButtons = document.querySelectorAll('.cta-button-primary, .cta-button-nav');
        ctaButtons.forEach(button => {
            button.setAttribute('data-ab-color', config.color);
            log('CTA color test applied:', variant, config.color);
        });
    }

    function applyPricingOrderTest(variant) {
        const config = AB_TEST_CONFIG.tests.pricing_order.variants[variant];
        if (!config || config.order === 'online-first') return;

        const pricingGrid = document.querySelector('.pricing-grid');
        if (!pricingGrid) return;

        const cards = Array.from(pricingGrid.children);
        if (cards.length === 2) {
            // Swap order: オフライン → オンライン
            pricingGrid.insertBefore(cards[1], cards[0]);
            log('Pricing order test applied:', variant, config.order);
        }
    }

    // ================================================
    // Main A/B Test Engine
    // ================================================

    function initABTest() {
        if (!AB_TEST_CONFIG.enabled) {
            log('A/B testing is disabled');
            return;
        }

        log('Initializing A/B testing...');

        // Get or assign variants
        let assignedVariants = getStoredVariants();
        let isNewAssignment = false;

        for (const [testName, testConfig] of Object.entries(AB_TEST_CONFIG.tests)) {
            if (!testConfig.enabled) continue;

            if (!assignedVariants[testName]) {
                assignedVariants[testName] = getRandomVariant(testConfig.variants);
                isNewAssignment = true;
                log(`Assigned new variant for ${testName}:`, assignedVariants[testName]);
            } else {
                log(`Using stored variant for ${testName}:`, assignedVariants[testName]);
            }
        }

        // Store new assignments
        if (isNewAssignment) {
            storeVariants(assignedVariants);
        }

        // Apply tests
        if (assignedVariants.headline) {
            applyHeadlineTest(assignedVariants.headline);
            sendTrackingEvent('headline', assignedVariants.headline);
        }

        if (assignedVariants.cta_color) {
            applyCTAColorTest(assignedVariants.cta_color);
            sendTrackingEvent('cta_color', assignedVariants.cta_color);
        }

        if (assignedVariants.pricing_order) {
            applyPricingOrderTest(assignedVariants.pricing_order);
            sendTrackingEvent('pricing_order', assignedVariants.pricing_order);
        }

        // Expose API for debugging
        window.ABTest = {
            getVariants: () => assignedVariants,
            reset: () => {
                localStorage.removeItem(AB_TEST_CONFIG.storageKey);
                location.reload();
            },
            debug: (enabled) => {
                AB_TEST_CONFIG.debug = enabled;
            }
        };

        log('A/B testing initialized:', assignedVariants);
    }

    // ================================================
    // Initialize on DOM Ready
    // ================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initABTest);
    } else {
        initABTest();
    }

})();
