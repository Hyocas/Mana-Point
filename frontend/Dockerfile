# --- Estágio 1: O "Construtor" (Builder) ---
# Usamos uma imagem Node para ter as ferramentas de build (npm)
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência e instala elas
# Isso aproveita o cache do Docker se as dependências не mudarem
COPY package.json package-lock.json ./
RUN npm install

# Copia todo o resto do código-fonte do frontend
COPY . .

# Roda o comando de build para gerar a pasta 'dist'
RUN npm run build

# --- Estágio 2: O "Servidor" (Final) ---
# Usamos uma imagem super leve do Nginx para servir os arquivos
FROM nginx:stable-alpine

# Copia os arquivos da pasta 'dist' que foram gerados no estágio anterior
# para a pasta padrão que o Nginx usa para servir sites.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80, que é a porta padrão do Nginx
EXPOSE 80

# O comando para iniciar o servidor Nginx
CMD ["nginx", "-g", "daemon off;"]