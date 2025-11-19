FROM eclipse-temurin:21-jdk-alpine as build
WORKDIR /workspace/app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests -Dproject.build.sourceEncoding=UTF-8

RUN ls -la /workspace/app/target/

FROM eclipse-temurin:21-jre-alpine as runtime
WORKDIR /app

# Utwórz główny katalog danych i podkatalogi
RUN mkdir -p /app/data/DnD \
    /app/data/fog-states \
    /app/data/grid-configs \
    /app/data/characters \
    /app/data/settings

COPY --from=build /workspace/app/target/*.jar app.jar

# Sprawdź czy JAR został skopiowany
RUN ls -la /app/

EXPOSE 8080

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=docker", \
    "-Dfile.encoding=UTF-8", \
    "-jar", \
    "/app/app.jar"]

