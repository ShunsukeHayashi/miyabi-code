// ================================================
// Countdown Timer
// ================================================

function initCountdown() {
    // 締切日時を設定（2025年11月10日 23:59:59）
    const deadline = new Date('2025-11-10T23:59:59').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = deadline - now;

        if (distance < 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ================================================
// FAQ Accordion
// ================================================

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // 他のFAQを閉じる
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // クリックされたFAQをトグル
            item.classList.toggle('active');
        });
    });
}

// ================================================
// Smooth Scroll
// ================================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // ハッシュのみのリンクの場合
            if (href === '#' || !href) return;

            e.preventDefault();

            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ================================================
// Scroll Reveal Animation
// ================================================

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    revealElements.forEach(element => {
        observer.observe(element);
    });
}

// ================================================
// Mobile Menu Toggle
// ================================================

function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('mobile-menu-open');
            menuToggle.classList.toggle('active');
        });

        // メニューリンクをクリックしたら閉じる
        document.querySelectorAll('.nav-link, .cta-button-nav').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('mobile-menu-open');
                menuToggle.classList.remove('active');
            });
        });
    }
}

// ================================================
// Form Validation & Submission
// ================================================

function initFormValidation() {
    const form = document.getElementById('registrationForm');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // フォームデータ取得
            const formData = {
                plan: form.plan.value,
                name: form.name.value,
                email: form.email.value,
                company: form.company.value,
                position: form.position.value,
                motivation: form.motivation.value,
                terms: form.terms.checked
            };

            // バリデーション
            if (!validateForm(formData)) {
                return;
            }

            // 送信処理（実際のAPI連携は後で実装）
            try {
                // ローディング表示
                const submitButton = form.querySelector('.form-submit');
                const originalText = submitButton.textContent;
                submitButton.textContent = '送信中...';
                submitButton.disabled = true;

                // ダミーAPI呼び出し（実際はStripe決済へリダイレクト）
                await simulateFormSubmission(formData);

                // 成功メッセージ
                alert('お申し込みありがとうございます！決済ページに移動します。');

                // 決済ページへリダイレクト（実際のStripe URLに変更）
                // window.location.href = '/payment?plan=' + formData.plan;

                // Google Analytics イベント送信
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        event_category: 'Registration',
                        event_label: formData.plan
                    });
                }

                // Facebook Pixel イベント送信
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Lead', {
                        content_name: 'Bootcamp Registration',
                        content_category: formData.plan
                    });
                }

                submitButton.textContent = originalText;
                submitButton.disabled = false;

            } catch (error) {
                alert('送信に失敗しました。もう一度お試しください。');
                console.error('Form submission error:', error);

                const submitButton = form.querySelector('.form-submit');
                submitButton.textContent = '申し込む';
                submitButton.disabled = false;
            }
        });
    }
}

function validateForm(data) {
    // プラン選択チェック
    if (!data.plan) {
        alert('参加プランを選択してください。');
        return false;
    }

    // 名前チェック
    if (!data.name || data.name.trim().length < 2) {
        alert('お名前を正しく入力してください。');
        return false;
    }

    // メールアドレスチェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('有効なメールアドレスを入力してください。');
        return false;
    }

    // 会社名チェック
    if (!data.company || data.company.trim().length < 2) {
        alert('会社名を入力してください。');
        return false;
    }

    // 職種チェック
    if (!data.position) {
        alert('職種を選択してください。');
        return false;
    }

    // 利用規約チェック
    if (!data.terms) {
        alert('利用規約とプライバシーポリシーに同意してください。');
        return false;
    }

    return true;
}

// ダミーAPI呼び出し（開発用）
function simulateFormSubmission(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Form submitted:', data);
            resolve();
        }, 1000);
    });
}

// ================================================
// Header Scroll Effect
// ================================================

function initHeaderScroll() {
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // スクロールダウン時にヘッダーを少し小さくする
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

// ================================================
// Plan Selector Update Price
// ================================================

function initPlanSelector() {
    const planSelect = document.getElementById('plan');

    if (planSelect) {
        planSelect.addEventListener('change', (e) => {
            const selectedPlan = e.target.value;

            // Google Analytics イベント送信
            if (typeof gtag !== 'undefined') {
                gtag('event', 'plan_selected', {
                    event_category: 'Registration',
                    event_label: selectedPlan
                });
            }

            // Facebook Pixel イベント送信
            if (typeof fbq !== 'undefined') {
                fbq('track', 'AddToCart', {
                    content_name: 'Bootcamp Registration',
                    content_category: selectedPlan,
                    value: selectedPlan === 'online' ? 29800 : 39800,
                    currency: 'JPY'
                });
            }
        });
    }
}

// ================================================
// Testimonial Carousel (Optional Enhancement)
// ================================================

function initTestimonialCarousel() {
    // 将来的にカルーセル機能を追加する場合はここに実装
    // Swiper.js や Slick などのライブラリを使用することを推奨
}

// ================================================
// UTM Parameters Tracking
// ================================================

function trackUTMParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content'),
        utm_term: urlParams.get('utm_term')
    };

    // UTMパラメータがある場合、セッションストレージに保存
    if (utmParams.utm_source) {
        sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
        console.log('UTM parameters tracked:', utmParams);
    }

    // Google Analytics へUTMパラメータを送信
    if (typeof gtag !== 'undefined' && utmParams.utm_source) {
        gtag('event', 'page_view_with_utm', {
            ...utmParams
        });
    }
}

