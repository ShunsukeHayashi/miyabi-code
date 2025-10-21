/**
 * BytePlus Bootcamp Landing Page - Tracking Configuration Template
 *
 * このファイルをコピーして tracking-config.js として保存し、
 * 実際のトラッキングIDを設定してください。
 *
 * コピーコマンド:
 * cp tracking-config.template.js tracking-config.js
 *
 * 注意: tracking-config.js は .gitignore に追加してください
 */

const TRACKING_CONFIG = {
    // ===================================
    // Google Analytics 4 (GA4)
    // ===================================
    ga4: {
        enabled: true,
        measurementId: 'G-XXXXXXXXXX', // ← ここに実際の測定IDを入力
        //
        // 取得方法:
        // 1. https://analytics.google.com/ にアクセス
        // 2. 管理 > データストリーム > 測定ID をコピー
        //
        // 例: G-ABC123XYZ9
    },

    // ===================================
    // Facebook Pixel
    // ===================================
    facebookPixel: {
        enabled: true,
        pixelId: '123456789012345', // ← ここに実際のPixel IDを入力
        //
        // 取得方法:
        // 1. https://business.facebook.com/events_manager/ にアクセス
        // 2. Pixelを選択 > 設定 > Pixel ID をコピー
        //
        // 例: 123456789012345 (15桁の数字)
    },

    // ===================================
    // LinkedIn Insight Tag
    // ===================================
    linkedinInsight: {
        enabled: true,
        partnerId: '1234567', // ← ここに実際のPartner IDを入力
        //
        // 取得方法:
        // 1. https://www.linkedin.com/campaignmanager/ にアクセス
        // 2. アカウント資産 > Insight Tag > Partner ID をコピー
        //
        // 例: 1234567 (7桁の数字)

        conversionId: null, // オプション: コンバージョンIDを設定する場合
    },

    // ===================================
    // デバッグ設定
    // ===================================
    debug: {
        enabled: false, // 開発環境でtrueにするとコンソールにログを出力
        logEvents: true, // イベント送信時にログ出力
        blockRequests: false, // 実際のリクエスト送信をブロック（テスト用）
    },

    // ===================================
    // プライバシー設定
    // ===================================
    privacy: {
        // GDPR対応: EUユーザーに対してトラッキング同意を求める
        requireConsent: false,

        // Cookie保存期間（日数）
        cookieExpireDays: 365,

        // トラッキング拒否時のフォールバック
        respectDoNotTrack: true,
    },

    // ===================================
    // カスタムイベント設定
    // ===================================
    events: {
        // フォーム送信時の値（円）
        formSubmissionValue: {
            online: 29800,
            offline: 39800,
        },

        // GA4カスタムディメンション
        customDimensions: {
            source: 'landing_page',
            campaign: 'byteplus_bootcamp_2025_11',
            medium: 'organic',
        },
    },
};

