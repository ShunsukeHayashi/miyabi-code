# API Reference

## Core Module

### Application

The main application class.

**Methods:**
- `route(path, methods=None)` - Register route
- `add_middleware(middleware)` - Add middleware
- `configure(key, value)` - Set configuration
- `run(host='127.0.0.1', port=5000, debug=False)` - Run server

### Request

HTTP request object.

**Methods:**
- `get_header(name, default=None)` - Get header value
- `get_query_param(name, default=None)` - Get query parameter
- `get_json()` - Parse JSON body
- `is_json()` - Check if JSON content type

### Response

HTTP response object.

**Class Methods:**
- `Response.json(data, status_code=200)` - Create JSON response
- `Response.text(text, status_code=200)` - Create text response
- `Response.html(html, status_code=200)` - Create HTML response
- `Response.redirect(location, status_code=302)` - Create redirect

## HTTP Module

### Headers

Case-insensitive header management.

### CookieJar

Cookie handling with attributes.

### SessionManager

Server-side session management.
