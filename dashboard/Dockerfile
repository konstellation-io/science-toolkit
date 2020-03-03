FROM golang:1.14 as builder

# Build the binary statically.
ENV CGO_ENABLED=0

WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o dashboard .


FROM alpine

WORKDIR /app
COPY --from=builder /app/dashboard .
COPY config.yml config.yml
COPY static static

CMD ["/app/dashboard"]
