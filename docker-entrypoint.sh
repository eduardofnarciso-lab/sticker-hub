#!/bin/sh
# Gera env-config.js em runtime com as variáveis de ambiente do EasyPanel.
# Assim não precisa de Build Args — as vars são lidas quando o container inicia.
cat > /usr/share/nginx/html/env-config.js << EOF
window.__env = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_PUBLISHABLE_KEY: "${VITE_SUPABASE_PUBLISHABLE_KEY}",
  VITE_GROQ_API_KEY: "${VITE_GROQ_API_KEY}"
};
EOF

exec "$@"
