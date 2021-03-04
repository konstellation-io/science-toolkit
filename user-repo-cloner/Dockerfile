FROM golang:1.14 as builder

# Build the binary statically.
ENV CGO_ENABLED=0

WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o user-repo-cloner .


FROM alpine

WORKDIR /app
COPY --from=builder /app/user-repo-cloner .

CMD ["/app/user-repo-cloner"]
