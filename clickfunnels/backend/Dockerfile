FROM rust:1.75-alpine AS builder

WORKDIR /app

RUN apk add --no-cache musl-dev

COPY Cargo.toml Cargo.lock ./
COPY crates ./crates

RUN cargo build --release

FROM alpine:latest

RUN apk add --no-cache libgcc

COPY --from=builder /app/target/release/clickfunnels-api /usr/local/bin/

EXPOSE 8000

CMD ["clickfunnels-api"]
