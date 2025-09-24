podman pod create --name=weaviate ^
--publish=8080:8080 ^
--publish=50051:50051 ^
--publish=11434:11434

podman create --pod=weaviate ^
--name=weaviate-db ^
--env-file=./env.txt ^
--volume=weaviate_data:/var/lib/weaviate ^
cr.weaviate.io/semitechnologies/weaviate:1.32.9

podman create --pod=weaviate ^
--name=ollama ^
--volume=ollama_data:/root/.ollama ^
docker.io/ollama/ollama:0.12.1