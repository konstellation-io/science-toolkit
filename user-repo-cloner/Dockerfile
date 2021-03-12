FROM golang:1.14 as builder

# Build the binary statically.
ENV CGO_ENABLED=0

WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o user-repo-cloner .


FROM alpine:3.10.2

# Create kre user.
ENV USER=kdl
ENV UID=1000
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/home/kdl" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    "${USER}"

RUN apk add git openssh-client --update

WORKDIR /app
COPY --from=builder /app/user-repo-cloner .
COPY --from=builder /app/config.yml .

RUN chown -R kdl:0 /app \
    && chmod -R g+w /app

USER kdl

CMD ["/app/user-repo-cloner"]
