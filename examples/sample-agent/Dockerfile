FROM python:3.11-slim
WORKDIR /app
COPY agent.py requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8080
CMD ["python", "agent.py"]
