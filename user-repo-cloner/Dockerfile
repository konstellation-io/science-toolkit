FROM golang:1.14 as builder

# Build the binary statically.
ENV CGO_ENABLED=0

WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o user-repo-cloner .


FROM alpine

# Create kre user.
ENV USER=kdl
ENV UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/home/kdl" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    "${USER}"

WORKDIR /app
COPY --from=builder /app/user-repo-cloner .

RUN chown -R kdl:0 /app \
    && chmod -R g+w /app

USER kdl

CMD ["/app/user-repo-cloner"]
