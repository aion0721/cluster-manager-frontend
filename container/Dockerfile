# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS build

WORKDIR /app

ARG VITE_AUTH_MODE=keycloak
ARG VITE_KEYCLOAK_AUTH_SERVER_URL
ARG VITE_KEYCLOAK_CLIENT_ID=sample-client

ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
ENV VITE_KEYCLOAK_AUTH_SERVER_URL=$VITE_KEYCLOAK_AUTH_SERVER_URL
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:1.27-alpine

COPY container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]