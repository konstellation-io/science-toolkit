FROM golang:1.13 as builder

# Build the binary statically.
ENV CGO_ENABLED=0

WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o gitea-oauth2-setup .


FROM ubuntu

# RUN apk add -U --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/gitea-oauth2-setup .

CMD ["/app/gitea-oauth2-setup"]
