default:
    npm run dev

build:
    npx vite build
    # make the worker path relative because Vite won't
    sed -i -e 's/beatWorker/\.\/beatWorker/' dist/assets/index-*.js

deploy: build
    netlify deploy --no-build -d dist --prod

zip:
    advzip -a game.zip dist/*

publish: build
    butler push dist dalps/smallrow:browser # -v