// ================================================
// A/B Testing Support (Optional)
// ================================================

function initABTesting() {
    // A/Bテスト用のバリアント識別
    // Google Optimize や VWO などのツールと連携する場合はここで実装

    const variant = sessionStorage.getItem('ab_variant') || 'A';
    console.log('A/B Test Variant:', variant);

    // バリアントに応じてUIを変更
    // 例: CTAボタンの色を変更
    // if (variant === 'B') {
    //     document.querySelectorAll('.cta-button-primary').forEach(btn => {
    //         btn.style.backgroundColor = '#E55E00';
    //     });
    // }
}

// ================================================
// Page Visibility Tracking
// ================================================

function trackPageVisibility() {
    let startTime = Date.now();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);

            // Google Analytics へ滞在時間を送信
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_visibility', {
                    event_category: 'Engagement',
                    event_label: 'Time Spent Before Hidden',
                    value: timeSpent
                });
            }
        } else {
            startTime = Date.now();
        }
    });
}

// ================================================
// Exit Intent Popup (Optional Enhancement)
// ================================================

function initExitIntent() {
    let exitIntentShown = false;

    document.addEventListener('mouseleave', (e) => {
        if (e.clientY < 10 && !exitIntentShown) {
            exitIntentShown = true;

            // Exit Intentポップアップ表示（実装は省略）
            console.log('Exit Intent triggered');

            // Google Analytics イベント送信
            if (typeof gtag !== 'undefined') {
                gtag('event', 'exit_intent', {
                    event_category: 'Engagement',
                    event_label: 'Mouse Leave'
                });
            }
        }
    });
}

// ================================================
// Scroll Progress Indicator
// ================================================

function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '3px';
    progressBar.style.backgroundColor = '#FF6B00';
    progressBar.style.zIndex = '10000';
    progressBar.style.transition = 'width 0.1s ease';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// ================================================
// CTA Button Click Tracking
// ================================================

function trackCTAClicks() {
    document.querySelectorAll('.cta-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = e.target.textContent.trim();
            const buttonClass = e.target.className;

            // Google Analytics イベント送信
            if (typeof gtag !== 'undefined') {
                gtag('event', 'cta_click', {
                    event_category: 'CTA',
                    event_label: buttonText,
                    event_value: buttonClass.includes('primary') ? 1 : 0
                });
            }

            // Facebook Pixel イベント送信
            if (typeof fbq !== 'undefined') {
                fbq('track', 'ViewContent', {
                    content_name: buttonText,
                    content_category: 'CTA Button'
                });
            }

            console.log('CTA clicked:', buttonText);
        });
    });
}

// ================================================
// Section View Tracking
// ================================================

function trackSectionViews() {
    const sections = document.querySelectorAll('section[id]');
    const sectionViews = new Set();

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !sectionViews.has(entry.target.id)) {
                    sectionViews.add(entry.target.id);

                    // Google Analytics イベント送信
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'section_view', {
                            event_category: 'Engagement',
                            event_label: entry.target.id
                        });
                    }

                    console.log('Section viewed:', entry.target.id);
                }
            });
        },
        {
            threshold: 0.5
        }
    );

    sections.forEach(section => {
        observer.observe(section);
    });
}

// ================================================
// Initialization
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('BytePlus Video API Bootcamp - Landing Page Initialized');

    // Core Features
    initCountdown();
    initFAQ();
    initSmoothScroll();
    initScrollReveal();
    initMobileMenu();
    initFormValidation();
    initHeaderScroll();
    initPlanSelector();

    // Tracking & Analytics
    trackUTMParameters();
    trackPageVisibility();
    trackCTAClicks();
    trackSectionViews();

    // Optional Enhancements
    initScrollProgress();
    // initABTesting(); // A/Bテスト実施時に有効化
    // initExitIntent(); // Exit Intentポップアップ実施時に有効化
    // initTestimonialCarousel(); // カルーセル実装時に有効化

    console.log('All features initialized successfully');
});

// ================================================
// Service Worker Registration (Optional - PWA)
// ================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service Workerを登録する場合はここに実装
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('Service Worker registered:', registration))
        //     .catch(error => console.log('Service Worker registration failed:', error));
    });
}
