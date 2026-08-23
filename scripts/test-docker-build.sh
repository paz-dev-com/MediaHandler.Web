#!/bin/bash
# Test Docker build locally with the same arguments used in GitHub Actions
# This helps verify the build works before pushing to trigger the workflow

set -e

echo "🐳 Testing Docker build with production-like arguments..."
echo ""

# Use test values that match production structure
docker build \
  --progress=plain \
  --build-arg API_BASE_URL=/api/v1 \
  --build-arg PROD_API_BASE_URL=/api/v1 \
  --build-arg AUTH0_DOMAIN=dev-test.auth0.com \
  --build-arg AUTH0_CLIENT_ID=test-client-id-12345 \
  --build-arg AUTH0_AUDIENCE=test-audience \
  --build-arg AUTH0_REDIRECT_URI=https://test.example.com/auth/callback \
  --build-arg PROD_AUTH0_AUDIENCE=test-audience \
  --build-arg PROD_AUTH0_REDIRECT_URI=https://test.example.com/auth/callback \
  -t mediahandler-web:test \
  .

echo ""
echo "✅ Build succeeded!"
echo ""
echo "🔍 Checking environment files in the built image..."
echo ""

# Extract and check the production environment file
docker run --rm mediahandler-web:test sh -c '
  find /app/dist/browser -name "main*.js" -type f | head -1 | xargs cat | grep -o "apiBaseUrl:\"[^\"]*\"" | head -1
' || echo "❌ Could not find apiBaseUrl in built files"

echo ""
echo "Expected: apiBaseUrl:\"/api/v1\""
echo "If you see apiBaseUrl:\"https://localhost:7040/api/v1\", the build args are not being used correctly."
echo ""
echo "To inspect the full image:"
echo "  docker run --rm -it mediahandler-web:test sh"
echo ""
echo "To clean up:"
echo "  docker rmi mediahandler-web:test"

