//! API Data Transfer Objects (DTOs)
//!
//! This module contains request and response types for all API endpoints.

pub mod user;
pub mod funnel;

pub use user::{CreateUserRequest, ListUsersQuery, PaginatedUsersResponse, UpdateUserRequest, UserResponse};
pub use funnel::{
    CreateFunnelRequest, FunnelResponse, FunnelStatsResponse, ListFunnelsQuery,
    PaginatedFunnelsResponse, UpdateFunnelRequest,
};
