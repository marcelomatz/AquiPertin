# Build stage
FROM golang:1.20-alpine AS build
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/service

# Runtime stage
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/.env /app/.env
COPY --from=build /bin/service /app/service
ENV GCP_TOKEN_PLACE_API=default_value
EXPOSE 8080
ENTRYPOINT ["/app/service"]