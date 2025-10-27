default:
    npm run dev

build:
    npx vite build

deploy: build
    netlify deploy --no-build -d dist --prod