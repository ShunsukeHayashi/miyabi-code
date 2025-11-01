//! API Data Transfer Objects (DTOs)
//!
//! This module contains request and response types for all API endpoints.

pub mod user;
pub mod funnel;
pub mod page;

pub use user::{CreateUserRequest, ListUsersQuery, PaginatedUsersResponse, UpdateUserRequest, UserResponse};
pub use funnel::{
    CreateFunnelRequest, FunnelResponse, FunnelStatsResponse, ListFunnelsQuery,
    PaginatedFunnelsResponse, UpdateFunnelRequest,
};
pub use page::{
    CreatePageRequest, DetailedPageResponse, ListPagesQuery, PageResponse, PageStatsResponse,
    PaginatedPagesResponse, UpdatePageContentRequest, UpdatePageRequest,
};
