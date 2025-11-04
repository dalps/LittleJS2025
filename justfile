default:
    npm run dev

build:
    npx vite build

deploy: build
    netlify deploy --no-build -d dist --prod

zip: build
    advzip -a game.zip dist/*

publish: zip
    butler push game.zip dalps/smallrow:browser