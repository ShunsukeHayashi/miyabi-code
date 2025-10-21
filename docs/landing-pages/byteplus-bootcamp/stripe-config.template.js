/**
 * BytePlus Bootcamp Landing Page - Stripe Payment Configuration Template
 *
 * このファイルをコピーして stripe-config.js として保存し、
 * 実際のStripe APIキーを設定してください。
 *
 * コピーコマンド:
 * cp stripe-config.template.js stripe-config.js
 *
 * 注意: stripe-config.js は .gitignore に追加済み（公開しないこと）
 */

const STRIPE_CONFIG = {
    // ===================================
    // Stripe API Keys
    // ===================================
    // 公開可能キー (Publishable Key)
    // クライアントサイド（ブラウザ）で使用する
    // 例: pk_test_... (テスト環境) または pk_live_... (本番環境)
    publishableKey: 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX',

    // シークレットキー (Secret Key)
    // サーバーサイドでのみ使用（絶対にブラウザに公開しない）
    // 例: sk_test_... (テスト環境) または sk_live_... (本番環境)
    // 注意: このファイルはクライアントサイドで読み込まない
    secretKey: 'sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXX',

    // ===================================
    // 環境設定
    // ===================================
    environment: 'test', // 'test' または 'live'

    // ===================================
    // 商品設定
    // ===================================
    products: {
        online: {
            priceId: 'price_XXXXXXXXXXXXXXXXXX', // Stripe Price ID (オンライン受講)
            amount: 29800, // 金額（円）
            currency: 'jpy',
            name: 'BytePlus Video API Bootcamp - オンライン受講',
            description: '2025年11月15日(土) 10:00-18:00 オンライン開催',
            images: [
                'https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/images/og-image.png'
            ],
        },
        offline: {
            priceId: 'price_YYYYYYYYYYYYYYYYYY', // Stripe Price ID (会場受講)
            amount: 39800, // 金額（円）
            currency: 'jpy',
            name: 'BytePlus Video API Bootcamp - 会場受講',
            description: '2025年11月15日(土) 10:00-18:00 会場開催（東京）',
            images: [
                'https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/images/og-image.png'
            ],
        },
    },

    // ===================================
    // Checkout Session設定
    // ===================================
    checkout: {
        // 決済成功時のリダイレクトURL
        successUrl: 'https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/success.html',

        // 決済キャンセル時のリダイレクトURL
        cancelUrl: 'https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/index.html#application',

        // 決済モード
        mode: 'payment', // 'payment' (一回払い), 'subscription' (サブスク), 'setup' (セットアップ)

        // 利用可能な支払い方法
        paymentMethodTypes: ['card'], // ['card', 'konbini', 'paypay'] など

        // 請求先住所の収集
        billingAddressCollection: 'required', // 'auto' または 'required'

        // 配送先住所の収集（物理商品の場合のみ）
        shippingAddressCollection: null,

        // 自動税計算（Stripe Tax使用時）
        automaticTax: {
            enabled: false,
        },

        // カスタムフィールド（追加情報の収集）
        customFields: [
            {
                key: 'company_name',
                label: { type: 'custom', custom: '会社名' },
                type: 'text',
                optional: true,
            },
            {
                key: 'phone_number',
                label: { type: 'custom', custom: '電話番号' },
                type: 'text',
                optional: false,
            },
        ],

        // メタデータ（Webhook等で使用）
        metadata: {
            event_name: 'BytePlus Video API Bootcamp',
            event_date: '2025-11-15',
            source: 'landing_page',
        },
    },

    // ===================================
    // Webhook設定
    // ===================================
    webhook: {
        // Webhook署名検証用のシークレット
        // Stripe Dashboard > Developers > Webhooks で取得
        secret: 'whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',

        // Webhook URL
        url: 'https://your-backend.com/api/stripe/webhook',

        // 監視するイベント
        events: [
            'checkout.session.completed',
            'payment_intent.succeeded',
            'payment_intent.payment_failed',
        ],
    },

    // ===================================
    // デバッグ設定
    // ===================================
    debug: {
        enabled: false, // trueにするとコンソールにログ出力
        logCheckoutData: true, // Checkout Sessionデータをログ出力
    },
};

