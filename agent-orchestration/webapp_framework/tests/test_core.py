"""Tests for core module."""
import pytest
from webapp_framework.core.application import Application
from webapp_framework.core.request import Request
from webapp_framework.core.response import Response
from webapp_framework.core.router import Router

class TestApplication:
    def test_create_app(self):
        app = Application("TestApp")
        assert app.name == "TestApp"
    
    def test_route_decorator(self):
        app = Application()
        @app.route("/test")
        def handler():
            return "test"
        assert len(app.routes) == 1
    
    def test_add_middleware(self):
        app = Application()
        app.add_middleware(lambda req, next: next(req))
        assert len(app.middleware) == 1
    
    def test_configure(self):
        app = Application()
        app.configure("key", "value")
        assert app.get_config("key") == "value"

class TestRequest:
    def test_create_request(self):
        req = Request("GET", "/test")
        assert req.method == "GET"
        assert req.path == "/test"
    
    def test_get_header(self):
        req = Request("GET", "/", headers={"Content-Type": "text/html"})
        assert req.get_header("content-type") == "text/html"
    
    def test_get_query_param(self):
        req = Request("GET", "/", query_string="foo=bar&baz=qux")
        assert req.get_query_param("foo") == "bar"
    
    def test_is_json(self):
        req = Request("POST", "/", headers={"Content-Type": "application/json"})
        assert req.is_json() == True

class TestResponse:
    def test_create_response(self):
        resp = Response("Hello")
        assert resp.status_code == 200
    
    def test_json_response(self):
        resp = Response.json({"key": "value"})
        assert resp.status_code == 200
        assert "application/json" in resp.get_header("Content-Type")
    
    def test_redirect(self):
        resp = Response.redirect("/new-url")
        assert resp.status_code == 302
        assert resp.get_header("Location") == "/new-url"
    
    def test_set_header(self):
        resp = Response()
        resp.set_header("X-Custom", "value")
        assert resp.get_header("X-Custom") == "value"

class TestRouter:
    def test_add_route(self):
        router = Router()
        router.add_route("/test", lambda: "test")
        assert len(router.routes) == 1
    
    def test_match_route(self):
        router = Router()
        router.add_route("/test", lambda: "test", methods=["GET"])
        result = router.match("/test", "GET")
        assert result is not None
    
    def test_match_with_params(self):
        router = Router()
        router.add_route("/user/<id>", lambda id: id, methods=["GET"])
        handler, params = router.match("/user/123", "GET")
        assert params["id"] == "123"
    
    def test_build_url(self):
        router = Router()
        router.add_route("/user/<id>", lambda: None, name="user")
        url = router.build_url("user", id=123)
        assert url == "/user/123"
