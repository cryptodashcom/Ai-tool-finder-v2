#!/usr/bin/env bash
set -euo pipefail

# n8n setup script — generates secrets and starts services

ENV_FILE="$(dirname "$0")/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env from .env.example..."
  cp "$(dirname "$0")/.env.example" "$ENV_FILE"

  # Auto-generate secure random secrets
  ENC_KEY=$(openssl rand -hex 32)
  JWT_SECRET=$(openssl rand -hex 32)

  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/your_32_byte_hex_encryption_key_here/$ENC_KEY/" "$ENV_FILE"
    sed -i '' "s/your_32_byte_hex_jwt_secret_here/$JWT_SECRET/" "$ENV_FILE"
  else
    sed -i "s/your_32_byte_hex_encryption_key_here/$ENC_KEY/" "$ENV_FILE"
    sed -i "s/your_32_byte_hex_jwt_secret_here/$JWT_SECRET/" "$ENV_FILE"
  fi

  echo ""
  echo "  .env created with auto-generated secrets."
  echo "  Edit n8n/.env to set POSTGRES_PASSWORD and N8N_HOST before starting."
  echo ""
  exit 0
fi

echo "Starting n8n..."
docker compose -f "$(dirname "$0")/docker-compose.yml" --env-file "$ENV_FILE" up -d

echo ""
echo "n8n is starting at http://$(grep N8N_HOST "$ENV_FILE" | cut -d= -f2):$(grep N8N_PORT "$ENV_FILE" | cut -d= -f2 || echo 5678)"
echo "Run 'docker compose -f n8n/docker-compose.yml logs -f n8n' to follow logs."
