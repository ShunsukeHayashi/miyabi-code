/// LINE Messaging API 署名検証ミドルウェア
///
/// Reference: https://developers.line.biz/ja/reference/messaging-api/#signature-validation

use axum::{
    body::Body,
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use base64::Engine;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use tracing::{debug, error, warn};

type HmacSha256 = Hmac<Sha256>;

/// LINE署名検証エラー
#[derive(Debug, thiserror::Error)]
pub enum SignatureError {
    #[error("X-Line-Signature header is missing")]
    MissingSignature,

    #[error("Channel secret is not configured")]
    MissingChannelSecret,

    #[error("Failed to decode signature: {0}")]
    DecodeError(#[from] base64::DecodeError),

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Failed to read request body: {0}")]
    BodyReadError(String),
}

impl IntoResponse for SignatureError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            Self::MissingSignature => (StatusCode::BAD_REQUEST, "Missing signature header"),
            Self::MissingChannelSecret => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Server configuration error")
            }
            Self::DecodeError(_) => (StatusCode::BAD_REQUEST, "Invalid signature format"),
            Self::InvalidSignature => (StatusCode::UNAUTHORIZED, "Invalid signature"),
            Self::BodyReadError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read body"),
        };

        error!("LINE signature validation failed: {}", self);
        (status, message).into_response()
    }
}

/// LINE署名検証ミドルウェア
///
/// ## 使用方法
///
/// ```rust
/// use axum::{Router, routing::post};
/// use axum::middleware::from_fn_with_state;
///
/// let channel_secret = std::env::var("LINE_CHANNEL_SECRET").unwrap();
/// let app = Router::new()
///     .route("/line/webhook", post(handle_webhook))
///     .layer(from_fn_with_state(channel_secret.clone(), verify_line_signature));
/// ```
pub async fn verify_line_signature(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, SignatureError> {
    // X-Line-Signature ヘッダーを取得
    let signature_header = headers
        .get("X-Line-Signature")
        .ok_or(SignatureError::MissingSignature)?;

    let signature_str = signature_header
        .to_str()
        .map_err(|_| SignatureError::DecodeError(base64::DecodeError::InvalidByte(0, 0)))?;

    // Channel Secret を環境変数から取得
    let channel_secret =
        std::env::var("LINE_CHANNEL_SECRET").map_err(|_| SignatureError::MissingChannelSecret)?;

    // リクエストボディを読み取る
    let (parts, body) = request.into_parts();
    let body_bytes = axum::body::to_bytes(body, usize::MAX)
        .await
        .map_err(|e| SignatureError::BodyReadError(e.to_string()))?;

    debug!("LINE webhook body size: {} bytes", body_bytes.len());

    // HMAC-SHA256 署名を計算
    let mut mac = HmacSha256::new_from_slice(channel_secret.as_bytes())
        .map_err(|_| SignatureError::MissingChannelSecret)?;
    mac.update(&body_bytes);

    // Base64 デコードした署名と比較
    let expected_signature = base64::engine::general_purpose::STANDARD.decode(signature_str)?;
    let computed_signature = mac.finalize().into_bytes();
    let computed_slice: &[u8] = computed_signature.as_ref();

    if expected_signature.as_slice() != computed_slice {
        warn!("LINE signature mismatch (possible MITM attack or incorrect secret)");
        return Err(SignatureError::InvalidSignature);
    }

    debug!("LINE signature validated successfully");

    // リクエストボディを復元して次のミドルウェアへ
    let request = Request::from_parts(parts, Body::from(body_bytes));
    Ok(next.run(request).await)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{header, Request, StatusCode},
    };
    use base64::Engine;

    fn compute_signature(body: &[u8], secret: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(body);
        let result = mac.finalize();
        base64::engine::general_purpose::STANDARD.encode(result.into_bytes())
    }

    #[tokio::test]
    async fn test_valid_signature() {
        let body = br#"{"events":[]}"#;
        let secret = "test_secret_123";
        let signature = compute_signature(body, secret);

        std::env::set_var("LINE_CHANNEL_SECRET", secret);

        let mut headers = HeaderMap::new();
        headers.insert("X-Line-Signature", signature.parse().unwrap());

        let request = Request::builder()
            .uri("/line/webhook")
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(&body[..]))
            .unwrap();

        // Note: 実際のテストでは Next::run() をモックする必要がある
        // ここでは署名計算のロジックのみテスト
    }

    #[test]
    fn test_compute_signature() {
        let body = b"test body";
        let secret = "test_secret";
        let sig1 = compute_signature(body, secret);
        let sig2 = compute_signature(body, secret);

        // 同じ入力なら同じ署名
        assert_eq!(sig1, sig2);

        // 異なるシークレットなら異なる署名
        let sig3 = compute_signature(body, "different_secret");
        assert_ne!(sig1, sig3);

        // 異なるボディなら異なる署名
        let sig4 = compute_signature(b"different body", secret);
        assert_ne!(sig1, sig4);
    }

    #[test]
    fn test_signature_error_into_response() {
        let err = SignatureError::MissingSignature;
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let err = SignatureError::InvalidSignature;
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        let err = SignatureError::MissingChannelSecret;
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }
}
