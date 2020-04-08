FROM node:10-alpine as front-builder

ARG VERSION
WORKDIR /app
COPY ui/ .
RUN npm version $VERSION
RUN apk add yarn --update
RUN yarn install && yarn run build

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
COPY --from=front-builder /app/build static
COPY config.yml config.yml

CMD ["/app/dashboard"]
