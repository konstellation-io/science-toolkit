FROM golang:1.14-alpine3.11 as builder
 
 # Build the binary statically.
 ENV CGO_ENABLED=0
 
 WORKDIR /app
 COPY go.* ./
 RUN go mod download
 COPY . .
 RUN go build -o cleaner .
 
 
 FROM alpine:3.11
 
 COPY --from=builder /app/cleaner /usr/local/bin/
 