// ===================================
// 設定の検証
// ===================================
function validateConfig() {
    const errors = [];

    // GA4 測定ID検証
    if (TRACKING_CONFIG.ga4.enabled) {
        if (!TRACKING_CONFIG.ga4.measurementId || TRACKING_CONFIG.ga4.measurementId === 'G-XXXXXXXXXX') {
            errors.push('GA4 Measurement ID is not configured');
        } else if (!/^G-[A-Z0-9]{10}$/.test(TRACKING_CONFIG.ga4.measurementId)) {
            errors.push('GA4 Measurement ID format is invalid (expected: G-XXXXXXXXXX)');
        }
    }

    // Facebook Pixel ID検証
    if (TRACKING_CONFIG.facebookPixel.enabled) {
        if (!TRACKING_CONFIG.facebookPixel.pixelId || TRACKING_CONFIG.facebookPixel.pixelId === '123456789012345') {
            errors.push('Facebook Pixel ID is not configured');
        } else if (!/^\d{15}$/.test(TRACKING_CONFIG.facebookPixel.pixelId)) {
            errors.push('Facebook Pixel ID format is invalid (expected: 15 digits)');
        }
    }

    // LinkedIn Partner ID検証
    if (TRACKING_CONFIG.linkedinInsight.enabled) {
        if (!TRACKING_CONFIG.linkedinInsight.partnerId || TRACKING_CONFIG.linkedinInsight.partnerId === '1234567') {
            errors.push('LinkedIn Partner ID is not configured');
        } else if (!/^\d{7}$/.test(TRACKING_CONFIG.linkedinInsight.partnerId)) {
            errors.push('LinkedIn Partner ID format is invalid (expected: 7 digits)');
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors,
    };
}

// ===================================
// 設定の適用
// ===================================
function applyTrackingConfig() {
    const validation = validateConfig();

    if (TRACKING_CONFIG.debug.enabled) {
        console.log('[Tracking Config] Validation:', validation);
        console.log('[Tracking Config] Configuration:', TRACKING_CONFIG);
    }

    if (!validation.valid) {
        console.warn('[Tracking Config] Configuration errors:', validation.errors);
        if (TRACKING_CONFIG.debug.blockRequests) {
            console.warn('[Tracking Config] Blocking all tracking requests due to configuration errors');
            return false;
        }
    }

    // GA4の設定
    if (TRACKING_CONFIG.ga4.enabled && window.gtag) {
        gtag('config', TRACKING_CONFIG.ga4.measurementId, {
            ...TRACKING_CONFIG.events.customDimensions,
            cookie_expires: TRACKING_CONFIG.privacy.cookieExpireDays * 24 * 60 * 60,
        });

        if (TRACKING_CONFIG.debug.enabled) {
            console.log('[GA4] Configured with ID:', TRACKING_CONFIG.ga4.measurementId);
        }
    }

    // Facebook Pixelの設定
    if (TRACKING_CONFIG.facebookPixel.enabled && window.fbq) {
        fbq('init', TRACKING_CONFIG.facebookPixel.pixelId);
        fbq('track', 'PageView');

        if (TRACKING_CONFIG.debug.enabled) {
            console.log('[Facebook Pixel] Configured with ID:', TRACKING_CONFIG.facebookPixel.pixelId);
        }
    }

    // LinkedIn Insight Tagの設定
    if (TRACKING_CONFIG.linkedinInsight.enabled && window._linkedin_data_partner_ids) {
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(TRACKING_CONFIG.linkedinInsight.partnerId);

        if (TRACKING_CONFIG.debug.enabled) {
            console.log('[LinkedIn] Configured with Partner ID:', TRACKING_CONFIG.linkedinInsight.partnerId);
        }
    }

    return true;
}

// ===================================
// イベント送信ヘルパー関数
// ===================================
const TrackingHelpers = {
    /**
     * カスタムイベントを送信
     */
    trackEvent(eventName, params = {}) {
        if (TRACKING_CONFIG.debug.blockRequests) {
            console.log('[DEBUG] Blocked event:', eventName, params);
            return;
        }

        // GA4
        if (TRACKING_CONFIG.ga4.enabled && window.gtag) {
            gtag('event', eventName, params);
            if (TRACKING_CONFIG.debug.logEvents) {
                console.log('[GA4] Event:', eventName, params);
            }
        }

        // Facebook Pixel
        if (TRACKING_CONFIG.facebookPixel.enabled && window.fbq) {
            fbq('track', eventName, params);
            if (TRACKING_CONFIG.debug.logEvents) {
                console.log('[Facebook] Event:', eventName, params);
            }
        }
    },

    /**
     * フォーム送信イベント
     */
    trackFormSubmission(courseType) {
        const value = TRACKING_CONFIG.events.formSubmissionValue[courseType] || 0;

        this.trackEvent('form_submit', {
            event_category: 'engagement',
            event_label: 'bootcamp_application',
            course_type: courseType,
            value: value,
            currency: 'JPY',
        });

        // LinkedIn Conversion
        if (TRACKING_CONFIG.linkedinInsight.enabled &&
            TRACKING_CONFIG.linkedinInsight.conversionId &&
            window.lintrk) {
            lintrk('track', {
                conversion_id: TRACKING_CONFIG.linkedinInsight.conversionId
            });

            if (TRACKING_CONFIG.debug.logEvents) {
                console.log('[LinkedIn] Conversion tracked:', TRACKING_CONFIG.linkedinInsight.conversionId);
            }
        }
    },

    /**
     * CTAクリックイベント
     */
    trackCTAClick(buttonText, section) {
        this.trackEvent('cta_click', {
            event_category: 'engagement',
            event_label: buttonText,
            section: section,
        });
    },

    /**
     * FAQインタラクションイベント
     */
    trackFAQ(question, action) {
        this.trackEvent('faq_toggle', {
            event_category: 'engagement',
            question: question,
            action: action, // 'open' or 'close'
        });
    },

    /**
     * スクロール深度イベント
     */
    trackScrollDepth(percentage) {
        this.trackEvent('scroll', {
            event_category: 'engagement',
            event_label: `${percentage}%`,
            value: percentage,
        });
    },
};

// ===================================
// エクスポート
// ===================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TRACKING_CONFIG,
        validateConfig,
        applyTrackingConfig,
        TrackingHelpers,
    };
}

// DOMContentLoaded時に自動適用
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        applyTrackingConfig();
    });
}
