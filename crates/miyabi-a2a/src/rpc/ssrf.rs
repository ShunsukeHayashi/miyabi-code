//! SSRF (Server-Side Request Forgery) Prevention
//!
//! This module provides URL validation to prevent SSRF attacks by blocking
//! requests to private IP ranges, localhost, and link-local addresses.

use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, ToSocketAddrs};
use url::Url;

/// Error returned when URL validation fails
#[derive(Debug, Clone, PartialEq)]
pub enum SsrfError {
    /// URL is malformed
    InvalidUrl(String),
    /// URL resolves to a private IP address
    PrivateIpBlocked(String),
    /// DNS resolution failed
    DnsResolutionFailed(String),
    /// URL scheme is not allowed
    InvalidScheme(String),
}

impl std::fmt::Display for SsrfError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidUrl(msg) => write!(f, "Invalid URL: {}", msg),
            Self::PrivateIpBlocked(msg) => write!(f, "SSRF blocked: {}", msg),
            Self::DnsResolutionFailed(msg) => write!(f, "DNS resolution failed: {}", msg),
            Self::InvalidScheme(msg) => write!(f, "Invalid URL scheme: {}", msg),
        }
    }
}

impl std::error::Error for SsrfError {}

/// Check if an IPv4 address is private or reserved
fn is_private_ipv4(ip: &Ipv4Addr) -> bool {
    let octets = ip.octets();
    
    // 127.0.0.0/8 - Loopback
    if octets[0] == 127 { return true; }
    
    // 10.0.0.0/8 - Private Class A
    if octets[0] == 10 { return true; }
    
    // 172.16.0.0/12 - Private Class B
    if octets[0] == 172 && (octets[1] >= 16 && octets[1] <= 31) { return true; }
    
    // 192.168.0.0/16 - Private Class C
    if octets[0] == 192 && octets[1] == 168 { return true; }
    
    // 169.254.0.0/16 - Link-local (AWS/GCP metadata)
    if octets[0] == 169 && octets[1] == 254 { return true; }
    
    // 0.0.0.0/8 - Current network
    if octets[0] == 0 { return true; }
    
    false
}

/// Check if an IPv6 address is private or reserved
fn is_private_ipv6(ip: &Ipv6Addr) -> bool {
    if ip.is_loopback() { return true; }
    if ip.is_unspecified() { return true; }
    
    let segments = ip.segments();
    
    // fc00::/7 - ULA
    if (segments[0] & 0xfe00) == 0xfc00 { return true; }
    
    // fe80::/10 - Link-local
    if (segments[0] & 0xffc0) == 0xfe80 { return true; }
    
    // IPv4-mapped IPv6
    if segments[0..5] == [0, 0, 0, 0, 0] && segments[5] == 0xffff {
        let ipv4 = Ipv4Addr::new(
            (segments[6] >> 8) as u8, (segments[6] & 0xff) as u8,
            (segments[7] >> 8) as u8, (segments[7] & 0xff) as u8,
        );
        return is_private_ipv4(&ipv4);
    }
    
    false
}

/// Check if an IP address is private or reserved
pub fn is_private_ip(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => is_private_ipv4(ipv4),
        IpAddr::V6(ipv6) => is_private_ipv6(ipv6),
    }
}

/// Validate a webhook URL for SSRF prevention
pub fn validate_webhook_url(url: &str) -> Result<(), SsrfError> {
    let parsed = Url::parse(url)
        .map_err(|e| SsrfError::InvalidUrl(format!("Failed to parse URL: {}", e)))?;
    
    let scheme = parsed.scheme();
    if scheme != "http" && scheme != "https" {
        return Err(SsrfError::InvalidScheme(format!(
            "Only http/https allowed, got: {}", scheme
        )));
    }
    
    let host = parsed.host_str()
        .ok_or_else(|| SsrfError::InvalidUrl("URL has no host".to_string()))?;
    
    if let Ok(ip) = host.parse::<IpAddr>() {
        if is_private_ip(&ip) {
            return Err(SsrfError::PrivateIpBlocked(format!(
                "IP {} is private/reserved", ip
            )));
        }
        return Ok(());
    }
    
    let port = parsed.port_or_known_default().unwrap_or(80);
    let addrs = format!("{}:{}", host, port).to_socket_addrs()
        .map_err(|e| SsrfError::DnsResolutionFailed(format!("Failed to resolve {}: {}", host, e)))?;
    
    for addr in addrs {
        if is_private_ip(&addr.ip()) {
            return Err(SsrfError::PrivateIpBlocked(format!(
                "Host {} resolves to private IP {}", host, addr.ip()
            )));
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_private_ipv4() {
        assert!(is_private_ipv4(&Ipv4Addr::new(127, 0, 0, 1)));
        assert!(is_private_ipv4(&Ipv4Addr::new(10, 0, 0, 1)));
        assert!(is_private_ipv4(&Ipv4Addr::new(172, 16, 0, 1)));
        assert!(is_private_ipv4(&Ipv4Addr::new(192, 168, 0, 1)));
        assert!(is_private_ipv4(&Ipv4Addr::new(169, 254, 169, 254)));
        assert!(!is_private_ipv4(&Ipv4Addr::new(8, 8, 8, 8)));
    }

    #[test]
    fn test_validate_url_blocks_private() {
        assert!(validate_webhook_url("http://127.0.0.1/").is_err());
        assert!(validate_webhook_url("http://192.168.1.1/").is_err());
        assert!(validate_webhook_url("http://10.0.0.1/").is_err());
        assert!(validate_webhook_url("http://169.254.169.254/").is_err());
    }

    #[test]
    fn test_validate_url_invalid_scheme() {
        assert!(matches!(
            validate_webhook_url("ftp://example.com/"),
            Err(SsrfError::InvalidScheme(_))
        ));
    }
}