// ===================================
// Stripe初期化
// ===================================
let stripeInstance = null;

function initializeStripe() {
    if (typeof Stripe === 'undefined') {
        console.error('[Stripe] Stripe.js is not loaded. Please include the Stripe.js script.');
        return null;
    }

    if (!stripeInstance) {
        stripeInstance = Stripe(STRIPE_CONFIG.publishableKey);

        if (STRIPE_CONFIG.debug.enabled) {
            console.log('[Stripe] Initialized with publishable key:', STRIPE_CONFIG.publishableKey);
        }
    }

    return stripeInstance;
}

// ===================================
// Checkout Session作成
// ===================================
async function createCheckoutSession(courseType, formData) {
    const product = STRIPE_CONFIG.products[courseType];

    if (!product) {
        throw new Error(`Invalid course type: ${courseType}`);
    }

    // サーバーサイドAPI呼び出し（実装が必要）
    // この例ではStripe Checkout Sessionを直接作成する方法を示しますが、
    // 実際にはバックエンドAPIを経由してSession IDを取得すべきです
    const checkoutData = {
        mode: STRIPE_CONFIG.checkout.mode,
        payment_method_types: STRIPE_CONFIG.checkout.paymentMethodTypes,
        line_items: [
            {
                price: product.priceId,
                quantity: 1,
            },
        ],
        success_url: STRIPE_CONFIG.checkout.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: STRIPE_CONFIG.checkout.cancelUrl,
        billing_address_collection: STRIPE_CONFIG.checkout.billingAddressCollection,
        customer_email: formData.email,
        metadata: {
            ...STRIPE_CONFIG.checkout.metadata,
            course_type: courseType,
            customer_name: formData.name,
            customer_phone: formData.phone,
            customer_company: formData.company || '',
        },
    };

    if (STRIPE_CONFIG.debug.logCheckoutData) {
        console.log('[Stripe] Checkout data:', checkoutData);
    }

    try {
        // バックエンドAPIに送信してSession IDを取得
        const response = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkoutData),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const { sessionId } = await response.json();

        return sessionId;
    } catch (error) {
        console.error('[Stripe] Failed to create checkout session:', error);
        throw error;
    }
}

// ===================================
// Checkout画面へリダイレクト
// ===================================
async function redirectToCheckout(courseType, formData) {
    const stripe = initializeStripe();

    if (!stripe) {
        throw new Error('Stripe is not initialized');
    }

    try {
        // Checkout Session作成
        const sessionId = await createCheckoutSession(courseType, formData);

        // Stripe Checkoutへリダイレクト
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });

        if (error) {
            console.error('[Stripe] Redirect error:', error);
            throw error;
        }
    } catch (error) {
        console.error('[Stripe] Checkout failed:', error);
        throw error;
    }
}

// ===================================
// バックエンドAPI実装例 (Node.js + Express)
// ===================================
/*
// server.js (バックエンド実装例)

const express = require('express');
const stripe = require('stripe')(STRIPE_CONFIG.secretKey);

const app = express();
app.use(express.json());

// Checkout Session作成エンドポイント
app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create(req.body);

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook受信エンドポイント
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            STRIPE_CONFIG.webhook.secret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // イベント処理
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Payment succeeded:', session);
            // メール送信、データベース更新などの処理
            break;

        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent succeeded:', paymentIntent);
            break;

        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object;
            console.error('Payment failed:', failedIntent);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
});

app.listen(3000, () => console.log('Server running on port 3000'));
*/

// ===================================
// エクスポート
// ===================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STRIPE_CONFIG,
        initializeStripe,
        createCheckoutSession,
        redirectToCheckout,
    };
}
