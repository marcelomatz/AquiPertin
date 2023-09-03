# AquiPertin

Este é um projeto simplificado para buscar informações sobre lugares através da (New) Google Places API e apresentá-las de forma fácil e organizada. 

Ele é construído com as seguintes tecnologias:

* Frontend: HTML, CSS, JavaScript e Bootstrap
* Backend: Go e Gorilla (um framework web para Go)
* Ambiente: Docker

## Este projeto consiste em duas partes:

### Parte 1: Backend

Nossa aplicação backend foi escrita em Go, provendo uma API que é a responsável por buscar informações do Google Places API e retorná-las para nosso Frontend. 

Aqui está uma visão geral das funcionalidades de backend:

* Buscar lugares através da Google Places API
* Manejar CORS
* Servir as informações obtidas para o frontend

O código backend está contido no arquivo `main.go`.

O Dockerfile para o backend é o seguinte:
```dockerfile
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
```
### Parte 2: Frontend
A interface do usuário foi construída usando HTML, CSS, JavaScript (ES6) e Bootstrap. 

Ele consome a API fornecida pelo backend e apresenta as informações ao usuário de maneira amigável.
O código frontend está contido no arquivo index.html e search.js.
O Dockerfile para o frontend é o seguinte:

```dockerfile
# Use a imagem oficial do nginx
FROM nginx:alpine

# Copia os arquivos estáticos para a pasta de conteúdo do nginx
COPY . /usr/share/nginx/html

# Expõe a porta 80 para o nginx
EXPOSE 80
```
### Execução do Projeto
Para executar o projeto, você precisará construir e executar os contêineres Docker para cada parte.

Para o backend:
```bash
docker build -t backend .
docker run -p 8080:8080 -e GCP_TOKEN_PLACE_API=your_token backend
```
Para o frontend:
```bash
docker build -t frontend .
docker run -p 80:80 frontend
```
Lembre-se de substituir your_token pela sua chave de API do Google Places.

