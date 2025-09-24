@REM Need to load the model after starting the ollama container
@REM Note that you can remove and re-create the pod without losing the model, as it's stored in a volume
podman exec -it ollama ollama pull nomic-embed-text
