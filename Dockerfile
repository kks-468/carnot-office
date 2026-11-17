# Carnot office: 화면(React) + 서버(Spring Boot)를 실행 파일 하나로 묶어요.
# docker build -t carnot-office .

FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM gradle:8.14.3-jdk21 AS api
WORKDIR /app
COPY backend/ ./
COPY --from=web /web/dist/ src/main/resources/static/
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 1001 carnot
COPY --from=api /app/build/libs/*.jar app.jar
USER carnot
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
