docker build -t middleware:latest . && \
docker tag middleware:latest quay.io/rj-neuralseek/proto-wa-middleware:latest && \
docker push quay.io/rj-neuralseek/proto-wa-middleware:latest