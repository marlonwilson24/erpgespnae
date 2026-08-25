# 1. Criar projeto Vite com React + TS
npm create vite@latest pnae-system -- --template react-ts

# 2. Instalar dependências
cd pnae-system
npm install react-router-dom @supabase/supabase-js @tanstack/react-query 
npm install react-hook-form @hookform/resolvers zod
npm install tailwindcss @tailwindcss/vite
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
npm install recharts @tanstack/react-table

# 3. Configurar Tailwind e Shadcn/ui
npx shadcn-ui@latest init

# 4. Criar .env com credenciais do Supabase
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave