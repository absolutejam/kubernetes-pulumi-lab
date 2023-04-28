# k6

## Transpile scripts

- Transpile the k6 `.js` scripts

  ```bash
  npm run transpile
  ```

  or to watch

  ```bash
  npm run transpile:watch
  ```

## Run a load test

- To run a load test in a Docker container:

  ```bash
  ./k6 run test.js
  ```

- **NOTE: This requires the .ts configs to be transpiled!**

- Or, to drop down into a shell:

  ```bash
  SHELL=true ./k6 -c "wget http://localhost:8090"
  ```
